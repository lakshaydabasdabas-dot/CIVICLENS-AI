import { useContext } from "react";
import { ComplaintsContext } from "./ComplaintsContext.js";

export function useComplaints() {
  const context = useContext(ComplaintsContext);

  if (!context) {
    throw new Error("useComplaints must be used inside a ComplaintsProvider.");
  }

  return context;
}
