interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  hue: "pigment" | "pigment-alt" | "nucleus";
  phase: number;
}

const COUNT = 26;

function css(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || "#888";
}

function edgeWeight(x: number, w: number): number {
  const centre = Math.abs(x / w - 0.5) * 2;
  return 0.25 + 0.75 * centre * centre;
}

export function startScene(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;
  let alive = true;
  const still = document.documentElement.dataset.motion === "still";
  let w = 0;
  let h = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const hues: Mote["hue"][] = ["pigment", "pigment-alt", "nucleus"];
  const motes: Mote[] = Array.from({ length: COUNT }, (_, i) => {
    const side = i % 2 === 0 ? Math.random() * 0.22 : 0.78 + Math.random() * 0.22;
    return {
      x: side * w,
      y: Math.random() * h,
      r: 40 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      hue: hues[i % hues.length] ?? "pigment",
      phase: Math.random() * Math.PI * 2,
    };
  });

  let colours = { pigment: css("pigment"), "pigment-alt": css("pigment-alt"), nucleus: css("nucleus") };
  let light = document.documentElement.dataset.theme === "light";
  const observer = new MutationObserver(() => {
    colours = { pigment: css("pigment"), "pigment-alt": css("pigment-alt"), nucleus: css("nucleus") };
    light = document.documentElement.dataset.theme === "light";
    if (still) draw(0);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-world", "data-theme"] });
  const stop = () => {
    alive = false;
    observer.disconnect();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
  };

  const draw = (t: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = light ? "multiply" : "screen";
    for (const m of motes) {
      const breathe = 1 + Math.sin(t / 2400 + m.phase) * 0.12;
      const r = m.r * breathe;
      const alpha = (light ? 0.1 : 0.14) * edgeWeight(m.x, w);
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
      const c = colours[m.hue];
      g.addColorStop(0, c);
      g.addColorStop(1, "transparent");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  };

  let visible = true;
  function onVisibility(): void {
    visible = document.visibilityState === "visible";
    if (visible && !still) requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", onVisibility);

  if (still) {
    draw(0);
    return stop;
  }

  function frame(t: number): void {
    if (!visible || !alive) return;
    for (const m of motes) {
      m.x += m.vx;
      m.y += m.vy;
      if (m.x < -m.r) m.x = w + m.r;
      if (m.x > w + m.r) m.x = -m.r;
      if (m.y < -m.r) m.y = h + m.r;
      if (m.y > h + m.r) m.y = -m.r;
    }
    draw(t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return stop;
}
