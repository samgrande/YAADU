import { useEffect, type ReactNode } from "react";
import type { Adb } from "@yume-chan/adb";
import { shellManager } from "./ShellManager.js";

interface Props {
  adb: Adb;
  children: ReactNode;
}

export function DeviceShellProvider({ adb, children }: Props) {
  useEffect(() => {
    shellManager.setAdb(adb);
    return () => {
      shellManager.setAdb(null);
    };
  }, [adb]);

  return <>{children}</>;
}
