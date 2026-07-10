import type { KeyboardEvent, MouseEvent } from "react";
import type { ShellWindowMeta } from "../ShellConsoleStore.js";
import { shellConsoleStore } from "../ShellConsoleStore.js";

interface Props {
  window: ShellWindowMeta;
  active: boolean;
}

export function ShellTab({ window, active }: Props) {
  const close = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void shellConsoleStore.closeWindow(window.id);
  };

  return (
    <div
      className={`shell-tab${active ? " active" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => shellConsoleStore.setActiveWindow(window.id)}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          shellConsoleStore.setActiveWindow(window.id);
        }
      }}
      data-status={window.status}
    >
      <span className="shell-tab-title">{window.title}</span>
      <button className="shell-tab-close" type="button" onClick={close} aria-label={`Close ${window.title}`}>x</button>
    </div>
  );
}
