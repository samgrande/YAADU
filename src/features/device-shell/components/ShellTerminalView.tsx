import "xterm/css/xterm.css";
import { useEffect, useRef } from "react";
import { shellManager } from "../ShellManager.js";
import { useShellConsoleStore } from "../ShellConsoleStore.js";

interface TerminalPaneProps {
  id: string;
  active: boolean;
  expanded: boolean;
}

function TerminalPane({ id, active, expanded }: TerminalPaneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const openedRef = useRef(false);
  const session = shellManager.getSession(id);

  useEffect(() => {
    if (!session || !hostRef.current || openedRef.current) return;
    session.terminal.open(hostRef.current);
    openedRef.current = true;
    session.fitAndResize();
  }, [session]);

  useEffect(() => {
    if (!session || !active || !expanded) return;
    session.applyTheme();
    session.fitAndResize();
  }, [active, expanded, session]);

  useEffect(() => {
    if (!session) return;
    const onThemeChange = () => {
      session.applyTheme();
      if (active && expanded) session.fitAndResize();
    };
    window.addEventListener("themeChange", onThemeChange);
    return () => window.removeEventListener("themeChange", onThemeChange);
  }, [active, expanded, session]);

  useEffect(() => {
    if (!session || !active) return;
    const onResize = () => {
      if (expanded) session.fitAndResize();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, expanded, session]);

  useEffect(() => {
    if (!session || !hostRef.current) return;
    const el = hostRef.current;
    const observer = new ResizeObserver(() => {
      if (expanded) session.fitAndResize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [session, expanded]);

  return (
    <div className={`shell-terminal-pane${active ? " active" : ""}`} aria-hidden={!active}>
      <div className="shell-terminal-host" ref={hostRef} />
    </div>
  );
}

export function ShellTerminalView() {
  const { windows, activeWindowId, isExpanded, error } = useShellConsoleStore();

  return (
    <div className="shell-terminal-frame">
      {windows.length === 0 && !error && (
        <div className="shell-terminal-empty">device /&gt;</div>
      )}
      {error && <div className="shell-terminal-error">{error}</div>}
      {windows.map((window) => (
        <TerminalPane
          key={window.id}
          id={window.id}
          active={window.id === activeWindowId}
          expanded={isExpanded}
        />
      ))}
    </div>
  );
}
