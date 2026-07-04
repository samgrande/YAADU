import { useEffect, useRef } from "react";
import { DotLottie } from "@lottiefiles/dotlottie-web";
import loadingLottie from "../assets/loading.lottie";

export function PanelLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const dotLottie = new DotLottie({
      canvas: canvasRef.current,
      src: loadingLottie as unknown as string,
      autoplay: true,
      loop: true,
    });
    return () => {
      dotLottie.destroy();
    };
  }, []);

  return (
    <div className="panel-loader">
      <canvas ref={canvasRef} className="panel-loader-canvas" />
    </div>
  );
}
