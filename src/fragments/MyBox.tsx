import { Box, IconButton, Typography } from "@mui/material";
import useData from "../hooks/Data";
import { useEffect, useState } from "react";
import DisplayVideo from "./DisplayVideo";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AddIcCallIcon from "@mui/icons-material/AddIcCall";
import SettingsIcon from "@mui/icons-material/Settings";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import { getDisplayMedia, getMediaStream } from "../utils/webrtcWrapper";
import AudioVisualizer from "./AudioVisualizer";

const MyBox = () => {
  const { connectionManager, permissions } = useData();

  const [audioStreams, setAudioStreams] = useState<
    { id: string; stream: MediaStream }[]
  >([]);
  const [videoStreams, setVideoStreams] = useState<
    { id: string; stream: MediaStream }[]
  >([]);
  const [myName, setMyName] = useState("");
  const [status, setStatus] = useState("new");

  useEffect(() => {
    function handleUpdates(field: string) {
      console.log("got update", field);
      if (field === "myStream") {
        const videoTracks = connectionManager.myStream.getVideoTracks();
        const audioTracks = connectionManager.myStream.getAudioTracks();

        console.log("handleUpdates, myStream,", videoTracks, audioTracks);

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

  enum StreamType {
    video = "video",
    screen = "screen",
    audio = "audio",
  }
  const addTrack = async (src: StreamType) => {
    if (connectionManager.status !== "connected") return;

    const stream =
      src === "screen"
        ? await getDisplayMedia()
        : await getMediaStream({
            audio: src === StreamType.audio,
            video: src === StreamType.video,
          });
    if (!stream) {
      console.log("failed to get stream");
      return;
    }
    connectionManager.addTrack(stream);
  };

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
        {myName} (ME)
      </Typography>

      <Box>
        {videoStreams.map((s) => (
          <DisplayVideo key={s.id} streamInfo={s} />
        ))}
      </Box>

      {audioStreams.map((s) => (
        <AudioVisualizer key={s.id} streamInfo={s} isLocal={true} />
      ))}

      <Box>
        <IconButton
          title={permissions.camera !== "granted" ? "blocked" : "Add Video"}
          disabled={permissions.camera !== "granted" || status !== "connected"}
          onClick={() => addTrack(StreamType.video)}
        >
          <VideoCallIcon fontSize="medium" />
        </IconButton>
        <IconButton
          title={"Share Screen"}
          disabled={status !== "connected"}
          onClick={() => addTrack(StreamType.screen)}
        >
          <ScreenShareIcon fontSize="medium" />
        </IconButton>
        <IconButton
          title={permissions.microphone !== "granted" ? "blocked" : "Add Audio"}
          disabled={
            permissions.microphone !== "granted" || status !== "connected"
          }
          onClick={() => addTrack(StreamType.audio)}
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
