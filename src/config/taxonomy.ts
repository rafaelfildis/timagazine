export const CATEGORIES = [
  { slug: "inteligencia-artificial", name: "Inteligência Artificial" },
  { slug: "cloud-infraestrutura", name: "Cloud e Infraestrutura" },
  { slug: "ciberseguranca", name: "Cibersegurança" },
  { slug: "dados-analytics", name: "Dados e Analytics" },
  { slug: "desenvolvimento-software", name: "Desenvolvimento e Software" },
  { slug: "gestao-governanca", name: "Gestão e Governança de TI" },
  { slug: "transformacao-digital", name: "Transformação Digital" },
  { slug: "govtech-setor-publico", name: "GovTech e Setor Público" },
  { slug: "tecnologia-saude", name: "Tecnologia na Saúde" },
  { slug: "startups-negocios", name: "Startups e Negócios" },
  { slug: "carreiras-lideranca", name: "Carreiras e Liderança" },
  { slug: "hardware-conectividade", name: "Hardware e Conectividade" },
] as const satisfies readonly { slug: string; name: string }[];

export const MODALITIES = [
  { value: "noticia", label: "Notícia" },
  { value: "reportagem", label: "Reportagem" },
  { value: "analise", label: "Análise" },
  { value: "opiniao", label: "Artigo de opinião" },
  { value: "entrevista", label: "Entrevista" },
  { value: "tutorial", label: "Tutorial" },
  { value: "review", label: "Review" },
  { value: "video", label: "Vídeo" },
  { value: "podcast", label: "Podcast" },
] as const satisfies readonly { value: string; label: string }[];

export const ORIGIN_LABEL = {
  curadoria: "Curadoria",
  propria: "Apuração própria",
} as const;

export const MODALITY_VALUES = MODALITIES.map((m) => m.value) as [
  (typeof MODALITIES)[number]["value"],
  ...(typeof MODALITIES)[number]["value"][],
];
export type Modality = (typeof MODALITIES)[number]["value"];
export type Origin = keyof typeof ORIGIN_LABEL;
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
