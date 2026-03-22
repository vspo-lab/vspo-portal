import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AboutPageContainer } from "@/features/about/pages/AboutPage/container";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { getAllMarkdownSlugs, getMarkdownContent } from "@/lib/markdown";

export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "ja" },
    { locale: "cn" },
    { locale: "tw" },
    { locale: "ko" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const slugs = await getAllMarkdownSlugs("about");
  const sectionsResults = await Promise.all(
    slugs.map(async (slug) => {
      const content = await getMarkdownContent(locale, "about", slug);
      if (!content) return null;

      return {
        slug,
        title: String(content.data.title || slug),
        content: content.content,
        order: Number(content.data.order) || 999,
      };
    }),
  );

  const sections = sectionsResults
    .filter(
      (section): section is NonNullable<typeof section> => section !== null,
    )
    .sort((a, b) => a.order - b.order)
    .map(({ slug, title, content }) => ({ slug, title, content }));

  return (
    <ContentLayout title={t("title")} path="/about" maxPageWidth="md" padTop>
      <AboutPageContainer sections={sections} locale={locale} />
    </ContentLayout>
  );
}
