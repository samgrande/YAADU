import type { Adb } from "@yume-chan/adb";
import { AppsRunningStrip } from "./AppsRunningStrip.js";
import { DeviceShellToggle } from "./DeviceShellToggle.js";
import { DevicePowerMenu } from "./DevicePowerMenu.js";

interface Props {
  adb: Adb;
}

export function BottomBar({ adb }: Props) {
  return (
    <div className="device-shell-bottom-bar">
      <div className="device-shell-left">
        <DeviceShellToggle />
        <DevicePowerMenu adb={adb} />
      </div>
      <AppsRunningStrip adb={adb} />
    </div>
  );
}
