/**
 * Globo de pontos verdes, só SVG (sem canvas nem bibliotecas 3D).
 * Os pontos formam "continentes" por uma função determinística (soma de senos, sem
 * aleatoriedade), calculada uma vez ao carregar o módulo. A rotação é uma faixa de pontos
 * que desliza sob a máscara circular (CSS, só com `prefers-reduced-motion: no-preference`;
 * ver `.globe-strip` em globals.css). Decorativo: `aria-hidden`.
 */
const COLS = 72; // 5° de longitude por coluna
const ROWS = 36; // 5° de latitude por linha
const STEP = 10;
const PERIOD = COLS * STEP; // largura de uma volta completa
const SIZE = ROWS * STEP; // diâmetro do globo

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Densidade "de terra"; só precisa parecer um mapa, não ser um. */
function land(lonDeg: number, latDeg: number): number {
  const lo = rad(lonDeg);
  const la = rad(latDeg);
  return (
    Math.sin(lo * 1.3 + la * 0.7) * Math.cos(la * 2.1 - lo * 0.4) +
    0.6 * Math.sin(lo * 2.7 + 1.1) * Math.cos(la * 1.6 + 0.5) +
    0.35 * Math.sin(lo * 5.1 - la * 3.3)
  );
}

function buildLayers(): string[] {
  const layers = ["", "", ""]; // do mais forte ao mais fraco
  for (let row = 0; row < ROWS; row++) {
    const lat = 90 - (row + 0.5) * 5;
    if (Math.abs(lat) > 80) continue;
    for (let col = 0; col < COLS; col++) {
      const lon = (col + 0.5) * 5;
      const v = land(lon, lat);
      if (v < 0.05) continue;
      const layer = v > 0.75 ? 0 : v > 0.4 ? 1 : 2;
      layers[layer] += `M${col * STEP + STEP / 2} ${row * STEP + STEP / 2}h0`;
    }
  }
  return layers;
}

const LAYERS = buildLayers();
const OPACITY = [0.95, 0.65, 0.35];

/** O chamador posiciona (precisa ser `absolute`/`relative`) e dimensiona o globo. */
export function HeroGlobe({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <div className="absolute -inset-[12%] rounded-full bg-[radial-gradient(circle,rgb(22_230_92/0.16),transparent_68%)]" />
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        focusable="false"
        className="relative h-full w-full text-primary"
      >
        <defs>
          <radialGradient id="hg-body" cx="0.38" cy="0.34" r="0.8">
            <stop offset="0" stopColor="#0B3320" stopOpacity="0.95" />
            <stop offset="1" stopColor="#070A07" stopOpacity="0.95" />
          </radialGradient>
          <radialGradient id="hg-fade">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.62" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="hg-mask">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="url(#hg-fade)" />
          </mask>
          <g id="hg-dots" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
            {LAYERS.map((d, i) => (
              <path key={i} d={d} strokeOpacity={OPACITY[i]} />
            ))}
          </g>
        </defs>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 1} fill="url(#hg-body)" />
        <g mask="url(#hg-mask)">
          <g className="globe-strip">
            <use href="#hg-dots" />
            <use href="#hg-dots" x={PERIOD} />
          </g>
        </g>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={SIZE / 2 - 1}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.3"
        />
      </svg>
    </div>
  );
}
