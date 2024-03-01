import { Box, Typography } from "@mui/material";
import useData from "../hooks/Data";
import { useEffect, useState } from "react";
import DisplayVideo from "./DisplayVideo";

const RemoteBox = () => {
  const { connectionManager } = useData();
  const [streams, setStreams] = useState<{ id: string; stream: MediaStream }[]>(
    []
  );
  const [remoteName, setRemoteName] = useState("");
  const [status, setStatus] = useState("new");

  useEffect(() => {
    function handleUpdates(field: string) {
      console.log("got update", field);
      if (field === "remoteStream") {
        const tracks = connectionManager.remoteStream.getTracks();
        console.log("handleUpdates, remoteStream,", tracks);
        setStreams((prev) => {
          //remove closed tracks
          const removed: string[] = [];
          prev.forEach((p) => {
            if (!tracks.find((t) => t.id === p.id)) {
              removed.push(p.id);
            }
          });

          //add new tracks
          const added: { id: string; stream: MediaStream }[] = [];
          tracks.forEach((track) => {
            if (!prev.find((p) => p.id === track.id)) {
              const stream = new MediaStream();
              stream.addTrack(track);
              added.push({ id: track.id, stream });
            }
          });

          return prev.filter((p) => !removed.includes(p.id)).concat(added);
        });
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
    <Box sx={{ border: "1px solid black", minWidth: "300px", flex: 1 }}>
      <Typography variant="h6" align="center">
        {remoteName}
      </Typography>
      <Box>
        {streams.map((s) => (
          <DisplayVideo key={s.id} videoInfo={s} />
        ))}
      </Box>
    </Box>
  );
};

export default RemoteBox;
