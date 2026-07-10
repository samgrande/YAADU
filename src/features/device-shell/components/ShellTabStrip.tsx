import { shellConsoleStore, useShellConsoleStore } from "../ShellConsoleStore.js";
import { ShellTab } from "./ShellTab.js";

export function ShellTabStrip() {
  const { windows, activeWindowId } = useShellConsoleStore();

  return (
    <div className="shell-tab-strip">
      {windows.map((window) => (
        <ShellTab key={window.id} window={window} active={window.id === activeWindowId} />
      ))}
      <button
        className="shell-add-tab"
        type="button"
        onClick={() => { void shellConsoleStore.openNewWindow(); }}
        aria-label="Open shell window"
      >
        +
      </button>
    </div>
  );
}
