import type { Event } from "@/features/shared/domain";
import type React from "react";
import { EventsContentPresenter } from "./presenter";

type ContainerProps = {
  events: Event[];
};

export const EventsContentContainer: React.FC<ContainerProps> = ({
  events,
}) => {
  return <EventsContentPresenter events={events} />;
};
