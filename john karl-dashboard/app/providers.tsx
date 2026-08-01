"use client";

import { Provider } from "react-redux";
import { store } from "../lib/store";
import { SessionBootstrap } from "./components/auth/SessionBootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionBootstrap />
      {children}
    </Provider>
  );
}
