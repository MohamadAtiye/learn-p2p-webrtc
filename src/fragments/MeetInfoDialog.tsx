import React, { useEffect, useState } from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
} from "@mui/material";
import useData from "../hooks/Data";

const MeetInfoDialog: React.FC = () => {
  const { connectionManager, joinMeeting, permissions } = useData();

  const [name, setName] = useState("");
  const [meetId, setMeetId] = useState("12345");
  const [savedMeetId, setSavedMeetId] = useState("");
  const [myName, setMyName] = useState("");
  const [remoteName, setRemoteName] = useState("");

  useEffect(() => {
    function handleUpdates(field: string) {
      if (field === "meetId") {
        setSavedMeetId(connectionManager.meetId);
      } else if (field === "myName") {
        setMyName(connectionManager.myName);
      } else if (field === "remoteName") {
        setRemoteName(connectionManager.remoteName);
      }
    }
    connectionManager.on("update", handleUpdates);
    return () => {
      connectionManager.off("update", handleUpdates);
    };
  }, [connectionManager]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    joinMeeting(name, meetId);
  };

  return (
    <>
      <Typography variant="caption" align="center">
        Meeting ID: {savedMeetId ?? "..."} between {myName ?? "..."} (you) and{" "}
        {remoteName ?? "..."}(remote)
        <br /> camera {permissions.camera}, microphone {permissions.microphone}
      </Typography>

      <Dialog open={!savedMeetId} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title" align="center">
          Join a Meeting
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: "column",
              paddingTop: 2,
            }}
          >
            <TextField
              label="Name"
              variant="outlined"
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              inputProps={{ minLength: 2, maxLength: 20 }}
              autoComplete="password2"
            />
            <TextField
              label="Meeting ID"
              variant="outlined"
              required
              fullWidth
              value={meetId}
              onChange={(e) => setMeetId(e.target.value)}
              inputProps={{ minLength: 2, maxLength: 50 }}
              autoComplete="password2"
            />
            <DialogActions>
              <Button
                variant="contained"
                type="submit"
                color="primary"
                fullWidth
                size="large"
              >
                Join
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MeetInfoDialog;
