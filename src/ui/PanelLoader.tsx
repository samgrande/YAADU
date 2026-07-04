import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import loadingAnimation from "../assets/loading.json";

export function PanelLoader() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: loadingAnimation,
    });
    return () => anim.destroy();
  }, []);

  return (
    <div className="panel-loader">
      <div ref={containerRef} className="panel-loader-canvas" />
    </div>
  );
}
