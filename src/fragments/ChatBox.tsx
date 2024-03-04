import { Box, Button, TextField, Typography } from "@mui/material";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import useData, { ChatMsg } from "../hooks/Data";

const TEXT_MAX_LENGTH = 200;

export const getFormatedTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString();
};

interface DisplayMessageProps {
  message: ChatMsg;
}
function DisplayMessage({ message }: DisplayMessageProps) {
  return (
    <Box
      alignSelf={message.from === "me" ? "flex-start" : "flex-end"}
      mb={2}
      display={"flex"}
      flexDirection={"column"}
    >
      <Typography
        variant="caption"
        alignSelf={message.from === "me" ? "flex-start" : "flex-end"}
      >
        {message.from}, {getFormatedTime(message.ts)}
      </Typography>
      <Typography variant="body1">{message.text}</Typography>
    </Box>
  );
}

const ChatBox = () => {
  const { connectionManager, sendChat, chat, isChatOpen } = useData();
  const [status, setStatus] = useState("new");

  useEffect(() => {
    function handleUpdates(field: string) {
      if (field === "status") setStatus(connectionManager.status);
    }
    connectionManager.on("update", handleUpdates);

    return () => {
      connectionManager.off("update", handleUpdates);
    };
  }, [connectionManager]);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLDivElement>(null);

  const focusOnTextField = () => {
    inputRef.current?.focus();
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (text.length < 1) return;

    sendChat(text);
    focusOnTextField();
    setInput("");
  };

  const scrollToBottom = () => {
    const anchor = document.querySelector("#scroll-bottom-anchor");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(scrollToBottom, [chat]);

  return (
    <Box
      display={"flex"}
      flexDirection="column"
      sx={{
        border: "1px solid gray",
        overflowY: "hidden",
        height: isChatOpen ? "300px" : 0,
        transition: "height 0.2s ease-in",
      }}
    >
      <Box
        flexGrow={1}
        overflow="auto"
        p={2}
        display={"flex"}
        flexDirection={"column"}
      >
        {chat.map((msg) => (
          <DisplayMessage key={msg.ts} message={msg} />
        ))}
        <span id="scroll-bottom-anchor"></span>
      </Box>

      <Box display="flex">
        <TextField
          variant="outlined"
          placeholder="Type a message"
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "connected"}
          inputProps={{
            maxLength: TEXT_MAX_LENGTH,
          }}
          inputRef={inputRef}
          onKeyPress={handleKeyPress}
          autoComplete="password2"
        />
        <Button
          color="primary"
          variant="contained"
          onClick={handleSend}
          disabled={status !== "connected"}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatBox;
