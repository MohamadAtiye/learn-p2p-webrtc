// type PermissionName = "geolocation" | "notifications" | "persistent-storage" | "push" | "screen-wake-lock" | "xr-spatial-tracking"

import { EventEmitter } from "events";
import { Message, Signal, mType } from "./signalling";

export const checkPermission = async (
  name: PermissionName | "camera" | "microphone"
): Promise<PermissionStatus | null> => {
  try {
    const permissionStatus = await navigator.permissions.query({
      name: name as PermissionName,
    });
    console.log(name, " permission state is ", permissionStatus.state);
    return permissionStatus;
  } catch (error) {
    console.log("Got error :", error);
    return null;
  }
};

export const requestCameraPermission =
  async (): Promise<PermissionStatus | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getVideoTracks().forEach((t) => t.stop());
      console.log("Camera access granted");
    } catch (error) {
      console.error("Error accessing Camera.", error);
    }
    return checkPermission("camera");
  };

export const requestMicrophonePermission =
  async (): Promise<PermissionStatus | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach((t) => t.stop());
      console.log("Microphone access granted");
    } catch (error) {
      console.error("Error accessing Microphone.", error);
    }
    return checkPermission("microphone");
  };

export const getMediaStream = async (
  constraints?: MediaStreamConstraints | undefined
): Promise<MediaStream | null> => {
  try {
    const constraints = {
      audio: true,
      video: true,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error("Error accessing media devices.", error);
    return null;
  }
};

export type Peer = {
  myName: string;
  remoteName: string;
  meetId: string;
  status: "on" | "off";

  pc: RTCPeerConnection;
  myStream?: MediaStream;
  remoteStream?: MediaStream;

  errors: string[];
  logs: string[];
};

export type MeetInfo = {
  myName: string;
  meetId: string;
};

export class ConnectionManager extends EventEmitter {
  connection: Peer = {
    myName: "",
    remoteName: "",
    meetId: "",
    status: "off",

    pc: new RTCPeerConnection(),
    myStream: undefined,
    remoteStream: undefined,

    errors: [],
    logs: [],
  };
  signal;

  constructor(meetInfo: MeetInfo) {
    super();
    this.connection.myName = meetInfo.myName;
    this.connection.meetId = meetInfo.meetId;
    this.signal = new Signal(meetInfo.meetId);
    this.signal.sendReady(meetInfo.myName);
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

    this.connection.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.signal.sendCandidate(e);
      }
    };

    this.connection.pc.ontrack = (e) => {
      console.log("ontrack", e);
      this.connection.remoteStream = e.streams[0];
      this.emit("update", {
        field: "remoteStream",
        value: this.connection.remoteStream,
      });
    };

    this.connection.pc.onconnectionstatechange = (ev) => {
      console.log("onconnectionstatechange", ev);
    };
  };

  // step 1: Person 1 create Offer on OUTGOING
  createOffer = async (
    localStream: MediaStream
  ): Promise<RTCSessionDescriptionInit | undefined> => {
    try {
      // check Stream tracks
      const videoTracks = localStream.getVideoTracks();
      const audioTracks = localStream.getAudioTracks();
      if (videoTracks.length > 0) {
        console.log(`Using video device: ${videoTracks[0].label}`);
      }
      if (audioTracks.length > 0) {
        console.log(`Using audio device: ${audioTracks[0].label}`);
      }

      // add stream tracks to peer connection
      localStream
        .getTracks()
        .forEach((track) => this.connection.pc.addTrack(track, localStream));

      // create offer with tracks
      const offer = await this.connection.pc.createOffer();

      // set local description
      this.connection.pc.setLocalDescription(offer);

      // send offer to Person 2
      return offer;
    } catch (error) {
      console.error(error);
      return;
    }
  };

  // step 2: Person 2 received offer and create answer on INCOMING
  createAnswer = async (
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | undefined> => {
    try {
      await this.connection.pc.setRemoteDescription(offer);

      const answer = await this.connection.pc.createAnswer();

      this.connection.pc.setLocalDescription(answer);

      // send andswer to Person 1
      return answer;
    } catch (e) {
      console.error(e);
      return;
    }
  };

  // step 3: Person 1 receive answer on OUTGOING
  receiveAnswer = async (answer: RTCSessionDescriptionInit) => {
    await this.connection.pc.setRemoteDescription(answer);
  };

  //-- MESSAGE HANDLERS
  handleGotReady = async (m: Message) => {
    this.connection.remoteName = m.data;

    const myStream = await getMediaStream();
    if (!myStream) {
      this.connection.errors.push("Failed to getMediaStream");
      return;
    }
    this.connection.myStream = myStream;
    const offer = await this.createOffer(myStream);
    if (!offer || !offer.sdp) {
      this.connection.errors.push("Failed to createOffer");
      return;
    }

    this.signal.sendOffer(offer);

    this.emit("update", {
      field: "remoteName",
      value: this.connection.remoteName,
    });
    this.emit("update", {
      field: "myStream",
      value: myStream,
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
    await this.connection.pc.addIceCandidate(m.data);
  };
}
