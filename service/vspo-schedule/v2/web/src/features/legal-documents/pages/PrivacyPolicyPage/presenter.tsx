import { AgreementDocument } from "@/features/shared/components/Templates";
import { QA_LINK } from "@/lib/Const";
import type { TFunction } from "next-i18next";
import type React from "react";

type PrivacyPolicyPagePresenterProps = {
  t: TFunction;
};

export const PrivacyPolicyPagePresenter: React.FC<
  PrivacyPolicyPagePresenterProps
> = ({ t }) => {
  return (
    <AgreementDocument>
      <h1>{t("pageTitle")}</h1>
      <p>{t("intro")}</p>

      <h2>{t("article1.title")}</h2>
      <p>{t("article1.paragraph1")}</p>
      <p>{t("article1.paragraph2")}</p>

      <h2>{t("article2.title")}</h2>
      <p>{t("article2.content")}</p>

      <h2>{t("article3.title")}</h2>
      <p>{t("article3.intro")}</p>
      <ol>
        {(t("article3.purposes", { returnObjects: true }) as string[]).map(
          (purpose) => (
            <li key={purpose}>{purpose}</li>
          ),
        )}
      </ol>

      <h2>{t("article4.title")}</h2>
      <p>{t("article4.content")}</p>

      <h2>{t("article5.title")}</h2>
      <p>{t("article5.paragraph1")}</p>
      <p>{t("article5.paragraph2")}</p>
      <ol>
        {(
          t("article5.links", { returnObjects: true }) as Array<{
            text: string;
            url: string;
          }>
        ).map((link) => (
          <li key={link.url}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.text}
            </a>
          </li>
        ))}
      </ol>

      <h2>{t("article6.title")}</h2>
      <ol>
        {(t("article6.items", { returnObjects: true }) as string[]).map(
          (item) => (
            <li key={item}>{item}</li>
          ),
        )}
      </ol>

      <h2>{t("article7.title")}</h2>
      <p>
        {t("article7.content")}
        <a href={QA_LINK} target="_blank" rel="noopener noreferrer">
          {t("article7.linkText")}
        </a>
        {t("article7.suffix")}
      </p>
    </AgreementDocument>
  );
};
