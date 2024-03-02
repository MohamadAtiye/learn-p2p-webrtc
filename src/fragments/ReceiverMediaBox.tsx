import { Box, Typography } from "@mui/material";
import DisplayVideo from "./DisplayVideo";
import AudioVisualizer from "./AudioVisualizer";
import { useEffect, useState } from "react";

interface ReceiverMediaBoxProps {
  receiver: RTCRtpReceiver;
}
const ReceiverMediaBox = ({ receiver }: ReceiverMediaBoxProps) => {
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
    setKind(receiver.track?.kind ?? "...");
  }, [receiver]);

  useEffect(() => {
    let prevBytesTransfer = 0;
    let prevTimestamp = 0;
    let prevTotalSamplesReceived = 0;

    const interval = setInterval(async () => {
      const stats = await receiver.getStats();
      stats.forEach((report) => {
        if (report.type === "inbound-rtp") {
          if (prevTimestamp !== 0) {
            // calculate bitrate
            let bitrate =
              (8 * (report.bytesReceived - prevBytesTransfer)) /
              (report.timestamp - prevTimestamp);
            bitrate = Math.floor(bitrate);

            if (kind === "video") {
              setVideoStats({
                height: report.frameHeight ?? 0,
                width: report.frameWidth ?? 0,
                fps: report.framesPerSecond,
              });
            } else if (kind === "audio") {
              setAudioStats({
                sampleRate:
                  report.totalSamplesReceived - prevTotalSamplesReceived,
              });
            }
            setStats({
              bitrate: `${bitrate} kbps`,
            });
          }
          prevTotalSamplesReceived = report.totalSamplesReceived;

          prevBytesTransfer = report.bytesReceived;
          prevTimestamp = report.timestamp;
        }
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [kind, receiver]);

  return (
    <Box sx={{ border: "1px solid black", padding: "0 8px" }}>
      <Box>
        {/* <Typography variant="caption">{receiver.track?.label}</Typography> */}
        {kind === "video" && (
          <Box>
            <Typography variant="caption">
              {videoStats.width}x{videoStats.height}@{videoStats.fps}fps, at{" "}
              {stats.bitrate}
            </Typography>
          </Box>
        )}
        {kind === "audio" && (
          <Box>
            <Typography variant="caption">
              {audioStats.sampleRate}Hz, at {stats.bitrate}
            </Typography>
          </Box>
        )}
      </Box>

      <Box display={"flex"}>
        <Box sx={{ flex: 1 }}>
          {receiver.track?.kind === "video" && (
            <DisplayVideo track={receiver.track} />
          )}
          {receiver.track?.kind === "audio" && (
            <AudioVisualizer track={receiver.track} isLocal={false} />
          )}
        </Box>
        {/* <Box sx={{ display: "flex", flexDirection: "column", width: "64px" }}> */}
          {/* <IconButton onClick={closeTrack} title="end stream">
            <CloseIcon />
          </IconButton>
          <Button
            onClick={toggleMute}
            title="mute track"
            variant="outlined"
            size="small"
          >
            {isMuted ? "Unmute" : "mute"}
          </Button> */}
        {/* </Box> */}
      </Box>
    </Box>
  );
};

export default ReceiverMediaBox;
