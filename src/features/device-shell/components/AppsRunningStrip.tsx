import { useEffect, useRef, useState } from "react";
import type { Adb } from "@yume-chan/adb";
import { getRunningApps, fetchAppIcon, launchApp } from "../../../adb/apps.js";

const MAX_VISIBLE = 10;
const POLL_MS = 1000;
const ICON_BATCH = 3;

interface Props {
  adb?: Adb | null;
}

export function AppsRunningStrip({ adb }: Props) {
  const [runningApps, setRunningApps] = useState<string[]>([]);
  const [iconCache, setIconCache] = useState<Record<string, string | null>>({});
  const iconCacheRef = useRef<Record<string, string | null>>({});

  useEffect(() => {
    if (!adb) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const apps = await getRunningApps(adb);
        if (cancelled) return;

        setRunningApps(apps);

        const unknown = apps.filter((pkg) => !(pkg in iconCacheRef.current));
        if (unknown.length === 0) return;

        const queue = [...unknown];
        while (queue.length > 0) {
          if (cancelled) return;
          const batch = queue.splice(0, ICON_BATCH);
          await Promise.allSettled(
            batch.map(async (pkg) => {
              try {
                const url = await fetchAppIcon(pkg);
                iconCacheRef.current[pkg] = url ?? null;
              } catch {
                iconCacheRef.current[pkg] = null;
              }
            })
          );
          if (!cancelled) {
            setIconCache({ ...iconCacheRef.current });
          }
        }
      } catch {
        // ignore
      }
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [adb]);

  if (runningApps.length === 0) return null;

  const visible = runningApps.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, runningApps.length - MAX_VISIBLE);

  return (
    <div className="apps-running-strip" aria-label={`${runningApps.length} apps running`}>
      <span className="apps-running-label">Apps Running</span>
      <span className="apps-running-divider" />
      <span className="apps-running-dots" aria-hidden="true">
        {visible.map((pkg) => {
          const iconUrl = iconCache[pkg];
          return (
            <div
              className="apps-running-dot"
              key={pkg}
              title={pkg}
              onClick={() => { if (adb) launchApp(adb, pkg); }}
              role="button"
              tabIndex={0}
            >
              {iconUrl ? (
                <img src={iconUrl} className="app-icon-img" alt="" />
              ) : (
                <div className="app-icon-square-placeholder">
                  <span className="avatar-letter">
                    {(pkg.split(".").pop() ?? pkg).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </span>
      {overflow > 0 && <span className="apps-running-overflow">+ {overflow}</span>}
    </div>
  );
}
