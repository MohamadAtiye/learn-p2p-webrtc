import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useMemo,
} from "react";
import {
  requestCameraPermission,
  requestMicrophonePermission,
} from "../utils/webrtcWrapper";
import FullPageLoading from "../fragments/FullPageLoading";
import { ConnectionManager } from "../utils/ConnectionManager";

// Define the shape of the context state
interface DataContextState {
  permissions: {
    camera: PermissionState;
    microphone: PermissionState;
  };
  joinMeeting: (name: string, meetId: string) => void;
  sendChat: (text: string) => void;
  chat: ChatMsg[];
  connectionManager: ConnectionManager;
  toggleChat: () => void;
  isChatOpen: boolean;
}

// Create Context Object
export const DataContext = createContext<DataContextState>({
  permissions: {
    camera: "denied",
    microphone: "denied",
  },
  joinMeeting: (name: string, meetId: string) => {},
  sendChat: (t) => {},
  chat: [],
  connectionManager: {} as ConnectionManager,
  toggleChat: () => {},
  isChatOpen: false,
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
  const connectionManager = useMemo(() => new ConnectionManager(), []);

  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const toggleChat = () => {
    setIsChatOpen((p) => !p);
  };

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
    function handleChat(data: string) {
      setChat((p) => [...p, { from: "remote", ts: Date.now(), text: data }]);
    }
    connectionManager && connectionManager.on("chat", handleChat);

    return () => {
      connectionManager && connectionManager.off("chat", handleChat);
    };
  }, [connectionManager]);

  const joinMeeting = async (myName: string, meetId: string) => {
    //setLoading true
    setIsLoading(true);

    try {
      connectionManager.init(myName, meetId);
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

  return (
    <DataContext.Provider
      value={{
        permissions,
        joinMeeting,
        sendChat,
        chat,
        connectionManager,
        toggleChat,
        isChatOpen,
      }}
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
