import type React from "react";
import type { Freechat } from "../../../shared/domain/freechat";
import { FreechatCardPresenter } from "../presenters/FreechatCardPresenter";

type FreechatCardProps = {
  freechat: Freechat;
};

export const FreechatCard: React.FC<FreechatCardProps> = ({ freechat }) => {
  return <FreechatCardPresenter freechat={freechat} />;
};
