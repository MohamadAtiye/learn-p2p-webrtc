import { useEffect, useRef } from "react";

interface DisplayVideoProps {
  streamInfo: {
    id: string;
    stream: MediaStream;
  };
}
const DisplayVideo = ({ streamInfo }: DisplayVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = streamInfo.stream;
    }
  }, [streamInfo.stream, videoRef]);

  return <video ref={videoRef} height={"100px"} autoPlay />;
};

export default DisplayVideo;
