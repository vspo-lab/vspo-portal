import { useRouter } from "next/router";
import type * as React from "react";
import { AboutPagePresenter } from "./presenter";

type AboutPageContainerProps = {
  sections: Array<{
    slug: string;
    title: string;
    content: string;
  }>;
};

export const AboutPageContainer: React.FC<AboutPageContainerProps> = ({
  sections,
}) => {
  const router = useRouter();
  const locale = router.locale || "ja";

  return <AboutPagePresenter sections={sections} locale={locale} />;
};
