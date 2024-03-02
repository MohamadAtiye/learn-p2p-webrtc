import { Box } from "@mui/material";
import DisplayVideo from "./DisplayVideo";
import AudioVisualizer from "./AudioVisualizer";

interface ReceiverMediaBoxProps {
  receiver: RTCRtpReceiver;
}
const ReceiverMediaBox = ({ receiver }: ReceiverMediaBoxProps) => {
  return (
    <Box>
      {receiver.track?.kind === "video" && (
        <DisplayVideo track={receiver.track} />
      )}
      {receiver.track?.kind === "audio" && (
        <AudioVisualizer track={receiver.track} isLocal={false} />
      )}
    </Box>
  );
};

export default ReceiverMediaBox;
