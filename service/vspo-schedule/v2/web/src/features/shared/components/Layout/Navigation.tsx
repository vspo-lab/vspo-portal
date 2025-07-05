import {
  type NavigationRouteId,
  getNavigationRouteInfo,
} from "@/constants/navigation";
import { useTimeZoneContext } from "@/hooks";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { Box } from "@mui/system";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import type React from "react";
import { useEffect, useState } from "react";
import { DrawerIcon, Link } from "../Elements";

const bottomNavigationRoutes = [
  "list",
  "clip",
  "event",
  "multiview",
] satisfies NavigationRouteId[];

const getActiveNavOption = (activePath: string, timeZone: string) => {
  const pathParts = activePath.split("/");
  if (pathParts.length < 2) {
    return undefined;
  }
  const basePath = pathParts.slice(0, 2).join("/");
  return bottomNavigationRoutes.find((id) => {
    const link = getNavigationRouteInfo(id, timeZone).link;
    return link.startsWith(basePath);
  });
};

const bottomNavigationHeight = "56px";

const BottomNavigationOffset = () => (
  <div style={{ height: bottomNavigationHeight }} />
);

export const CustomBottomNavigation: React.FC = () => {
  const [value, setValue] = useState("");
  const router = useRouter();
  const { timeZone } = useTimeZoneContext();
  const { t } = useTranslation("common");

  useEffect(() => {
    const activeNavOption = getActiveNavOption(router.asPath, timeZone);
    setValue(activeNavOption ?? "");
  }, [router.asPath, timeZone]);

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
              href={getNavigationRouteInfo(id, timeZone).link}
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
