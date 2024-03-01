import { Box, Container, IconButton, Paper, Typography } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { Header } from "./fragments/Header";
import { Copyright } from "./fragments/Copyright";
import useData from "./hooks/Data";
import MeetInfoDialog from "./fragments/MeetInfoDialog";
import ChatBox from "./fragments/ChatBox";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AddIcCallIcon from "@mui/icons-material/AddIcCall";
import SettingsIcon from "@mui/icons-material/Settings";

function App() {
  const { permissions, connection, addVideo } = useData();

  const inVideo = useRef<HTMLVideoElement>(null);
  const outVideo = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (connection.remoteStream && inVideo.current) {
      inVideo.current.srcObject = connection.remoteStream;
    }
  }, [connection.remoteStream]);
  useEffect(() => {
    console.log("use effect my stream");
    if (connection.myStream && outVideo.current) {
      outVideo.current.srcObject = connection.myStream;
    }
  }, [connection.myStream]);

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
      <Container
        component={Paper}
        maxWidth="lg"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          padding: "8px 0",
        }}
      >
        <Typography variant="h6" align="center">
          Meeting ID: {connection.meetId ?? "..."}
        </Typography>

        <p>
          camera {permissions.camera}, microphone {permissions.microphone}
        </p>

        <Box sx={{ display: "flex", flexWrap: "wrap" }}>
          {/* MY BOX */}
          <Box sx={{ border: "1px solid black", minWidth: "300px", flex: 1 }}>
            <Typography variant="h6" align="center">
              {connection.myName} (ME)
            </Typography>
            <video ref={outVideo} height={"100px"} autoPlay />
            <Box>
              <IconButton
                title={permissions.camera ? "blocked" : "Add Video"}
                disabled={permissions.camera !== "granted"}
                onClick={addVideo}
              >
                <VideoCallIcon fontSize="medium" />
              </IconButton>
              <IconButton
                title={permissions.microphone ? "blocked" : "Add Audio"}
                disabled={permissions.microphone !== "granted"}
              >
                <AddIcCallIcon fontSize="medium" />
              </IconButton>
              <IconButton title="Media Settings">
                <SettingsIcon fontSize="medium" />
              </IconButton>
            </Box>
          </Box>

          {/* REMOTE BOX */}
          <Box sx={{ border: "1px solid black", minWidth: "300px", flex: 1 }}>
            <Typography variant="h6" align="center">
              {connection.remoteName}
            </Typography>
            <video ref={inVideo} height={"100px"} autoPlay />
          </Box>
        </Box>

        <ChatBox />

        <MeetInfoDialog />
      </Container>
      <Copyright />
    </Box>
  );
}

export default App;

// REF: https://github.com/webrtc/samples/blob/gh-pages/src/content/peerconnection/channel/js/main.js#L101
