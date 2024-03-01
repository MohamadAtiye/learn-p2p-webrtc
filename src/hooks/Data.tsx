import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import {
  getMediaStream,
  requestCameraPermission,
  requestMicrophonePermission,
} from "../utils/webrtcWrapper";
import FullPageLoading from "../fragments/FullPageLoading";
import { ConnectionManager, Peer } from "../utils/ConnectionManager";

// Define the shape of the context state
interface DataContextState {
  permissions: {
    camera: PermissionState;
    microphone: PermissionState;
  };
  joinMeeting: (name: string, meetId: string) => void;
  connection: Peer;
  sendChat: (text: string) => void;
  chat: ChatMsg[];
  addVideo: () => void;
}

// Create Context Object
export const DataContext = createContext<DataContextState>({
  permissions: {
    camera: "denied",
    microphone: "denied",
  },
  joinMeeting: (name: string, meetId: string) => {},
  connection: {
    myName: "",
    remoteName: "",
    meetId: "",
    status: "new",

    myStream: undefined,
    remoteStream: undefined,

    errors: [],
    logs: [],
  },
  sendChat: (t) => {},
  chat: [],
  addVideo: () => {},
});

export type ChatMsg = {
  from: "me" | "remote";
  text: string;
  ts: number;
};

// Define the props for the provider component
interface DataContextProviderProps {
  children: ReactNode;
}
// Create a provider for components to consume and subscribe to changes
export const DataContextProvider: React.FC<DataContextProviderProps> = ({
  children,
}) => {
  const [permissions, setPermissions] = useState({
    camera: "denied" as PermissionState,
    microphone: "denied" as PermissionState,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionManager, setConnectionManager] =
    useState<ConnectionManager>();
  const [chat, setChat] = useState<ChatMsg[]>([]);

  const [connection, setConnection] = useState<Peer>({
    myName: "",
    remoteName: "",
    meetId: "",
    status: "new",

    myStream: undefined,
    remoteStream: undefined,

    errors: [],
    logs: [],
  });

  // monitor camera and microphone permissions
  useEffect(() => {
    (async () => {
      requestCameraPermission().then((camera) => {
        setPermissions((p) => ({ ...p, camera: camera?.state ?? "denied" }));
        camera?.addEventListener("change", (ev) => {
          setPermissions((p) => ({
            ...p,
            camera: (ev.target as any).state ?? "denied",
          }));
          console.log("camera permission change", ev);
        });
      });

      requestMicrophonePermission().then((microphone) => {
        setPermissions((p) => ({
          ...p,
          microphone: microphone?.state ?? "denied",
        }));
        microphone?.addEventListener("change", (ev) => {
          setPermissions((p) => ({
            ...p,
            microphone: (ev.target as any).state ?? "denied",
          }));
          console.log("microphone permission change", ev);
        });
      });
    })();
  }, []);

  //monitor connection manager events
  useEffect(() => {
    function updateConnection({ field, value }: { field: string; value: any }) {
      console.log("updateConnection", field, value);
      setConnection((p) => ({ ...p, [field]: value }));
    }

    function handleChat(data: string) {
      setChat((p) => [...p, { from: "remote", ts: Date.now(), text: data }]);
    }

    connectionManager && connectionManager.on("update", updateConnection);
    connectionManager && connectionManager.on("chat", handleChat);

    return () => {
      connectionManager && connectionManager.off("update", updateConnection);
      connectionManager && connectionManager.off("chat", handleChat);
    };
  }, [connectionManager]);

  const joinMeeting = async (myName: string, meetId: string) => {
    //setLoading true
    setIsLoading(true);

    try {
      setConnection((p) => ({ ...p, meetId, myName }));
      const newConnection = new ConnectionManager(myName, meetId);
      newConnection.init();
      setConnectionManager(newConnection);

      // do backend stuff
    } catch (e) {
      if (e instanceof Error) console.log("Something went wrong", e.message);
      else console.error(e);
    }

    //setLoading false
    setTimeout(() => setIsLoading(false), 500);
  };

  const sendChat = (text: string) => {
    setChat((p) => [...p, { from: "me", ts: Date.now(), text }]);
    connectionManager?.sendChat(text);
  };

  const addVideo = async () => {
    if (connection.status !== "connected") return;
    const videoStream = await getMediaStream({ video: true, audio: false });
    if (!videoStream) {
      console.log("failed to get stream");
      return;
    }
    connectionManager?.addVideo(videoStream);
  };

  return (
    <DataContext.Provider
      value={{ permissions, joinMeeting, connection, sendChat, chat, addVideo }}
    >
      {isLoading && <FullPageLoading />}
      {children}
    </DataContext.Provider>
  );
};

const useData = () => {
  return useContext(DataContext);
};

export default useData;
