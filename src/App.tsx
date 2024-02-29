import { Box, Container, Paper, Typography } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { Header } from "./fragments/Header";
import { Copyright } from "./fragments/Copyright";
import useData from "./hooks/Data";
import MeetInfoDialog from "./fragments/MeetInfoDialog";

function App() {
  const { permissions, connection } = useData();

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
          // display: "flex",
          overflow: "hidden",
          padding: "8px 0",
        }}
      >
        <p>camera permission is {permissions.camera}</p>

        <p>microphone permission is {permissions.microphone}</p>
        <p>
          meetID {connection.meetId} with {connection.remoteName}
        </p>
        <Box sx={{ border: "1px solid black" }}>
          <Typography>INCOMING</Typography>
          <video ref={inVideo} height={"100px"} autoPlay />
        </Box>

        <Box sx={{ border: "1px solid black" }}>
          <Typography>OUTGOING</Typography>
          <video ref={outVideo} height={"100px"} autoPlay />
        </Box>

        {<MeetInfoDialog />}
      </Container>
      <Copyright />
    </Box>
  );
}

export default App;

// REF: https://github.com/webrtc/samples/blob/gh-pages/src/content/peerconnection/channel/js/main.js#L101
