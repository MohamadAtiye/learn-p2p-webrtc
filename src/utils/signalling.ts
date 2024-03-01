export enum mType {
  ready = "ready",
  offer = "offer",
  answer = "answer",
  candidate = "candidate",
  hangup = "hangup",
}
export type Message = {
  type: mType;
  data?: any;
};

export class Signal {
  s;
  meetId;

  constructor(meetId: string) {
    this.s = new BroadcastChannel(meetId);
    this.meetId = meetId;
  }

  listen = (cb: (m: Message) => void) => {
    this.s.onmessage = (e) => {
      const m: Message = e.data;
      console.log("got ", m.type, m.data);
      cb && cb(m);
    };
  };

  send = (type: mType, data: any) => {
    console.log("sent ", type, data);
    this.s.postMessage({
      type,
      data,
    });
  };

  sendReady = (name: string) => {
    this.send(mType.ready, name);
  };

  sendOffer = (offer: RTCSessionDescriptionInit) => {
    const data = {
      type: "offer",
      sdp: offer.sdp,
    };
    this.send(mType.offer, data);
  };

  sendAnswer = (answer: RTCSessionDescriptionInit) => {
    const data = {
      type: "answer",
      sdp: answer.sdp,
    };
    this.send(mType.answer, data);
  };

  sendCandidate = (e: RTCPeerConnectionIceEvent) => {
    if (!e.candidate) return this.send(mType.candidate, undefined);

    const data = {
      candidate: e.candidate.candidate,
      sdpMLineIndex: e.candidate?.sdpMLineIndex ?? undefined,
      sdpMid: e.candidate?.sdpMid ?? undefined,
    };
    this.send(mType.candidate, data);
  };
}
