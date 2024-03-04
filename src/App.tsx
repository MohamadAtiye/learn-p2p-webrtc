import { Box, Container, Paper } from "@mui/material";
import React from "react";
import { Header } from "./fragments/Header";
import { Footer } from "./fragments/Footer";
import MeetInfoDialog from "./fragments/MeetInfoDialog";
import ChatBox from "./fragments/ChatBox";
import Receivers from "./fragments/Receivers";
import Senders from "./fragments/Senders";

function App() {
  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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
        }}
      >
        <MeetInfoDialog />

        <Box
          sx={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexWrap: "wrap",
            overflowY: "auto",
            border: "1px dashed gray",
            alignContent: "flex-start",
          }}
        >
          <Senders />
          <Receivers />
        </Box>

        <ChatBox />
        <Footer />
      </Container>
    </Box>
  );
}

export default App;

// REF: https://github.com/webrtc/samples/blob/gh-pages/src/content/peerconnection/channel/js/main.js#L101
