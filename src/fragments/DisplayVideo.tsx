import { useEffect, useRef } from "react";

interface DisplayVideoProps {
  track: MediaStreamTrack;
}
const DisplayVideo = ({ track }: DisplayVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const s = new MediaStream();
    s.addTrack(track);
    if (videoRef.current) videoRef.current.srcObject = s;
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        backgroundColor: "black",
      }}
      controls
    />
  );
};

export default DisplayVideo;
