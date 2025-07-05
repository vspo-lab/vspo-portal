import { DEFAULT_LOCALE } from "@/lib/Const";
import { serverSideTranslations } from "@/lib/i18n/server";
import { getAllMarkdownSlugs, getMarkdownContent } from "@/lib/markdown";
import { getInitializedI18nInstance } from "@/lib/utils";
import type { GetServerSideProps } from "next";

export type AboutPageProps = {
  meta: {
    title: string;
    description: string;
  };
  sections: Array<{
    slug: string;
    title: string;
    content: string;
  }>;
};

export const getServerSideProps: GetServerSideProps<AboutPageProps> = async ({
  locale = DEFAULT_LOCALE,
}) => {
  const translations = await serverSideTranslations(locale, [
    "common",
    "about",
  ]);
  const { t } = getInitializedI18nInstance(translations, "about");
  // Get all about sections
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

  return {
    props: {
      ...translations,
      meta: {
        title: t("title"),
        description: t("description"),
      },
      sections,
    },
  };
};
