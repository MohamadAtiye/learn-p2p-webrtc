import { Box, Typography } from "@mui/material";
import useData from "../hooks/Data";
import { useEffect, useState } from "react";
import ReceiverMediaBox from "./ReceiverMediaBox";

const Receivers = () => {
  const { connectionManager } = useData();

  const [receivers, setReceivers] = useState<RTCRtpReceiver[]>([]);

  useEffect(() => {
    console.log("receivers useEffect", receivers);
  }, [receivers]);

  useEffect(() => {
    function updateReceivers() {
      const temp = connectionManager.pc
        .getReceivers()
        .filter((r) => r.track.readyState === "live");
      console.log("updateReceivers", temp);
      setReceivers(temp);
    }

    connectionManager.pc.ontrack = (e) => {
      e.streams[0].onaddtrack = (ev) => {
        console.log("e.streams[0].onaddtrack", ev);
        updateReceivers();
      };
      e.streams[0].onremovetrack = (ev) => {
        console.log("e.streams[0].onremovetrack", ev);
        ev.track.stop();
        updateReceivers();
      };

      e.track.onended = (ev) => console.log("e.track.onended", ev);

      console.log("connectionManager.pc.ontrack", e);
      updateReceivers();
    };
  }, [connectionManager]);

  return (
    <>
      {receivers.map(
        (r) => r.track && <ReceiverMediaBox receiver={r} key={r.track.id} />
      )}
    </>
  );
};

export default Receivers;
