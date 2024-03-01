import { EventEmitter } from "events";
import { Message, Signal, mType } from "./signalling";

// type RTCPeerConnectionState = "closed" | "connected" | "connecting" | "disconnected" | "failed" | "new"

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

  myName = "";
  remoteName = "";
  meetId = "";
  status = "new";

  myStream = new MediaStream();
  remoteStream = new MediaStream();

  errors: string[] = [];
  logs: string[] = [];

  signal = new Signal("webtc");

  constructor() {
    super();

    this.dataChannel = this.pcs.data.createDataChannel("MyApp Channel");
    this.dataChannel.onopen = (d) => {
      if (!this.remoteName) {
        this.dataChannelSend(mType.whoAreYou, undefined);
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

  init = (myName: string, meetId: string) => {
    this.myName = myName;
    this.meetId = meetId;
    this.emit("update", "meetId");
    this.emit("update", "myName");

    this.signal.sendReady(myName);

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
      this.remoteStream = e.streams[0];
      this.emit("update", "remoteStream");
    };

    this.pcs.data.onconnectionstatechange = (ev) => {
      this.status = this.pcs.data.connectionState;
      this.emit("update", "status");
      console.log("onconnectionstatechange", this.pcs.data.connectionState);
    };
  };

  handleReceiveData(self: ConnectionManager, d: MessageEvent<any>) {
    console.log("receiveChannel onmessage", d.data);

    const msg: DataMsg = JSON.parse(d.data);
    if (msg.type === "chat") self.emit("chat", msg.data);
    else if (msg.type === "whoAreYou") {
      this.dataChannelSend(mType.iAm, self.myName);
    } else if (msg.type === "iAm") {
      self.remoteName = msg.data;
      this.emit("update", "remoteName");
    }
  }

  // TODO sanitise data
  private dataChannelSend(type: mType, payload: any) {
    let data = !payload
      ? undefined
      : typeof payload === "string"
      ? payload
      : JSON.stringify(payload);
    console.log("dataChannelSend", type, payload);
    this.dataChannel.send(JSON.stringify({ type, data }));
  }

  sendChat(data: string) {
    this.dataChannelSend(mType.chat, data);
    console.log("Sent Data: " + data);
  }

  // step 1: Person 1 create Offer for OUTGOING
  createOffer = async (): Promise<RTCSessionDescriptionInit | undefined> => {
    try {
      const myTracks = this.myStream.getTracks();
      myTracks.forEach((t) => {
        console.log(`using ${t.kind} track ${t.label}`);
      });

      const senders = this.pcs.data.getSenders();
      console.log("senders", senders);

      // add missing tracks to PC
      myTracks.forEach((track) => {
        if (!senders.find((s) => s.track?.id === track.id)) {
          console.log("adding new track to PC", track);
          this.pcs.data.addTrack(track, this.myStream as MediaStream);
        }
      });

      // create offer with tracks
      const offer = await this.pcs.data.createOffer();

      // set local description
      this.pcs.data.setLocalDescription(offer);

      if (!offer || !offer.sdp) {
        this.errors.push("Failed to createOffer");
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
    if (this.status === "connected") {
      console.log("GOT READY MESSAGE", m);
      console.log("ALREADY BUSY, WILL IGNORE");
      return;
    }

    this.remoteName = m.data;

    await this.createOffer();

    this.emit("update", "remoteName");
  };

  handleGotOffer = async (m: Message) => {
    const answer = await this.createAnswer(m.data);
    if (!answer || !answer.sdp) {
      this.errors.push("Failed to answer");
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
  addTrack(stream: MediaStream) {
    if (!stream) return;
    const newTracks = stream.getTracks();
    const myTracks = this.myStream.getTracks();

    newTracks.forEach((t) => {
      if (!myTracks.find((mt) => mt.id === t.id)) {
        this.myStream.addTrack(t);
      }
    });

    this.emit("update", "myStream");

    return this.createOffer();
  }
}
