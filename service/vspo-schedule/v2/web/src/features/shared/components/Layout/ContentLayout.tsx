"use client";

import {
  type Breakpoint,
  Container,
  type ContainerTypeMap,
} from "@mui/material";
import type { OverridableComponent } from "@mui/material/OverridableComponent";
import { styled } from "@mui/material/styles";
import type React from "react";
import { useEffect } from "react";
import { usePageMeta } from "@/context/PageMetaContext";

type ContentLayoutProps = {
  children: React.ReactNode;
  title: string;
  lastUpdateTimestamp?: number;
  path?: string;
  footerMessage?: string;
  maxPageWidth?: Breakpoint | false;
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

  // Minimal padding for multiview page
  "&.multiview-container": {
    padding: 0,
    paddingTop: 0,
  },
})) as OverridableComponent<ContainerTypeMap<StyledContainerProps>>;

export const ContentLayout = ({
  children,
  title,
  lastUpdateTimestamp,
  path,
  footerMessage,
  maxPageWidth,
  padTop,
}: ContentLayoutProps) => {
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({ title, lastUpdateTimestamp, footerMessage });
  }, [title, lastUpdateTimestamp, footerMessage, setPageMeta]);

  return (
    <StyledContainer
      component="main"
      maxWidth={maxPageWidth}
      padTop={padTop}
      className={path === "/multiview" ? "multiview-container" : ""}
    >
      {children}
    </StyledContainer>
  );
};
