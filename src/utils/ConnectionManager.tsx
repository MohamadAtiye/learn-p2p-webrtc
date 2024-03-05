import { EventEmitter } from "events";
import { PollTypes, Polling } from "./polling";

const POLL_URL = window.location.href + "api/poll.php";
// const POLL_URL = "http://localhost:8001/poll.php";

// type RTCPeerConnectionState = "closed" | "connected" | "connecting" | "disconnected" | "failed" | "new"

export enum DataMsgType {
  hangup = "hangup",
  chat = "chat",
  whoAreYou = "whoAreYou",
  iAm = "iAm",
}

export type DataMsg = {
  type: DataMsgType;
  data: string;
};

enum CallStatus {
  new = "new",
  sentReady = "sentReady",
  gotReady = "gotReady",
  sentOffer = "sentOffer",
  gotOffer = "gotOffer",
  sentAnswer = "sentAnswer",
  gotAnswer = "gotAnswer",
}

export class ConnectionManager extends EventEmitter {
  pc = new RTCPeerConnection();

  dataChannel;

  myName = "";
  remoteName = "";
  meetId = "";
  status = "new";

  callStatus: CallStatus = CallStatus.new; // 'ready','setOffer','gotOffer','sendAnswer','gotAnswer'
  setCallStatus(s: CallStatus) {
    this.callStatus = s;
    this.emit("callStatus", this.callStatus);
  }

  myStream = new MediaStream();

  errors: string[] = [];
  logs: string[] = [];

  polling = new Polling(POLL_URL);

  constructor() {
    super();

    this.dataChannel = this.pc.createDataChannel("MyApp Channel");
    this.dataChannel.onopen = (d) => {
      if (!this.remoteName) {
        this.dataChannelSend(DataMsgType.whoAreYou, undefined);
      }
    };
    this.dataChannel.onmessage = (d) => console.log("dataChannel onmessage", d);
    this.dataChannel.onclose = (d) => console.log("dataChannel onclose", d);

    this.pc.ondatachannel = (event) => {
      console.log("Receive Channel Callback");
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (e: MessageEvent<any>) =>
        this.handleReceiveData(this, e);
      receiveChannel.onopen = (d) => console.log("receiveChannel onopen", d);
      receiveChannel.onclose = (d) => console.log("receiveChannel onclose", d);
    };
  }

  postPoll(type: PollTypes, data?: any) {
    this.polling.post(type, data);
    switch (type) {
      case PollTypes.ready:
        this.setCallStatus(CallStatus.sentReady);
        break;
      case PollTypes.offer:
        this.setCallStatus(CallStatus.sentOffer);
        break;
      case PollTypes.answer:
        this.setCallStatus(CallStatus.sentAnswer);
        break;
    }
  }

  init = (myName: string, meetId: string) => {
    this.myName = myName;
    this.meetId = meetId;
    this.emit("update", "meetId");
    this.emit("update", "myName");

    this.polling.setData(this.myName, this.meetId);
    this.polling.start((type: PollTypes, data: string) => {
      if (!type) return;

      switch (type) {
        // handle someone joined room
        case PollTypes.ready:
          this.setCallStatus(CallStatus.gotReady);
          this.handleGotReady(data);
          break;
        // handle someone sent me offer
        case PollTypes.offer:
          this.setCallStatus(CallStatus.gotOffer);
          this.handleGotOffer(data);
          break;
        // handle someone sent me answer
        case PollTypes.answer:
          this.setCallStatus(CallStatus.gotAnswer);
          this.handleGotAnswer(data);
          break;
        // handle someone sent me candidate
        case PollTypes.candidate:
          this.handleCandidate(data);
          break;
        default:
          break;
      }
    });

    //finish first POLL before sending ready
    setTimeout(() => {
      console.log(this.callStatus);
      if (this.callStatus === CallStatus.new)
        this.postPoll(PollTypes.ready, "nodata");
    }, 4000);

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        if (!e.candidate) return this.postPoll(PollTypes.candidate);

        const data = {
          candidate: e.candidate.candidate,
          sdpMLineIndex: e.candidate?.sdpMLineIndex ?? undefined,
          sdpMid: e.candidate?.sdpMid ?? undefined,
        };
        this.postPoll(PollTypes.candidate, JSON.stringify(data));
      }
    };

    this.pc.onnegotiationneeded = (e) => {
      console.log("this.pc.onnegotiationneeded", e);
      this.createOffer();
    };

    this.pc.onconnectionstatechange = (ev) => {
      this.status = this.pc.connectionState;
      this.emit("update", "status");
      console.log("onconnectionstatechange", this.pc.connectionState);
    };
  };

  handleReceiveData(self: ConnectionManager, d: MessageEvent<any>) {
    console.log("receiveChannel onmessage", d.data);

    const msg: DataMsg = JSON.parse(d.data);
    if (msg.type === "chat") self.emit("chat", msg.data);
    else if (msg.type === "whoAreYou") {
      this.dataChannelSend(DataMsgType.iAm, self.myName);
    } else if (msg.type === "iAm") {
      self.remoteName = msg.data;
      this.emit("update", "remoteName");
    }
  }

  // TODO sanitise data
  private dataChannelSend(type: DataMsgType, payload: any) {
    let data = !payload
      ? undefined
      : typeof payload === "string"
      ? payload
      : JSON.stringify(payload);
    console.log("dataChannelSend", type, payload);
    this.dataChannel.send(JSON.stringify({ type, data }));
  }

  sendChat(data: string) {
    this.dataChannelSend(DataMsgType.chat, data);
    console.log("Sent Data: " + data);
  }

  // step 1: Person 1 create Offer for OUTGOING
  createOffer = async (): Promise<RTCSessionDescriptionInit | undefined> => {
    try {
      // create offer with tracks
      const offer = await this.pc.createOffer();

      // set local description
      this.pc.setLocalDescription(offer);

      if (!offer || !offer.sdp) {
        this.errors.push("Failed to createOffer");
        return;
      }

      this.postPoll(PollTypes.offer, offer.sdp);

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
      await this.pc.setRemoteDescription(offer);

      const answer = await this.pc.createAnswer();

      this.pc.setLocalDescription(answer);

      // send andswer to Person 1
      return answer;
    } catch (e) {
      console.error(e);
      return;
    }
  };

  // step 3: Person 1 receive answer for OUTGOING
  receiveAnswer = async (answer: RTCSessionDescriptionInit) => {
    await this.pc.setRemoteDescription(answer);

    this.emit("update", "senders");
  };

  //-- MESSAGE HANDLERS
  handleGotReady = async (data: string) => {
    //if already connected, ignore
    if (this.status === "connected") {
      console.log("GOT READY MESSAGE", data);
      console.log("ALREADY BUSY, WILL IGNORE");
      return;
    }

    this.remoteName = data;

    await this.createOffer();

    this.emit("update", "remoteName");
  };

  handleGotOffer = async (data: string) => {
    const answer = await this.createAnswer({ type: "offer", sdp: data });
    if (!answer || !answer.sdp) {
      this.errors.push("Failed to answer");
      return;
    }

    this.postPoll(PollTypes.answer, answer.sdp);
  };

  handleGotAnswer = (data: string) => {
    this.receiveAnswer({ type: "answer", sdp: data });
  };

  handleCandidate = async (data: any) => {
    await this.pc.addIceCandidate(JSON.parse(data));
  };

  //-- MEDIA HANDLERS
  addTrack(stream: MediaStream) {
    if (!stream) return;

    const senders = this.pc.getSenders();

    // add missing tracks to PC
    stream.getTracks().forEach((track) => {
      if (!senders.find((s) => s.track?.id === track.id)) {
        console.log("adding new track to PC", track);
        this.pc.addTrack(track, this.myStream as MediaStream);
      }
    });
  }

  closeTrack(sender: RTCRtpSender) {
    if (sender.track) {
      this.myStream.removeTrack(sender.track);
      sender.track.stop();
    }
    this.pc.removeTrack(sender);
  }
}
