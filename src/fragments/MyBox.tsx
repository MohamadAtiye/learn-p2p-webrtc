import { Box, Typography } from "@mui/material";
import useData from "../hooks/Data";
import { useEffect, useState } from "react";

import SenderMediaBox from "./SenderMediaBox";
import MediaDevicesSelector from "./MediaDevicesSelector";

const MyBox = () => {
  const { connectionManager } = useData();
  const [myName, setMyName] = useState("");
  const [senders, setSenders] = useState<RTCRtpSender[]>([]);

  useEffect(() => {
    function handleUpdates(field: string) {
      console.log("got update", field);
      if (field === "myName") {
        setMyName(connectionManager.myName);
      } else if (field === "senders") {
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
    <Box
      sx={{
        border: "1px solid black",
        minWidth: "300px",
        flex: 1,
      }}
    >
      <Typography variant="h6" align="center">
        {myName} (ME)
      </Typography>

      {senders.map(
        (s) => s.track && <SenderMediaBox sender={s} key={s.track.id} />
      )}

      <MediaDevicesSelector />
    </Box>
  );
};
export default MyBox;
