import { Box, Link, Typography } from "@mui/material";
import MediaDevicesSelector from "./MediaDevicesSelector";

export function Footer() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        {"Copyright © "}
        <Link color="inherit" href="https://atiye.ru/">
          Atiye.ru
        </Link>{" "}
        {new Date().getFullYear()}.
      </Typography>

      <MediaDevicesSelector />
    </Box>
  );
}
