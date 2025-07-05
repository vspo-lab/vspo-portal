import { useTranslation } from "next-i18next";
import type * as React from "react";
import { PrivacyPolicyPagePresenter } from "./presenter";

export const PrivacyPolicyPageContainer: React.FC = () => {
  const { t } = useTranslation("privacy");
  return <PrivacyPolicyPagePresenter t={t} />;
};
