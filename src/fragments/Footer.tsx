import { Box } from "@mui/material";
import MediaDevicesSelector from "./MediaDevicesSelector";

export function Footer() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "right",
      }}
    >
      <MediaDevicesSelector />
    </Box>
  );
}
