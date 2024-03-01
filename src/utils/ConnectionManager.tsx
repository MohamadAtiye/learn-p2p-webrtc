import { EventEmitter } from "events";
import { Message, Signal, mType } from "./signalling";

// type RTCPeerConnectionState = "closed" | "connected" | "connecting" | "disconnected" | "failed" | "new"

export type Peer = {
  myName: string;
  remoteName: string;
  meetId: string;
  status: RTCPeerConnectionState; //"on" | "off";

  myStream?: MediaStream;
  remoteStream?: MediaStream;

  errors: string[];
  logs: string[];
};

export type DataMsg = {
  type: "chat" | "whoAreYou" | "iAm";
  data: string;
};

export class ConnectionManager extends EventEmitter {
  pcs = {
    data: new RTCPeerConnection(),
    in: new RTCPeerConnection(),
    out: new RTCPeerConnection(),
  };
  dataChannel;
  connection: Peer = {
    myName: "",
    remoteName: "",
    meetId: "",
    status: "new",

    myStream: undefined,
    remoteStream: undefined,

    errors: [],
    logs: [],
  };
  signal;

  constructor(myName: string, meetId: string) {
    super();
    this.connection.myName = myName;
    this.connection.meetId = meetId;
    this.signal = new Signal(meetId);
    this.signal.sendReady(myName);

    this.dataChannel = this.pcs.data.createDataChannel("MyApp Channel");
    this.dataChannel.onopen = (d) => {
      if (!this.connection.remoteName) {
        this.dataChannel.send(JSON.stringify({ type: "whoAreYou" }));
      }
    };
    this.dataChannel.onmessage = (d) => console.log("dataChannel onmessage", d);
    this.dataChannel.onclose = (d) => console.log("dataChannel onclose", d);

    this.pcs.data.ondatachannel = (event) => {
      console.log("Receive Channel Callback");
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (e: MessageEvent<any>) =>
        this.handleReceiveData(this, e);
      receiveChannel.onopen = (d) => console.log("receiveChannel onopen", d);
      receiveChannel.onclose = (d) => console.log("receiveChannel onclose", d);
    };
  }

  handleReceiveData(self: ConnectionManager, d: MessageEvent<any>) {
    console.log("receiveChannel onmessage", d.data);

    const msg: DataMsg = JSON.parse(d.data);
    if (msg.type === "chat") self.emit("chat", msg.data);
    else if (msg.type === "whoAreYou") {
      this.dataChannel.send(
        JSON.stringify({ type: "iAm", data: self.connection.myName })
      );
    } else if (msg.type === "iAm") {
      self.connection.remoteName = msg.data;
      this.emit("update", {
        field: "remoteName",
        value: this.connection.remoteName,
      });
    }
  }

  sendChat(data: string) {
    this.dataChannel.send(JSON.stringify({ type: "chat", data }));
    console.log("Sent Data: " + data);
  }

  init = () => {
    this.signal.listen((m) => {
      switch (m.type) {
        // handle someone joined room
        case mType.ready:
          this.handleGotReady(m);
          break;
        // handle someone sent me offer
        case mType.offer:
          this.handleGotOffer(m);
          break;
        // handle someone sent me answer
        case mType.answer:
          this.handleGotAnswer(m);
          break;
        // handle someone sent me candidate
        case mType.candidate:
          this.handleCandidate(m);
          break;
        default:
          break;
      }
    });

    this.pcs.data.onicecandidate = (e) => {
      if (e.candidate) {
        this.signal.sendCandidate(e);
      }
    };

    this.pcs.data.ontrack = (e) => {
      console.log("ontrack", e);
      this.connection.remoteStream = e.streams[0];
      this.emit("update", {
        field: "remoteStream",
        value: this.connection.remoteStream,
      });
    };

    this.pcs.data.onconnectionstatechange = (ev) => {
      this.emit("update", {
        field: "status",
        value: this.pcs.data.connectionState,
      });
      console.log("onconnectionstatechange", this.pcs.data.connectionState);
    };
  };

  // step 1: Person 1 create Offer for OUTGOING
  createOffer = async (): Promise<RTCSessionDescriptionInit | undefined> => {
    try {
      if (this.connection.myStream) {
        // check Stream tracks
        const videoTracks = this.connection.myStream.getVideoTracks();
        const audioTracks = this.connection.myStream.getAudioTracks();
        if (videoTracks.length > 0) {
          console.log(`Using video device: ${videoTracks[0].label}`);
        }
        if (audioTracks.length > 0) {
          console.log(`Using audio device: ${audioTracks[0].label}`);
        }

        this.emit("update", {
          field: "myStream",
          value: this.connection.myStream,
        });

        // add stream tracks to peer connection
        this.connection.myStream
          .getTracks()
          .forEach((track) =>
            this.pcs.data.addTrack(
              track,
              this.connection.myStream as MediaStream
            )
          );
      }

      // create offer with tracks
      const offer = await this.pcs.data.createOffer();

      // set local description
      this.pcs.data.setLocalDescription(offer);

      if (!offer || !offer.sdp) {
        this.connection.errors.push("Failed to createOffer");
        return;
      }

      this.signal.sendOffer(offer);

      // send offer to Person 2
      return offer;
    } catch (error) {
      console.error(error);
      return;
    }
  };

  // step 2: Person 2 received offer for INCOMMING, create answer and send back
  createAnswer = async (
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | undefined> => {
    try {
      await this.pcs.data.setRemoteDescription(offer);

      const answer = await this.pcs.data.createAnswer();

      this.pcs.data.setLocalDescription(answer);

      // send andswer to Person 1
      return answer;
    } catch (e) {
      console.error(e);
      return;
    }
  };

  // step 3: Person 1 receive answer for OUTGOING
  receiveAnswer = async (answer: RTCSessionDescriptionInit) => {
    await this.pcs.data.setRemoteDescription(answer);
  };

  //-- MESSAGE HANDLERS
  handleGotReady = async (m: Message) => {
    //if already connected, ignore
    if (this.connection.status === "connected") {
      console.log("GOT READY MESSAGE", m);
      console.log("ALREADY BUSY, WILL IGNORE");
      return;
    }

    this.connection.remoteName = m.data;

    await this.createOffer();

    this.emit("update", {
      field: "remoteName",
      value: this.connection.remoteName,
    });
  };

  handleGotOffer = async (m: Message) => {
    const answer = await this.createAnswer(m.data);
    if (!answer || !answer.sdp) {
      this.connection.errors.push("Failed to answer");
      return;
    }

    this.signal.sendAnswer(answer);
  };

  handleGotAnswer = (m: Message) => {
    this.receiveAnswer(m.data);
  };

  handleCandidate = async (m: Message) => {
    await this.pcs.data.addIceCandidate(m.data);
  };

  //-- MEDIA HANDLERS
  addVideo(stream: MediaStream) {
    if (this.connection.myStream) {
      console.log(this.connection.myStream, "exist, NOT adding stream");
    } else {
      this.connection.myStream = stream;
      return this.createOffer();
    }
  }
}
