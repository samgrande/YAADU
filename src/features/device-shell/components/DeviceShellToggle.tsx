import { shellConsoleStore, useShellConsoleStore } from "../ShellConsoleStore.js";

const ShellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 5.5C4 4.67 4.67 4 5.5 4h13C19.33 4 20 4.67 20 5.5v13c0 .83-.67 1.5-1.5 1.5h-13C4.67 20 4 19.33 4 18.5v-13Z" />
    <path d="m8 9 3 3-3 3" />
    <path d="M13 15h3" />
  </svg>
);

export function DeviceShellToggle() {
  const { isExpanded, windows } = useShellConsoleStore();

  const handleClick = () => {
    if (windows.length === 0) {
      void shellConsoleStore.openNewWindow();
      return;
    }
    shellConsoleStore.toggleExpanded();
  };

  return (
    <button
      className={`device-shell-toggle${isExpanded ? " active" : ""}`}
      type="button"
      onClick={handleClick}
      aria-pressed={isExpanded}
    >
      <span className="device-shell-toggle-icon"><ShellIcon /></span>
      <span>Device Shell</span>
    </button>
  );
}
