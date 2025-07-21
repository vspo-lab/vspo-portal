// components/Elements/Breadcrumb.tsx
import { Breadcrumbs, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { Link } from "./Link";

export const Breadcrumb = () => {
  const router = useRouter();
  const pathnames = router.asPath.split("/").slice(1);
  const { t } = useTranslation("common");

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link href="/">{t("breadcrumbs.pages.home")}</Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const name = t(`breadcrumbs.pages.${value}`, value);

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
