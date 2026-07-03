import { createContext, useContext } from "react";
import type { AppState, AppAction } from "./state.js";
import { initialState } from "./state.js";

export interface AppContextValue {
  state:    AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextValue>({
  state:    initialState,
  dispatch: () => {},
});

export function useAppContext(): AppContextValue {
  return useContext(AppContext);
}
