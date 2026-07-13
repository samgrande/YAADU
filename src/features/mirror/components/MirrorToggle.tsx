import { mirrorStore, useMirrorStore } from "../MirrorStore.js";

export function MirrorToggle() {
  const { isExpanded } = useMirrorStore();

  return (
    <button
      className={`mirror-toggle${isExpanded ? " active" : ""}`}
      onClick={() => mirrorStore.toggleExpanded()}
      title="Screen Mirror"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
      <span>Mirror</span>
    </button>
  );
}
