import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import {
  DocumentHeadTags,
  type DocumentHeadTagsProps,
  documentGetInitialProps,
} from "@mui/material-nextjs/v14-pagesRouter";
import {
  type DocumentContext,
  type DocumentProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import i18nextConfig from "../../next-i18next.config";

export default function MyDocument(
  props: DocumentProps & DocumentHeadTagsProps,
) {
  const currentLocale =
    props.__NEXT_DATA__.locale ?? i18nextConfig.i18n.defaultLocale;

  return (
    <Html lang={currentLocale}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <DocumentHeadTags {...props} />
        <link
          rel="preconnect"
          href="https://yt3.ggpht.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        {process.env.ENV === "production" && (
          <script
            async
            src={process.env.NEXT_PUBLIC_ADS_GOOGLE}
            crossOrigin="anonymous"
          />
        )}
        <meta charSet="utf-8" />
        <meta
          name="keywords"
          content="VSPO!, Vspo, ぶいすぽっ！, ぶいすぽ, streaming schedule, 配信スケジュール, 直播时间表, 直播時間表, 스트리밍 일정, virtual esports, vtuber, esports, gaming"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://www.vspo-schedule.com/page-icon.png"
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:image"
          content="https://www.vspo-schedule.com/page-icon.png"
        />
        <meta name="robots" content="all" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#fff" />
      </Head>
      <body>
        <InitColorSchemeScript attribute="class" />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const finalProps = await documentGetInitialProps(ctx);
  return finalProps;
};
