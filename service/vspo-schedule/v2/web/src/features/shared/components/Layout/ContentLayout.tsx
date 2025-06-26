import { Breakpoint, Container, ContainerTypeMap } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { styled } from "@mui/material/styles";
import React, { useEffect, useState } from "react";
import { AlertSnackbar } from "../Elements";
import { CustomHead } from "../Head/Head";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { CustomBottomNavigation } from "./Navigation";

type ContentLayoutProps = {
  children: React.ReactNode;
  title: string;
  lastUpdateTimestamp?: number;
  description?: string;
  path?: string;
  canonicalPath?: string;
  footerMessage?: string;
  headTitle?: string;
  maxPageWidth?: Breakpoint;
  padTop?: boolean;
};

type StyledContainerProps = Pick<ContentLayoutProps, "padTop">;

const StyledContainer = styled(Container, {
  shouldForwardProp: (prop) => prop !== "padTop",
})<StyledContainerProps>(({ theme, padTop }) => ({
  padding: theme.spacing(3),
  paddingTop: padTop ? theme.spacing(4) : 0,

  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    paddingTop: padTop ? theme.spacing(3) : 0,
  },
})) as OverridableComponent<ContainerTypeMap<StyledContainerProps>>;

export const ContentLayout = ({
  children,
  title,
  lastUpdateTimestamp,
  description,
  path,
  canonicalPath,
  footerMessage,
  headTitle,
  maxPageWidth,
  padTop,
}: ContentLayoutProps) => {
  const [alertOpen, setAlertOpen] = useState(false);

  const handleAlertClose = () => {
    setAlertOpen(false);
    localStorage.setItem("alertSeen-20250626", "true");
  };

  useEffect(() => {
    const hasSeenAlert = localStorage.getItem("alertSeen-20250626");

    if (!hasSeenAlert) {
      setAlertOpen(true);
    }
  }, []);

  return (
    <>
      <CustomHead
        title={headTitle || title}
        description={description}
        path={path}
        canonicalPath={canonicalPath}
      />
      <Header title={title} />
      <AlertSnackbar open={alertOpen} onClose={handleAlertClose} />
      <StyledContainer component="main" maxWidth={maxPageWidth} padTop={padTop}>
        {children}
      </StyledContainer>
      {/* <GoogleAd /> */}
      <Footer
        lastUpdateTimestamp={lastUpdateTimestamp}
        description={footerMessage}
      />
      <CustomBottomNavigation />
    </>
  );
};
