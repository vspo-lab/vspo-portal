"use client";

import type { SelectChangeEvent } from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { useSearchParams } from "next/navigation";
import React from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useFavoriteSearchCondition } from "../../../hooks/useFavoriteSearchConditions";
import type { FavoriteSearchCondition } from "../../../types/favorite";
import { DateSearchDialog, type DateSearchFormData } from "./DateSearchDialog";

type DateSearchDialogContainerProps = {
  open: boolean;
  onClose: () => void;
};

export const DateSearchDialogContainer: React.FC<
  DateSearchDialogContainerProps
> = ({ open, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [formData, setFormData] = React.useState<DateSearchFormData>({
    selectedDate: null,
    memberType: "vspo_all",
    platform: "",
  });

  const [dateInputValue, setDateInputValue] = React.useState<string>("");
  const { favorite, saveFavorite, deleteFavorite, hasFavorite } =
    useFavoriteSearchCondition();

  // Initialize form data from URL query parameters if available
  React.useEffect(() => {
    const updateFormData: Partial<DateSearchFormData> = {};
    let hasUpdate = false;

    const dateParam = searchParams.get("date");
    if (dateParam) {
      const dateFromQuery = new Date(dateParam);
      if (!Number.isNaN(dateFromQuery.getTime())) {
        updateFormData.selectedDate = dateFromQuery;
        setDateInputValue(format(dateFromQuery, "yyyy-MM-dd"));
        hasUpdate = true;
      }
    }

    const memberTypeParam = searchParams.get("memberType");
    if (memberTypeParam) {
      updateFormData.memberType = memberTypeParam;
      hasUpdate = true;
    }

    const platformParam = searchParams.get("platform");
    if (platformParam) {
      updateFormData.platform = platformParam;
      hasUpdate = true;
    }

    if (hasUpdate) {
      setFormData((prevData) => ({
        ...prevData,
        ...updateFormData,
      }));
    }
  }, [searchParams]);

  // Update date input value when selectedDate changes
  React.useEffect(() => {
    if (formData.selectedDate) {
      setDateInputValue(format(formData.selectedDate, "yyyy-MM-dd"));
    } else {
      setDateInputValue("");
    }
  }, [formData.selectedDate]);

  const handleChange = (
    field: keyof DateSearchFormData,
    value: Date | null | string,
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDateInputValue(newValue);

    if (newValue) {
      const parsedDate = parse(newValue, "yyyy-MM-dd", new Date());
      if (isValid(parsedDate)) {
        handleChange("selectedDate", parsedDate);
      } else {
        handleChange("selectedDate", null);
      }
    } else {
      handleChange("selectedDate", null);
    }
  };

  const handleMemberTypeChange = (event: SelectChangeEvent) => {
    handleChange("memberType", event.target.value);
  };

  const handlePlatformChange = (event: SelectChangeEvent) => {
    handleChange("platform", event.target.value);
  };

  // Check if at least one filter is applied to enable the search button
  const isSearchEnabled = !!(
    formData.selectedDate ||
    (formData.memberType && formData.memberType !== "vspo_all") ||
    formData.platform
  );

  const handleSubmit = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (formData.selectedDate) {
      params.set("date", format(formData.selectedDate, "yyyy-MM-dd"));
    } else {
      params.delete("date");
    }

    if (formData.memberType && formData.memberType !== "vspo_all") {
      params.set("memberType", formData.memberType);
    } else {
      params.delete("memberType");
    }

    if (formData.platform) {
      params.set("platform", formData.platform);
    } else {
      params.delete("platform");
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);

    onClose();
  };

  const handleClear = () => {
    setFormData({
      selectedDate: null,
      memberType: "vspo_all",
      platform: "",
    });
    setDateInputValue("");

    // Remove all search parameters and navigate
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    params.delete("memberType");
    params.delete("platform");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);

    onClose();
  };

  const handleSaveFavorite = () => {
    const condition = {
      memberType: formData.memberType as FavoriteSearchCondition["memberType"],
      platform: formData.platform as FavoriteSearchCondition["platform"],
    };

    saveFavorite(condition);
  };

  const handleLoadFavorite = () => {
    if (!favorite) return;

    // Navigate without query parameters to apply server-side favorite filtering
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    params.delete("memberType");
    params.delete("platform");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);

    onClose();
  };

  const handleDeleteFavorite = () => {
    deleteFavorite();
  };

  const isSaveEnabled = !!(
    formData.selectedDate ||
    (formData.memberType && formData.memberType !== "vspo_all") ||
    formData.platform
  );

  return (
    <DateSearchDialog
      open={open}
      onClose={onClose}
      dateInputValue={dateInputValue}
      formData={formData}
      isSearchEnabled={isSearchEnabled}
      favorite={favorite}
      hasFavorite={hasFavorite}
      isSaveEnabled={isSaveEnabled}
      onDateInputChange={handleDateInputChange}
      onMemberTypeChange={handleMemberTypeChange}
      onPlatformChange={handlePlatformChange}
      onSubmit={handleSubmit}
      onClear={handleClear}
      onSaveFavorite={handleSaveFavorite}
      onLoadFavorite={handleLoadFavorite}
      onDeleteFavorite={handleDeleteFavorite}
    />
  );
};
