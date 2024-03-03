import { Box, IconButton, Paper, Popover, Slider } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { LiveAudioVisualizer } from "react-audio-visualize";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

interface AudioVisualizerProps {
  track: MediaStreamTrack;
  isLocal: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isLocal,
  track,
}) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const stream = new MediaStream();
    stream.addTrack(track);
    if (audioRef.current) audioRef.current.srcObject = stream;
    const recorder = new MediaRecorder(stream);
    recorder.start();
    setMediaRecorder(recorder);

    return () => {
      recorder.stop();
    };
  }, [track]);

  // REMOTE VOLUME CONTROL
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [volume, setVolume] = useState<number>(100);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
    if (audioRef.current) {
      audioRef.current.volume = (newValue as number) / 100;
    }
  };
  const open = Boolean(anchorEl);
  const id = open ? "volume-control-popover" : undefined;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        height: isLocal ? "80px" : "60px",
        padding: isLocal ? "40px 8px 0 8px" : "20px 8px 0 8px",
      }}
    >
      <audio
        ref={audioRef}
        controls
        autoPlay
        muted={isLocal}
        style={{ display: "none" }}
      />
      {mediaRecorder && (
        <Box sx={{ flex: 1 }}>
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            width={"200"}
            height={40}
          />
        </Box>
      )}

      {!isLocal && (
        <Box sx={{ width: "40px" }}>
          <IconButton onClick={handleClick}>
            <VolumeUpIcon fontSize="medium" />
          </IconButton>
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
          >
            <Paper
              sx={{
                width: "48px",
                height: "fitcontent",
                padding: "24px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Slider
                orientation="vertical"
                value={volume}
                onChange={handleVolumeChange}
                aria-labelledby="vertical-slider"
                min={0}
                max={100}
                step={1}
                sx={{ height: "80px" }}
              />
            </Paper>
          </Popover>
        </Box>
      )}
    </Box>
  );
};

export default AudioVisualizer;
