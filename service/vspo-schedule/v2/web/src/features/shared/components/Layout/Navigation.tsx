"use client";

import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { Box } from "@mui/system";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import {
  getNavigationRouteInfo,
  type NavigationRouteId,
} from "@/constants/navigation";
import { usePathname } from "@/i18n/navigation";
import { DrawerIcon, Link } from "../Elements";

const bottomNavigationRoutes = [
  "list",
  "clip",
  "multiview",
] satisfies NavigationRouteId[];

const getActiveNavOption = (activePath: string) => {
  const pathParts = activePath.split("/");
  if (pathParts.length < 2) {
    return undefined;
  }
  const basePath = pathParts.slice(0, 2).join("/");
  return bottomNavigationRoutes.find((id) => {
    const link = getNavigationRouteInfo(id).link;
    return link.startsWith(basePath);
  });
};

const bottomNavigationHeight = "56px";

const BottomNavigationOffset = () => (
  <div style={{ height: bottomNavigationHeight }} />
);

export const CustomBottomNavigation: React.FC = () => {
  const [value, setValue] = useState("");
  const pathname = usePathname();
  const t = useTranslations("common");

  useEffect(() => {
    const activeNavOption = getActiveNavOption(pathname);
    setValue(activeNavOption ?? "");
  }, [pathname]);

  return (
    <>
      <BottomNavigationOffset />
      <Box sx={{ width: "100%", position: "fixed", bottom: 0, zIndex: 1000 }}>
        <BottomNavigation
          value={value}
          showLabels
          sx={{ height: bottomNavigationHeight }}
        >
          {bottomNavigationRoutes.map((id) => (
            <BottomNavigationAction
              component={Link}
              href={getNavigationRouteInfo(id).link}
              key={id}
              label={t(`bottomNav.pages.${id}`)}
              value={id}
              icon={<DrawerIcon id={id} />}
            />
          ))}
        </BottomNavigation>
      </Box>
    </>
  );
};
