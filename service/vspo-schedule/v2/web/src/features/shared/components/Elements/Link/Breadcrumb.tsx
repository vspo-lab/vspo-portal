"use client";

// components/Elements/Breadcrumb.tsx
import { Breadcrumbs, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "./Link";

export const Breadcrumb = () => {
  const pathname = usePathname();
  const pathnames = pathname.split("/").slice(1);
  const t = useTranslations("common");

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link href="/">{t("breadcrumbs.pages.home")}</Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const key = `breadcrumbs.pages.${value}` as const;
        const name = t.has(key) ? t(key) : value;

        return last ? (
          <Typography key={to} sx={{ color: "text.primary" }}>
            {name}
          </Typography>
        ) : (
          <Link key={to} href={to}>
            {name}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};
