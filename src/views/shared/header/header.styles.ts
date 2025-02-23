import { createUseStyles } from "react-jss";

import { Theme } from "src/styles/theme";

const useHeaderStyles = createUseStyles((theme: Theme) => ({
  header: {
    position: "relative",
    width: "100%",
    maxWidth: theme.maxWidth,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: [theme.spacing(1.5), "auto", 0],
    padding: [theme.spacing(0.75), 0],
    [theme.breakpoints.upSm]: {
      margin: [theme.spacing(3), "auto", 0],
    },
  },
  sideButton: {
    position: "absolute",
    right: 0,
    cursor: "pointer ",
    transition: theme.hoverTransition,
    backgroundColor: theme.palette.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    padding: theme.spacing(1),
    "&:hover": {
      backgroundColor: theme.palette.grey.main,
    },
    [theme.breakpoints.upSm]: {
      padding: theme.spacing(1.25),
    },
  },
  icon: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    [theme.breakpoints.upSm]: {
      width: theme.spacing(2.5),
      height: theme.spacing(2.5),
    },
  },
}));

export default useHeaderStyles;
