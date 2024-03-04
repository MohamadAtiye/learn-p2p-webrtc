import useData from "../hooks/Data";
import { useEffect, useState } from "react";

import SenderMediaBox from "./SenderMediaBox";

const Senders = () => {
  const { connectionManager } = useData();
  const [senders, setSenders] = useState<RTCRtpSender[]>([]);

  useEffect(() => {
    function handleUpdates(field: string) {
      if (field === "senders") {
        const s = connectionManager.pc.getSenders();
        console.log("SENDERS UPDATE", s);
        setSenders(s);
      }
    }
    connectionManager.on("update", handleUpdates);

    return () => {
      connectionManager.off("update", handleUpdates);
    };
  }, [connectionManager]);

  return (
    <>
      {senders.map(
        (s) => s.track && <SenderMediaBox sender={s} key={s.track.id} />
      )}
    </>
  );
};
export default Senders;
