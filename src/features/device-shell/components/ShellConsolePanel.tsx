import { ShellTabStrip } from "./ShellTabStrip.js";
import { ShellTerminalView } from "./ShellTerminalView.js";
import { useShellConsoleStore } from "../ShellConsoleStore.js";

export function ShellConsolePanel() {
  const { isExpanded } = useShellConsoleStore();

  return (
    <section className={`shell-console-panel${isExpanded ? " expanded" : ""}`} aria-hidden={!isExpanded}>
      <div className="shell-console-inner">
        <ShellTabStrip />
        <ShellTerminalView />
      </div>
    </section>
  );
}
