import { Box, Typography } from "@mui/material";
export function Header() {
  return (
    <Box
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 2, textAlign: "center" }}
      >
        P2P WebRTC
      </Typography>
    </Box>
  );
}
