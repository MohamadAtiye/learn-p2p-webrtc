import React from "react";
import { Backdrop, CircularProgress } from "@mui/material";
// import { makeStyles } from "@mui/styles";

// const useStyles = makeStyles((theme) => ({
//   backdrop: {
//     zIndex: theme.zIndex.drawer + 1,
//     color: "#fff",
//   },
// }));

const FullPageLoading: React.FC = () => {
  // const classes = useStyles();

  return (
    <Backdrop
      // className={classes.backdrop}
      open={true}
      sx={{
        zIndex: 999,
        color: "#fff",
      }}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default FullPageLoading;
