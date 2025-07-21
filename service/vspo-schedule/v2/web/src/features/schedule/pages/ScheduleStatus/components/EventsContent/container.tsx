import type React from "react";
import type { Event } from "@/features/shared/domain";
import { EventsContentPresenter } from "./presenter";

type ContainerProps = {
  events: Event[];
};

export const EventsContentContainer: React.FC<ContainerProps> = ({
  events,
}) => {
  return <EventsContentPresenter events={events} />;
};
