import { Box, IconButton, Typography } from "@mui/material";
import useData from "../hooks/Data";
import { useEffect, useRef, useState } from "react";
import DisplayVideo from "./DisplayVideo";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AddIcCallIcon from "@mui/icons-material/AddIcCall";
import SettingsIcon from "@mui/icons-material/Settings";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import { getDisplayMedia, getMediaStream } from "../utils/webrtcWrapper";

const MyBox = () => {
  const { connectionManager, permissions } = useData();
  const [streams, setStreams] = useState<{ id: string; stream: MediaStream }[]>(
    []
  );
  const [myName, setMyName] = useState("");
  const [status, setStatus] = useState("new");

  useEffect(() => {
    function handleUpdates(field: string) {
      console.log("got update", field);
      if (field === "myStream") {
        const tracks = connectionManager.myStream.getTracks();
        console.log("handleUpdates, myStream,", tracks);
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
      } else if (field === "myName") {
        setMyName(connectionManager.myName);
      } else if (field === "status") {
        setStatus(connectionManager.status);
      }
    }
    connectionManager.on("update", handleUpdates);

    return () => {
      connectionManager.off("update", handleUpdates);
    };
  }, [connectionManager]);

  const addTrack = async (src: "camera" | "screen") => {
    if (connectionManager.status !== "connected") return;

    const videoStream =
      src === "camera" ? await getMediaStream() : await getDisplayMedia();
    if (!videoStream) {
      console.log("failed to get stream");
      return;
    }
    connectionManager.addTrack(videoStream);
  };

  return (
    <Box sx={{ border: "1px solid black", minWidth: "300px", flex: 1 }}>
      <Typography variant="h6" align="center">
        {myName} (ME)
      </Typography>

      <Box>
        {streams.map((s) => (
          <DisplayVideo key={s.id} videoInfo={s} />
        ))}
      </Box>

      <Box>
        <IconButton
          title={permissions.camera ? "blocked" : "Add Video"}
          disabled={permissions.camera !== "granted" || status !== "connected"}
          onClick={() => addTrack("camera")}
        >
          <VideoCallIcon fontSize="medium" />
        </IconButton>
        <IconButton
          title={permissions.camera ? "blocked" : "Add Video"}
          disabled={status !== "connected"}
          onClick={() => addTrack("screen")}
        >
          <ScreenShareIcon fontSize="medium" />
        </IconButton>
        <IconButton
          title={permissions.microphone ? "blocked" : "Add Audio"}
          disabled={
            permissions.microphone !== "granted" || status !== "connected"
          }
        >
          <AddIcCallIcon fontSize="medium" />
        </IconButton>
        <IconButton title="Media Settings">
          <SettingsIcon fontSize="medium" />
        </IconButton>
      </Box>
    </Box>
  );
};
export default MyBox;
