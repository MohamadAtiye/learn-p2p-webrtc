// type PermissionName = "geolocation" | "notifications" | "persistent-storage" | "push" | "screen-wake-lock" | "xr-spatial-tracking"

export const checkPermission = async (
  name: PermissionName | "camera" | "microphone"
): Promise<PermissionStatus | null> => {
  try {
    const permissionStatus = await navigator.permissions.query({
      name: name as PermissionName,
    });
    console.log(name, " permission state is ", permissionStatus.state);
    return permissionStatus;
  } catch (error) {
    console.log("Got error :", error);
    return null;
  }
};

export const requestCameraPermission =
  async (): Promise<PermissionStatus | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getVideoTracks().forEach((t) => t.stop());
      console.log("Camera access granted");
    } catch (error) {
      console.error("Error accessing Camera.", error);
    }
    return checkPermission("camera");
  };

export const requestMicrophonePermission =
  async (): Promise<PermissionStatus | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach((t) => t.stop());
      console.log("Microphone access granted");
    } catch (error) {
      console.error("Error accessing Microphone.", error);
    }
    return checkPermission("microphone");
  };

export const getMediaStream = async (
  constraints: MediaStreamConstraints = {
    audio: true,
    video: true,
  }
): Promise<MediaStream | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error("Error accessing media devices.", error);
    return null;
  }
};

export const getDisplayMedia = async (
  constraints: DisplayMediaStreamOptions = {
    audio: false,
    video: {
      cursor: "always",
    } as MediaTrackConstraints,
  }
) => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    return stream;
  } catch (error) {
    console.error("Error accessing media devices.", error);
    return null;
  }
};
