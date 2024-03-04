import { Box, Typography } from "@mui/material";
import useData from "../hooks/Data";
export function Header() {
  const { callStatus } = useData();
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
      , status: {callStatus}
    </Box>
  );
}
