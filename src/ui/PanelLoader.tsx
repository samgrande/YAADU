import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import loadingAnimation from "../assets/loading.json";

function hexToRgb01(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "").replace(/^ff/i, "");
  if (h.length === 6) {
    return [
      parseInt(h.substring(0, 2), 16) / 255,
      parseInt(h.substring(2, 4), 16) / 255,
      parseInt(h.substring(4, 6), 16) / 255,
    ];
  }
  return null;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function recolorAnimation(accentHex: string) {
  const rgb = hexToRgb01(accentHex);
  if (!rgb) return loadingAnimation;

  const data = structuredClone(loadingAnimation) as typeof loadingAnimation;

  const darkBase = [0.5333333333333333, 0.34509803921568627, 0.34509803921568627];
  const lightBase = [1, 0.6901960784313725, 0.6901960784313725];

  for (const layer of data.layers) {
    for (const shape of layer.shapes) {
      for (const item of shape.it) {
        if (item.ty === "fl" && item.c?.k) {
          const c = item.c.k;
          const isDark =
            Math.abs(c[0] - darkBase[0]) < 0.01 &&
            Math.abs(c[1] - darkBase[1]) < 0.01 &&
            Math.abs(c[2] - darkBase[2]) < 0.01;
          const isLight =
            Math.abs(c[0] - lightBase[0]) < 0.01 &&
            Math.abs(c[1] - lightBase[1]) < 0.01 &&
            Math.abs(c[2] - lightBase[2]) < 0.01;

          if (isDark) {
            c[0] = rgb[0];
            c[1] = rgb[1];
            c[2] = rgb[2];
          } else if (isLight) {
            c[0] = lerp(rgb[0], 1, 0.3);
            c[1] = lerp(rgb[1], 1, 0.3);
            c[2] = lerp(rgb[2], 1, 0.3);
          }
        }
      }
    }
  }

  return data;
}

function getAccentColor(): string {
  const style = getComputedStyle(document.documentElement);
  const primary = style.getPropertyValue("--md-sys-color-primary").trim();
  if (primary) return primary;

  const themeColor = localStorage.getItem("yaadu:theme");
  if (themeColor) {
    try {
      const parsed = JSON.parse(themeColor);
      if (parsed.color) return parsed.color;
    } catch {}
  }
  return "#376A3E";
}

export function PanelLoader() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const accentColor = getAccentColor();
    const data = recolorAnimation(accentColor);

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: data,
    });
    return () => anim.destroy();
  }, []);

  return (
    <div className="panel-loader">
      <div ref={containerRef} className="panel-loader-canvas" />
    </div>
  );
}
