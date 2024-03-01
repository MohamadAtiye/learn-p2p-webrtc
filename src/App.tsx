import { Box, Container, IconButton, Paper, Typography } from "@mui/material";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Header } from "./fragments/Header";
import { Copyright } from "./fragments/Copyright";
import useData from "./hooks/Data";
import MeetInfoDialog from "./fragments/MeetInfoDialog";
import ChatBox from "./fragments/ChatBox";
import MyBox from "./fragments/MyBox";
import RemoteBox from "./fragments/RemoteBox";

function App() {
  const { permissions } = useData();

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
        <MeetInfoDialog />

        <p>
          camera {permissions.camera}, microphone {permissions.microphone}
        </p>

        <Box sx={{ display: "flex", flexWrap: "wrap" }}>
          <MyBox />
          <RemoteBox />
        </Box>

        <ChatBox />
      </Container>
      <Copyright />
    </Box>
  );
}

export default App;

// REF: https://github.com/webrtc/samples/blob/gh-pages/src/content/peerconnection/channel/js/main.js#L101
