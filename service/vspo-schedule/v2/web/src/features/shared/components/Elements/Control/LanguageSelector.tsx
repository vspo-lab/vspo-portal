import LanguageIcon from "@mui/icons-material/Language";
import { InputAdornment, MenuItem, TextField } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useLocale } from "@/hooks";

const localeLabels: { [localeCode: string]: string } = {
  en: "English",
  ja: "日本語",
  cn: "简体中文",
  tw: "繁體中文",
  ko: "한국어",
};

export const LanguageSelector = () => {
  const { t } = useTranslation("common");
  const { locale, setLocale } = useLocale();

  return (
    <TextField
      select
      size="small"
      id="language-select"
      label={t("drawer.language")}
      value={locale}
      onChange={(event) => {
        const selectedLocale = event.target.value;
        setLocale(selectedLocale);
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <LanguageIcon />
            </InputAdornment>
          ),
        },
      }}
    >
      {Object.keys(localeLabels).map((loc) => (
        <MenuItem key={loc} value={loc}>
          {localeLabels[loc]}
        </MenuItem>
      ))}
    </TextField>
  );
};
