"use client";

import { Autocomplete, Box, MenuItem, TextField } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";
import { useTimeZoneContext } from "@/hooks";
import { usePathname, useRouter } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";

export const TimeZoneSelector = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { timeZone, setTimeZone } = useTimeZoneContext();
  const t = useTranslations("common");

  const labels = useMemo(() => {
    return Intl.supportedValuesOf("timeZone").reduce<
      Record<string, React.ReactNode>
    >((acc, tz) => {
      acc[tz] = getTimeZoneLabel(tz);
      return acc;
    }, {});
  }, []);
  const timeZones = Intl.supportedValuesOf("timeZone");
  const now = Date.now();
  const formattedTimeZoneOffsets = timeZones.reduce<Record<string, string>>(
    (acc, tz) => {
      acc[tz] = formatDate(now, "OOOO", { timeZone: tz });
      return acc;
    },
    {},
  );

  return (
    <Autocomplete
      id="time-zone-select"
      autoHighlight
      slotProps={{
        popper: {
          style: { width: "fit-content" },
        },
      }}
      renderInput={(params) => (
        <TextField {...params} size="small" label={t("drawer.timeZone")} />
      )}
      value={timeZone}
      onChange={(_event, newValue) => {
        const value = newValue ?? timeZone;
        setTimeZone(value);
        if (
          formattedTimeZoneOffsets[value] !== formattedTimeZoneOffsets[timeZone]
        ) {
          const search = searchParams.toString();
          const href = search ? `${pathname}?${search}` : pathname;
          router.replace(href, { scroll: false });
        }
      }}
      options={timeZones}
      filterOptions={(options, state) => {
        return options.filter((option) => {
          return normalizeTimeZone(option).includes(
            normalizeTimeZone(state.inputValue).replaceAll(" ", "_"),
          );
        });
      }}
      renderOption={(props, tz) => {
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        const { key, ...optionProps } = props;
        return (
          <MenuItem
            key={key}
            component="li"
            {...optionProps}
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: "8px",
            }}
          >
            <Box sx={{ width: "200px" }}>{labels[tz]}</Box>
            <Box
              sx={(theme) => ({
                color: theme.vars.palette.text.secondary,
                fontFamily: "monospace",
                fontSize: "14px",
              })}
            >
              {formattedTimeZoneOffsets[tz]}
            </Box>
          </MenuItem>
        );
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      }}
    />
  );
};

const normalizeTimeZone = (s: string) => s.toLowerCase();

const getTimeZoneLabel = (timeZone: string) => (
  <>
    {timeZone.split("/").map((part, i) => (
      <React.Fragment key={i}>
        {i !== 0 && (
          <>
            <wbr />/
          </>
        )}
        {part}
      </React.Fragment>
    ))}
  </>
);
