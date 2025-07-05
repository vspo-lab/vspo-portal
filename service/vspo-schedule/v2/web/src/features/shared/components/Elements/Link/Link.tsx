import { useLocale } from "@/hooks";
import { Link as MuiLink, type LinkProps as MuiLinkProps } from "@mui/material";
import { useRouter } from "next/router";
import React from "react";

export const Link = React.forwardRef<HTMLAnchorElement, MuiLinkProps>(
  function Link({ children, href, sx, onClick, ...props }, ref) {
    const { locale } = useLocale();
    const router = useRouter();

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (href) {
        router.push(`/${locale}${href}`, undefined, { shallow: false });
      }
      onClick?.(event);
    };

    return (
      <MuiLink
        ref={ref}
        href={`/${locale}${href}`}
        sx={{
          color: "inherit",
          textDecoration: "none",
          ...sx,
        }}
        onClick={handleClick}
        {...props}
      >
        {children}
      </MuiLink>
    );
  },
);
