import Head from "next/head";
import { useTranslation } from "next-i18next";

type CustomHeadProps = {
  title?: string;
  description?: string;
  path?: string;
  canonicalPath?: string;
};

export const CustomHead = ({
  title = "",
  description = "",
  path = "",
  canonicalPath = "",
}: CustomHeadProps = {}) => {
  const { t } = useTranslation("common");

  const pageTitle = title
    ? `${t("spodule")} | ${title}`
    : `${t("spodule")} - ${t("vspo")}`;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta
        property="og:url"
        content={`https://www.vspo-schedule.com${canonicalPath || path}`}
      />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={description} />
      {canonicalPath && (
        <link
          rel="canonical"
          href={`https://www.vspo-schedule.com${canonicalPath}`}
        />
      )}
    </Head>
  );
};
