import { Button, Typography } from "@mui/material";
import { convertToUTCDate } from "@vspo-lab/dayjs";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import type React from "react";

type AdjacentYearMonthButtonProps = {
  disabled: boolean;
  yearMonth?: string;
  children: React.ReactNode;
};

const AdjacentYearMonthButton: React.FC<AdjacentYearMonthButtonProps> = ({
  disabled,
  yearMonth,
  children,
}) => (
  <Button
    color="inherit"
    {...(disabled
      ? { disabled: true }
      : { component: Link, href: `/events/${yearMonth}` })}
  >
    {children}
  </Button>
);

export type YearMonthSelectorProps = {
  prevYearMonth?: string;
  currentYearMonth: string;
  nextYearMonth?: string;
};

export const YearMonthSelector: React.FC<YearMonthSelectorProps> = ({
  prevYearMonth,
  currentYearMonth,
  nextYearMonth,
}) => {
  const { t } = useTranslation("events");

  return (
    <>
      <AdjacentYearMonthButton
        disabled={!prevYearMonth}
        yearMonth={prevYearMonth}
      >
        {t("prevMonth")}
      </AdjacentYearMonthButton>
      <Typography
        variant="h6"
        component="div"
        style={{ width: "160px", textAlign: "center" }}
      >
        {t("currMonth", { val: convertToUTCDate(currentYearMonth) })}
      </Typography>
      <AdjacentYearMonthButton
        disabled={!nextYearMonth}
        yearMonth={nextYearMonth}
      >
        {t("nextMonth")}
      </AdjacentYearMonthButton>
    </>
  );
};
