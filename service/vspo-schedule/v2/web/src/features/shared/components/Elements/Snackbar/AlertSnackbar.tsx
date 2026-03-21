"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Alert, IconButton, Snackbar } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";

const StyledAlert = styled(Alert)({
  backgroundColor: "#e5f6fd",
  color: "#014361",
  whiteSpace: "pre-line",
});

type AlertSnackbarProps = {
  open: boolean;
  onClose: () => void;
};

export const AlertSnackbar: React.FC<AlertSnackbarProps> = ({
  open,
  onClose,
}) => {
  const t = useTranslations("common");

  return (
    <Snackbar
      open={open}
      anchorOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      sx={{ marginTop: "48px" }}
    >
      <StyledAlert
        severity="info"
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {`[${t("alert.title")}]`}
        <br />
        {t("alert.message")}
      </StyledAlert>
    </Snackbar>
  );
};
