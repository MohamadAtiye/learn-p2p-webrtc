import { Box, Typography } from "@mui/material";
import useData from "../hooks/Data";
import { useEffect, useState } from "react";
import ReceiverMediaBox from "./ReceiverMediaBox";

const RemoteBox = () => {
  const { connectionManager } = useData();

  const [remoteName, setRemoteName] = useState("");
  const [receivers, setReceivers] = useState<RTCRtpReceiver[]>([]);

  useEffect(() => {
    console.log("receivers useEffect", receivers);
  }, [receivers]);

  useEffect(() => {
    function handleUpdates(field: string) {
      if (field === "remoteName") {
        setRemoteName(connectionManager.remoteName);
      }
    }

    function updateReceivers() {
      const temp = connectionManager.pc
        .getReceivers()
        .filter((r) => r.track.readyState === "live");
      console.log("updateReceivers", temp);
      setReceivers(temp);
    }

    connectionManager.on("update", handleUpdates);
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

    return () => {
      connectionManager.off("update", handleUpdates);
    };
  }, [connectionManager]);

  return (
    <Box
      sx={{
        border: "1px solid black",
        minWidth: "300px",
        flex: 1,
        overflowY: "scroll",
        height: "100%",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Typography variant="h6" align="center">
          {remoteName}
        </Typography>
      </Box>

      {receivers.map(
        (r) => r.track && <ReceiverMediaBox receiver={r} key={r.track.id} />
      )}
    </Box>
  );
};

export default RemoteBox;
