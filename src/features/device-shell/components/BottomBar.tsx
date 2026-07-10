import type { Adb } from "@yume-chan/adb";
import { AppsRunningStrip } from "./AppsRunningStrip.js";
import { DeviceShellToggle } from "./DeviceShellToggle.js";

interface Props {
  adb: Adb;
}

export function BottomBar({ adb }: Props) {
  return (
    <div className="device-shell-bottom-bar">
      <DeviceShellToggle />
      <AppsRunningStrip adb={adb} />
    </div>
  );
}
