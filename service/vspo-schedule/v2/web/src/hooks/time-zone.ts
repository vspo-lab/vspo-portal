import { useContext } from "react";
import { TimeZoneContext } from "@/context/TimeZoneContext";

export const useTimeZoneContext = () => {
  const context = useContext(TimeZoneContext);

  if (context === undefined) {
    throw new Error("Cannot access TimeZoneContext outside of its provider");
  }
  return context;
};
