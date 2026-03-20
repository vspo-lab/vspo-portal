import { Grid } from "@mui/material";
import type React from "react";
import type { Freechat } from "../../../shared/domain/freechat";
import { FreechatCard } from "../../components";

type FreechatPagePresenterProps = {
  freechats: Freechat[];
};

export const FreechatPagePresenter: React.FC<FreechatPagePresenterProps> = ({
  freechats,
}) => {
  return (
    <Grid container spacing={3} sx={{ width: "100%" }}>
      {freechats.map((freechat) => (
        <Grid size={{ xs: 6, md: 3 }} key={freechat.id}>
          <FreechatCard freechat={freechat} />
        </Grid>
      ))}
    </Grid>
  );
};
