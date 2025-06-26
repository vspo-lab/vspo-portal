import { SelectChangeEvent } from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { useRouter } from "next/router";
import React from "react";
import { useFavoriteSearchCondition } from "../../../hooks/useFavoriteSearchConditions";
import type { FavoriteSearchCondition } from "../../../types/favorite";
import { DateSearchDialog, DateSearchFormData } from "./DateSearchDialog";

type DateSearchDialogContainerProps = {
  open: boolean;
  onClose: () => void;
};

export const DateSearchDialogContainer: React.FC<
  DateSearchDialogContainerProps
> = ({ open, onClose }) => {
  const router = useRouter();
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

    if (router.query.date && typeof router.query.date === "string") {
      const dateFromQuery = new Date(router.query.date);
      if (!isNaN(dateFromQuery.getTime())) {
        updateFormData.selectedDate = dateFromQuery;
        setDateInputValue(format(dateFromQuery, "yyyy-MM-dd"));
        hasUpdate = true;
      }
    }

    if (
      router.query.memberType &&
      typeof router.query.memberType === "string"
    ) {
      updateFormData.memberType = router.query.memberType;
      hasUpdate = true;
    }

    if (router.query.platform && typeof router.query.platform === "string") {
      updateFormData.platform = router.query.platform;
      hasUpdate = true;
    }

    if (hasUpdate) {
      setFormData((prevData) => ({
        ...prevData,
        ...updateFormData,
      }));
    }
  }, [router.query.date, router.query.memberType, router.query.platform]);

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
    // Create a new query object
    const query = { ...router.query };

    if (formData.selectedDate) {
      query.date = format(formData.selectedDate, "yyyy-MM-dd");
    } else {
      delete query.date;
    }

    if (formData.memberType && formData.memberType !== "vspo_all") {
      query.memberType = formData.memberType;
    } else {
      delete query.memberType;
    }

    if (formData.platform) {
      query.platform = formData.platform;
    } else {
      delete query.platform;
    }

    // Navigate to the same page with updated query parameters to trigger SSR
    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: false },
    ); // Use shallow: false to trigger full SSR

    onClose();
  };

  const handleClear = () => {
    setFormData({
      selectedDate: null,
      memberType: "vspo_all",
      platform: "",
    });
    setDateInputValue("");

    // Remove all search parameters and navigate to trigger SSR
    const query = { ...router.query };
    delete query.date;
    delete query.memberType;
    delete query.platform;

    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: false },
    ); // Use shallow: false to trigger full SSR

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
    const query = { ...router.query };
    delete query.date;
    delete query.memberType;
    delete query.platform;

    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: false },
    );

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
