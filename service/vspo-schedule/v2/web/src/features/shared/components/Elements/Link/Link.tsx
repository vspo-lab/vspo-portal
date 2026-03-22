"use client";

import { Link as MuiLink, type LinkProps as MuiLinkProps } from "@mui/material";
import React from "react";
import { Link as NextIntlLink } from "@/i18n/navigation";

export const Link = React.forwardRef<HTMLAnchorElement, MuiLinkProps>(
  function Link({ children, href, sx, onClick, ...props }, ref) {
    return (
      <MuiLink
        ref={ref}
        component={NextIntlLink}
        href={href ?? ""}
        sx={{
          color: "inherit",
          textDecoration: "none",
          ...sx,
        }}
        onClick={onClick}
        {...props}
      >
        {children}
      </MuiLink>
    );
  },
);
