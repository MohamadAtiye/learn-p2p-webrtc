import { Box, Typography } from "@mui/material";
import useData from "../hooks/Data";
import { useEffect, useState } from "react";
import DisplayVideo from "./DisplayVideo";
import AudioVisualizer from "./AudioVisualizer";
import ReceiverMediaBox from "./ReceiverMediaBox";

const RemoteBox = () => {
  const { connectionManager } = useData();

  const [remoteName, setRemoteName] = useState("");
  const [receivers, setReceivers] = useState<RTCRtpReceiver[]>([]);
  const [status, setStatus] = useState("new");

  useEffect(() => {
    function handleUpdates(field: string) {
      console.log("got update", field);
      if (field === "remoteStream") {
        const receivers = connectionManager.pc.getReceivers();
        setReceivers(receivers);
      } else if (field === "remoteName") {
        setRemoteName(connectionManager.remoteName);
      } else if (field === "status") {
        setStatus(connectionManager.status);
      }
    }
    connectionManager.on("update", handleUpdates);

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
        padding: "0 24px",
      }}
    >
      <Typography variant="h6" align="center">
        {remoteName}
      </Typography>

      {receivers.map(
        (r) => r.track && <ReceiverMediaBox receiver={r} key={r.track.id} />
      )}
    </Box>
  );
};

export default RemoteBox;
