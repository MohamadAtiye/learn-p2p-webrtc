import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popover,
} from "@mui/material";
import useData from "../hooks/Data";
import {
  StreamType,
  getDisplayMedia,
  getMediaStream,
  listMediaDevices,
} from "../utils/webrtcWrapper";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AddIcCallIcon from "@mui/icons-material/AddIcCall";
import SettingsIcon from "@mui/icons-material/Settings";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import { useEffect, useRef, useState } from "react";

const MediaDevicesSelector = () => {
  const { connectionManager, permissions } = useData();
  const [status, setStatus] = useState("new");

  const [open, setOpen] = useState<StreamType | undefined>(undefined);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const anchorRef_video = useRef<HTMLButtonElement>(null);
  const anchorRef_audio = useRef<HTMLButtonElement>(null);

  const handleClickOpen = async (src: StreamType) => {
    // Fetch the devices
    const available =
      src === StreamType.audio
        ? await listMediaDevices("audio")
        : await listMediaDevices("video");

    const usedTracks = connectionManager.pc
      .getSenders()
      .map((s) => s.track?.label);
    // connectionManager.myStream.getTracks().map((t) => t.label);

    setDevices(available.filter((a) => !usedTracks.includes(a.label)));

    setOpen(src);
  };

  const handleClose = () => {
    setOpen(undefined);
  };

  const handleDeviceClick = (device: MediaDeviceInfo) => {
    console.log(`Starting video with device: ${device.label}`);

    const constraints: MediaStreamConstraints = {
      audio:
        device.kind === "audioinput"
          ? {
              deviceId: { ideal: device.deviceId },
            }
          : false,
      video:
        device.kind === "videoinput"
          ? { deviceId: { ideal: device.deviceId }, frameRate: { ideal: 30 } }
          : false,
    };
    addTrack(
      device.kind === "audioinput" ? StreamType.audio : StreamType.video,
      constraints
    );
    // Call your function to start the video here
    setOpen(undefined);
  };

  useEffect(() => {
    function handleUpdates(field: string) {
      if (field === "status") {
        setStatus(connectionManager.status);
      }
    }
    connectionManager.on("update", handleUpdates);

    return () => {
      connectionManager.off("update", handleUpdates);
    };
  }, [connectionManager]);

  const addTrack = async (
    src: StreamType,
    constraints?: MediaStreamConstraints
  ) => {
    if (connectionManager.status !== "connected") return;

    const stream =
      src === "screen"
        ? await getDisplayMedia()
        : await getMediaStream(constraints);
    if (!stream) {
      console.log("failed to get stream");
      return;
    }
    connectionManager.addTrack(stream);
  };

  const id = open ? "device-selector" : undefined;

  return (
    <Box>
      <IconButton
        title={permissions.camera !== "granted" ? "blocked" : "Add Video"}
        disabled={permissions.camera !== "granted" || status !== "connected"}
        onClick={() => handleClickOpen(StreamType.video)}
        ref={anchorRef_video}
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
        onClick={() => handleClickOpen(StreamType.audio)}
        ref={anchorRef_audio}
      >
        <AddIcCallIcon fontSize="medium" />
      </IconButton>
      <IconButton title="Media Settings">
        <SettingsIcon fontSize="medium" />
      </IconButton>

      {/* DEVICE LIST POPUP */}
      <Popover
        id={id}
        open={open !== undefined}
        anchorEl={
          open === StreamType.audio
            ? anchorRef_audio.current
            : anchorRef_video.current
        }
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Paper elevation={2} sx={{ border: "1px solid black" }}>
          <List>
            {devices.map((device) => (
              <ListItemButton
                onClick={() => handleDeviceClick(device)}
                key={device.deviceId}
              >
                <ListItemText primary={device.label} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Popover>
    </Box>
  );
};
export default MediaDevicesSelector;
