import React, { useEffect, useState } from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
} from "@mui/material";
import useData from "../hooks/Data";

const MeetInfoDialog: React.FC = () => {
  const { connection, joinMeeting } = useData();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [meetId, setMeetId] = useState("12345");

  useEffect(() => {
    setOpen(!connection.meetId);
  }, [connection.meetId]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission here
    console.log(`Name: ${name}, Meeting ID: ${meetId}`);

    joinMeeting(name, meetId);
  };

  return (
    <Dialog open={open} aria-labelledby="form-dialog-title">
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
  );
};

export default MeetInfoDialog;
