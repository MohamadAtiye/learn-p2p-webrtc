import { Box, Typography } from "@mui/material";
import useData from "../hooks/Data";
import { useEffect, useState } from "react";
import DisplayVideo from "./DisplayVideo";
import AudioVisualizer from "./AudioVisualizer";

const RemoteBox = () => {
  const { connectionManager } = useData();
  const [audioStreams, setAudioStreams] = useState<
    { id: string; stream: MediaStream }[]
  >([]);
  const [videoStreams, setVideoStreams] = useState<
    { id: string; stream: MediaStream }[]
  >([]);
  const [remoteName, setRemoteName] = useState("");
  const [status, setStatus] = useState("new");

  useEffect(() => {
    function handleUpdates(field: string) {
      console.log("got update", field);
      if (field === "remoteStream") {
        const videoTracks = connectionManager.remoteStream.getVideoTracks();
        const audioTracks = connectionManager.remoteStream.getAudioTracks();

        console.log("handleUpdates, remoteStream,", videoTracks, audioTracks);

        setVideoStreams((prev) => {
          //remove closed tracks
          const removed: string[] = [];
          prev.forEach((p) => {
            if (!videoTracks.find((t) => t.id === p.id)) {
              removed.push(p.id);
            }
          });

          //add new tracks
          const added: { id: string; stream: MediaStream }[] = [];
          videoTracks.forEach((track) => {
            if (!prev.find((p) => p.id === track.id)) {
              const stream = new MediaStream();
              stream.addTrack(track);
              added.push({ id: track.id, stream });
            }
          });

          return prev.filter((p) => !removed.includes(p.id)).concat(added);
        });

        setAudioStreams((prev) => {
          //remove closed tracks
          const removed: string[] = [];
          prev.forEach((p) => {
            if (!audioTracks.find((t) => t.id === p.id)) {
              removed.push(p.id);
            }
          });

          //add new tracks
          const added: { id: string; stream: MediaStream }[] = [];
          audioTracks.forEach((track) => {
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
      <Box>
        {videoStreams.map((s) => (
          <DisplayVideo key={s.id} streamInfo={s} />
        ))}
      </Box>

      {audioStreams.map((s) => (
        <AudioVisualizer key={s.id} streamInfo={s} isLocal={false} />
      ))}
    </Box>
  );
};

export default RemoteBox;
