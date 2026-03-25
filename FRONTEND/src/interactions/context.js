import { createContext, useContext } from "react";

export const InteractionContext = createContext(null);

export const useInteractionController = () => useContext(InteractionContext);
