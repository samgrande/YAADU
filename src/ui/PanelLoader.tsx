import { useEffect, useRef } from "react";
import "@dotlottie/player-component";
import loadingLottie from "../assets/loading.lottie";

export function PanelLoader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const player = el.querySelector("dotlottie-player") as any;
    if (player) {
      player.addEventListener("load", () => {
        player.play();
      });
    }
  }, []);

  return (
    <div className="panel-loader">
      <div ref={ref}>
        <dotlottie-player
          src={loadingLottie}
          autoplay
          loop
          style={{ width: "120px", height: "120px" }}
        />
      </div>
    </div>
  );
}
