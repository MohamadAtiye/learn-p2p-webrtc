import { useEffect, useRef } from "react";

interface DisplayVideoProps {
  videoInfo: {
    id: string;
    stream: MediaStream;
  };
}
const DisplayVideo = ({ videoInfo }: DisplayVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = videoInfo.stream;
    }
  }, [videoInfo.stream, videoRef]);

  return <video ref={videoRef} height={"100px"} autoPlay />;
};

export default DisplayVideo;
