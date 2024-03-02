import { Box, Button, IconButton, Typography } from "@mui/material";
import DisplayVideo from "./DisplayVideo";
import AudioVisualizer from "./AudioVisualizer";
import CloseIcon from "@mui/icons-material/Close";
import useData from "../hooks/Data";

import { useEffect, useState } from "react";

const getW = (h: number) => {
  switch (h) {
    case 360:
      return 640;
    case 480:
      return 854;
    case 720:
      return 1280;
    case 1080:
      return 1920;
    default:
      return Math.round((h * 16) / 9);
  }
};

interface SenderMediaBoxProps {
  sender: RTCRtpSender;
}
const SenderMediaBox = ({ sender }: SenderMediaBoxProps) => {
  const { connectionManager } = useData();
  const [isMuted, setIsMuted] = useState(false);

  const [stats, setStats] = useState({
    bitrate: "",
  });
  const [videoStats, setVideoStats] = useState({
    height: 0,
    width: 0,
    fps: 0,
  });
  const [audioStats, setAudioStats] = useState({
    sampleRate: 0,
  });

  const [kind, setKind] = useState("");

  useEffect(() => {
    setKind(sender.track?.kind ?? "...");
  }, [sender]);

  // MONITOR STATS
  useEffect(() => {
    let prevBytesSent = 0;
    let prevTimestamp = 0;

    const interval = setInterval(() => {
      sender.getStats().then((stats) => {
        stats.forEach((report) => {
          if (report.type === "outbound-rtp") {
            if (prevTimestamp !== 0) {
              // calculate bitrate
              let bitrate =
                (8 * (report.bytesSent - prevBytesSent)) /
                (report.timestamp - prevTimestamp);
              bitrate = Math.floor(bitrate);

              let settings = sender.track?.getSettings();
              if (kind === "video") {
                setVideoStats({
                  height: settings?.height ?? 0,
                  width: settings?.width ?? 0,
                  fps: report.framesPerSecond,
                });
              } else if (kind === "audio") {
                setAudioStats({
                  sampleRate: settings?.sampleRate ?? 0,
                });
              }

              setStats({
                bitrate: `${bitrate} kbps`,
              });
            }
            prevBytesSent = report.bytesSent;
            prevTimestamp = report.timestamp;
          }
        });
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [kind, sender]);

  const closeTrack = () => {
    if (sender.track) {
      connectionManager.closeTrack(sender);
    }
  };

  const toggleMute = () => {
    if (sender.track) {
      sender.track.enabled = !sender.track.enabled;
      setIsMuted(!sender.track.enabled);
    }
  };

  const setVideoRes = (h: number) => {
    const w = getW(h);
    let constraints: MediaTrackConstraints = {
      width: { ideal: w },
      height: { ideal: h },
      // aspectRatio?: ConstrainDouble;
      // autoGainControl?: ConstrainBoolean;
      // channelCount?: ConstrainULong;
      // deviceId?: ConstrainDOMString;
      // displaySurface?: ConstrainDOMString;
      // echoCancellation?: ConstrainBoolean;
      // facingMode?: ConstrainDOMString;
      // frameRate?: ConstrainDouble;
      // groupId?: ConstrainDOMString;
      // height?: ConstrainULong;
      // noiseSuppression?: ConstrainBoolean;
      // sampleRate?: ConstrainULong;
      // sampleSize?: ConstrainULong;
      // width?: ConstrainULong;
    };
    sender.track?.applyConstraints(constraints);
  };

  return (
    <Box sx={{ border: "1px solid black", padding: "0 8px" }}>
      <Box>
        {/* <Typography variant="caption">{sender.track?.id}</Typography>
        <br /> */}
        <Typography variant="caption">{sender.track?.label}</Typography>
        {kind === "video" && (
          <Box>
            <Button
              onClick={() => setVideoRes(360)}
              title="swtich to 360p"
              variant={"outlined"}
              size="small"
              disabled={videoStats.height === 360}
            >
              360p
            </Button>
            <Button
              onClick={() => setVideoRes(480)}
              title="swtich to 480p"
              variant="outlined"
              size="small"
              disabled={videoStats.height === 480}
            >
              480p
            </Button>
            <Button
              onClick={() => setVideoRes(720)}
              title="swtich to 720p"
              variant="outlined"
              size="small"
              disabled={videoStats.height === 720}
            >
              720p
            </Button>
            <Button
              onClick={() => setVideoRes(1080)}
              title="swtich to 1080p"
              variant="outlined"
              size="small"
              disabled={videoStats.height === 1080}
            >
              1080p
            </Button>
            <Typography variant="caption">
              {videoStats.width}x{videoStats.height}@{videoStats.fps}fps, at{" "}
              {stats.bitrate}
            </Typography>
          </Box>
        )}
        {kind === "audio" && (
          <Box>
            <Typography variant="caption">
              , {audioStats.sampleRate}Hz, at {stats.bitrate}
            </Typography>
          </Box>
        )}
      </Box>

      <Box display={"flex"}>
        <Box sx={{ flex: 1 }}>
          {sender.track?.kind === "video" && (
            <DisplayVideo track={sender.track} />
          )}
          {sender.track?.kind === "audio" && (
            <AudioVisualizer track={sender.track} isLocal={true} />
          )}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", width: "64px" }}>
          <IconButton onClick={closeTrack} title="end stream">
            <CloseIcon />
          </IconButton>
          <Button
            onClick={toggleMute}
            title="mute track"
            variant="outlined"
            size="small"
          >
            {isMuted ? "Unmute" : "mute"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SenderMediaBox;
