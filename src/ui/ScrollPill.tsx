import React, { useEffect, useRef } from "react";

interface ScrollPillProps {
  panelRef: React.RefObject<HTMLDivElement | null>;
  pillClass?: string;
  thumbClass?: string;
}

export function ScrollPill({
  panelRef,
  pillClass = "apps-scroll-pill",
  thumbClass = "apps-scroll-thumb",
}: ScrollPillProps) {
  const pillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const PILL_H = 80;

  useEffect(() => {
    const panel = panelRef.current;
    const pill = pillRef.current;
    const thumb = thumbRef.current;
    if (!panel || !pill || !thumb) return;

    function update() {
      const { scrollTop, scrollHeight, clientHeight } = panel!;
      const canTop = scrollTop > 1;
      const canBot = scrollTop + clientHeight < scrollHeight - 1;
      const scrollable = canTop || canBot;

      panel!.classList.toggle("can-scroll-top", canTop);
      panel!.classList.toggle("can-scroll-bottom", canBot);
      pill!.classList.toggle("pill-visible", scrollable);

      if (scrollable && scrollHeight > clientHeight) {
        const thumbH = Math.max(16, (clientHeight / scrollHeight) * PILL_H);
        const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (PILL_H - thumbH);
        thumb!.style.height = `${thumbH}px`;
        thumb!.style.top = `${thumbTop}px`;
      }
    }

    panel.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(panel);
    update();

    return () => {
      panel.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [panelRef]);

  return (
    <div className={pillClass} ref={pillRef}>
      <div className={thumbClass} ref={thumbRef} />
    </div>
  );
}
