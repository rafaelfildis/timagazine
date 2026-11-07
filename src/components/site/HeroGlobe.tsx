import { LAND_COLS, LAND_MASK, LAND_ROWS } from "./land-mask";

/**
 * Globo de pontos verdes, só SVG (sem canvas nem bibliotecas 3D).
 * Pontos só sobre terra (máscara embutida em land-mask.ts); o oceano tem pontos bem tênues.
 * A intensidade cai com a latitude (sombreado) e a máscara radial apaga a borda (limbo).
 * Tudo é calculado uma vez ao carregar o módulo, sem aleatoriedade. A rotação é a faixa de
 * pontos deslizando sob a máscara circular (CSS, só com `prefers-reduced-motion: no-preference`;
 * ver `.globe-strip` em globals.css). Decorativo: `aria-hidden`.
 */
const STEP = 8;
const PERIOD = LAND_COLS * STEP; // largura de uma volta completa (720)
const SIZE = LAND_ROWS * STEP; // diâmetro do globo (360)

/** Camadas, da mais forte à mais fraca: terra perto do equador, terra em latitudes médias, terra polar, oceano. */
function buildLayers(): string[] {
  const layers = ["", "", "", ""];
  for (let row = 0; row < LAND_ROWS; row++) {
    const lat = Math.abs(90 - (row + 0.5) * (180 / LAND_ROWS));
    const south = 90 - (row + 0.5) * (180 / LAND_ROWS) < -60; // sem Antártida: lê-se como borda
    if (lat > 80 || south) continue;
    for (let col = 0; col < LAND_COLS; col++) {
      const x = col * STEP + STEP / 2;
      const y = row * STEP + STEP / 2;
      if (LAND_MASK[row][col] === "1") {
        layers[lat < 30 ? 0 : lat < 55 ? 1 : 2] += `M${x} ${y}h0`;
      } else if (row % 2 === 0 && col % 2 === 0 && lat < 70) {
        layers[3] += `M${x} ${y}h0`;
      }
    }
  }
  return layers;
}

const LAYERS = buildLayers();
const OPACITY = [1, 0.75, 0.5, 0.13];
const WIDTH = [3.4, 3.4, 3.4, 2];

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
          <g id="hg-dots" fill="none" stroke="currentColor" strokeLinecap="round">
            {LAYERS.map((d, i) => (
              <path key={i} d={d} strokeOpacity={OPACITY[i]} strokeWidth={WIDTH[i]} />
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
          strokeOpacity="0.55"
        />
      </svg>
    </div>
  );
}
