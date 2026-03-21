"use client";

import type * as React from "react";
import { AboutPagePresenter } from "./presenter";

type AboutPageContainerProps = {
  sections: Array<{
    slug: string;
    title: string;
    content: string;
  }>;
  locale: string;
};

export const AboutPageContainer: React.FC<AboutPageContainerProps> = ({
  sections,
  locale,
}) => {
  return <AboutPagePresenter sections={sections} locale={locale} />;
};
