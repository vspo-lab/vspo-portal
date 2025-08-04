import type { TFunction } from "next-i18next";
import type React from "react";
import { AgreementDocument } from "@/features/shared/components/Templates";

type TermsPagePresenterProps = {
  t: TFunction;
};

export const TermsPagePresenter: React.FC<TermsPagePresenterProps> = ({
  t,
}) => {
  return (
    <AgreementDocument>
      <h1>{t("pageTitle")}</h1>
      <p>{t("intro")}</p>

      <h2>{t("article1.title")}</h2>
      <p>{t("article1.content")}</p>

      <h2>{t("article2.title")}</h2>
      <p>{t("article2.intro")}</p>
      <ol>
        {(t("article2.items", { returnObjects: true }) as string[]).map(
          (item) => (
            <li key={item}>{item}</li>
          ),
        )}
      </ol>

      <h2>{t("article3.title")}</h2>
      <p>{t("article3.intro")}</p>
      <ol>
        {(t("article3.items", { returnObjects: true }) as string[]).map(
          (item) => (
            <li key={item}>{item}</li>
          ),
        )}
      </ol>
      <p>{t("article3.paragraph2")}</p>

      <h2>{t("article4.title")}</h2>
      <p>{t("article4.content")}</p>

      <h2>{t("article5.title")}</h2>
      <p>{t("article5.paragraph1")}</p>
      <p>{t("article5.paragraph2")}</p>

      <h2>{t("article6.title")}</h2>
      <p>{t("article6.intro")}</p>
      <ul>
        {(t("article6.apis", { returnObjects: true }) as string[]).map(
          (api) => (
            <li key={api}>{api}</li>
          ),
        )}
      </ul>
      <p>{t("article6.paragraph2")}</p>
      <ul>
        {(
          t("article6.links", { returnObjects: true }) as Array<{
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
      </ul>

      <h2>{t("article7.title")}</h2>
      <p>{t("article7.content")}</p>

      <h2>{t("article8.title")}</h2>
      <p>{t("article8.content")}</p>

      <h2>{t("article9.title")}</h2>
      <p>{t("article9.content")}</p>

      <h2>{t("article10.title")}</h2>
      <p>{t("article10.content")}</p>

      <h2>{t("article11.title")}</h2>
      <p>{t("article11.paragraph1")}</p>
      <p>{t("article11.paragraph2")}</p>
    </AgreementDocument>
  );
};
