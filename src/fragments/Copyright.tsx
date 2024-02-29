import { Box, Link, Typography } from "@mui/material";

export function Copyright() {
  return (
    <Box p={2}>
      <Typography variant="body2" color="text.secondary" align="center">
        {"Copyright © "}
        <Link color="inherit" href="https://atiye.ru/">
          Atiye.ru
        </Link>{" "}
        {new Date().getFullYear()}.
      </Typography>
    </Box>
  );
}
