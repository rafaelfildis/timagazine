# TI MAGAZINE — Documento de design do portal

Data: 07/11/2026 · Status: rascunho para aprovação · Repositório: https://github.com/rafaelfildis/timagazine

Legenda: **[Usuário]** = decidido pelo usuário · **[Claude]** = decisão minha, sujeita a revisão · **[Aberto]** = falta resposta do usuário.

---

## 1. Intenção e porquê

O TI MAGAZINE é um portal editorial de **Tecnologia • Inovação • Negócios** para CIOs, gestores, profissionais de TI, empresários e interessados em tecnologia. **[Usuário]**

Ele substitui/supera o site atual em timagazine.com.br (ver §3) com uma identidade nova (manual da marca verde/preto) e uma operação editorial que combina:

1. **Coleta automática** de notícias em portais nacionais e internacionais de referência. **[Usuário]**
2. **Reescrita com IA** em português do Brasil, com palavras próprias, e **imagem nova gerada por IA** para cada matéria. **[Usuário]**
3. **Aprovação humana obrigatória**: nada é publicado sem um administrador autorizar. **[Usuário]**

O valor para o leitor é ter, num só lugar, o que importa em TI corporativa, já filtrado, em português e com a cara de uma revista, não de um agregador.

## 2. Metas, não-metas e antimetas

**Metas**
- Portal completo, responsivo e rápido, com as 18 páginas da §6. **[Usuário]**
- Pipeline coleta → reescrita → imagem → fila de aprovação → publicação.
- Painel administrativo para curadoria, edição e gestão de todo o conteúdo (notícias, empresas, eventos, relatório, academia).
- Cadastro e login de usuários, com área do usuário. **[Usuário]**
- Indexável pelo Google (URLs reais, não rotas em `#`), com dados estruturados de notícia. **[Claude]**
- Assumir o domínio timagazine.com.br, importando as matérias do site atual e redirecionando os endereços antigos. **[Usuário]**
- Fase 2 (fora da v1): Radar, Acervo, PRISMA, TSI/Régua, G.O.A.T. e Clube na nova identidade. **[Usuário]**

**Não-metas (nesta primeira versão)** **[Claude]**
- App nativo de celular.
- Integração com CRM (fica preparada, mas não implementada; o manual a marca como "Funcionalidade essencial", então confirmar). **[Aberto]**
- Área premium paga (o manual a marca como "opcional").

**Antimetas (fracasso mesmo que funcione)**
- Publicar texto copiado ou quase copiado de outro portal, ou reaproveitar a foto original. **[Usuário]**
- Publicar qualquer coisa sem aprovação humana. **[Usuário]**
- Visual que pareça agregador genérico ou "neon de game": o manual pede sóbrio e editorial. **[Usuário]**
- Abertura obrigatória, áudio automático ou animação que atrase o acesso às notícias. **[Usuário]**
- Alegações sem comprovação ("a principal revista do Brasil"). **[Usuário]**
- Download simulado do relatório quando não houver PDF cadastrado. **[Usuário]**

## 3. Site atual (timagazine.com.br) — o que existe e o que melhorar

Mapeamento feito em 07/11/2026 (26 rotas). O site atual é uma aplicação de página única com rotas em `#`, identidade "terminal" (`~/ti_magazine`, verde-limão, fonte monoespaçada) e editor responsável Diego Daltro. O cadastro, a assinatura e o fórum ficam em clube.timagazine.com.br.

### 3.1 O que existe
- **Notícias:** cerca de 431 matérias em 12 seções, curadas de feeds com apoio de LLM e aprovação do editor, com selo "Apuração automatizada, edição humana" e bloco "Fontes desta matéria". Há também um "Giro rápido", com curadoria automática renovada às 06h.
- **Produtos de dados próprios:**
  - **Radar:** compras públicas de TI no PNCP, reclassificadas item a item e com valor "piso".
  - **Histórico:** série das contratações.
  - **Acervo:** cerca de 98 mil documentos de planejamento (ETP, TR, mapa de risco) organizados como trilha de decisão.
  - **Governo:** vitrine editorial do Radar.
  - **Índice PRISMA:** quadrantes de fornecedores com 6 dimensões e evidência.
  - **TSI:** índice salarial com dados do CAGED e do SIAPE.
  - **Régua:** calculadora salarial.
  - **G.O.A.T.:** prêmio, ainda sem indicados.
- **Clube por assinatura:** Mensal R$ 9,90, Anual R$ 89, Equipe R$ 39/mês e Enterprise R$ 1.490/mês. O checkout ainda não funciona: a página está em "modo demonstração".
- **Institucional:** Sobre, Governança, Muralha editorial, Método, Agenda (vazia), Dicas e Contato.

### 3.2 Problemas a superar
- **SEO quase nulo:**
  - as rotas em `#` não são indexáveis;
  - title, description e Open Graph são iguais em todas as páginas;
  - a matéria troca de URL, criando endereços duplicados;
  - não existe página 404 real.
- **Navegação:**
  - Notícias mostra 431 cards numa página só, sem busca, filtros nem paginação;
  - "Mais lidas" está quebrada;
  - há menus redundantes;
  - os rótulos não batem ("Notícias" leva a `#/ia`; PRISMA e Quadrantes são o mesmo produto).
- **Conteúdo parado:** a edição tem data de hoje, mas a matéria mais recente é de 24/10. Há páginas vazias (G.O.A.T., Agenda, painel salarial).
- **Números que se contradizem entre páginas:** o acervo aparece como 25 mil+, 40 mil+ e 98.698; o início da base aparece como "desde 2021" e como 08/09.
- **Curadoria automática fraca:** tags erradas (GTA 6 marcado como "ia · infra") e ruído, como resultados de loteria.
- **Acessibilidade:**
  - há gráficos que só funcionam com o mouse;
  - as fontes aparecem em texto sem link;
  - as tags não têm link.

### 3.3 O que preservar (pontos fortes)
- Rótulos rígidos separando apuração própria, curadoria e opinião, com fonte e data em cada evidência.
- Transparência: método aberto, limitações e conflitos declarados, correções visíveis no texto.
- Caixas práticas, como "O que fazer agora" e Dicas que "nascem de" uma matéria.
- Paywall leve: primeiro parágrafo aberto e prévia de resultados.
- Privacidade: contador de leitura próprio, sem cookies de rastreamento.
- Legendas e créditos de imagem bem feitos.

### 3.4 Como o novo portal fica melhor **[Claude]**
- **SEO real:** URLs limpas renderizadas no servidor, metadados por página, `NewsArticle`, sitemap e 404 de verdade.
- **Notícias navegáveis:** busca, filtros combináveis na URL e paginação (§6.3).
- **Curadoria com aprovação humana item a item e triagem melhor:** a IA classifica, mas o admin confirma (§5.2).
- **Números centralizados:** cada indicador vem de uma única fonte no banco e aparece igual em todas as páginas.
- **Seções vazias ficam ocultas:** só aparecem quando têm conteúdo, com estado informativo no painel.
- **Identidade nova:** o manual verde/preto, mais editorial e menos "terminal".
- **Acessibilidade:** gráficos e controles operáveis por teclado e toque, fontes com link.

## 4. Identidade visual **[Usuário]**

- **Logo:** usar o arquivo original (versão horizontal no cabeçalho; símbolo "TI" em espaços pequenos e no favicon). Não redesenhar com fonte aproximada, não distorcer, não recortar.
- **Paleta:** verde principal `#16E65C` · verde profundo `#0B3320` · fundo `#070A07` · texto `#FFFFFF` · texto secundário `#A7B0A5`. Verde vibrante só em botões principais, links ativos, indicadores e detalhes; áreas extensas escuras, com superfícies discretamente diferenciadas.
- **Tipografia:** Montserrat (títulos, manchetes, destaques) e Inter (textos, menus, formulários).
- **Direção de arte:** tecnológica, sóbria e editorial; imagens grandes nas matérias principais; cards com borda fina e cantos suavemente arredondados; ícones de linha; brilhos verdes pontuais; ondas de pontos, conexões e globo digital como detalhe de fundo; tema escuro; animações leves que respeitam `prefers-reduced-motion`.
- **Motion da marca:** o vídeo de 5 s (`TI Magazine - Motion da marca v4 (5s).mp4`, 1920×1080) entra na página Sobre (seção institucional), com play sob demanda, sem áudio automático.
- **Contraste:** WCAG 2.2 AA no mínimo; títulos sobre imagem com gradiente/escurecimento garantindo contraste. **[Claude]**

## 5. Operação editorial — da coleta à publicação

### 5.1 Fontes **[Usuário]** (com verificação técnica de 07/11/2026)

| Fonte | Tipo | Coleta |
|---|---|---|
| Convergência Digital | Notícia BR | RSS ok |
| IT Forum | Notícia BR | RSS ok |
| Tele.Síntese | Notícia BR | RSS ok |
| Olhar Digital (portal aberto) | Notícia BR | RSS ok |
| The Register | Internacional | Atom ok |
| DataCenter Dynamics | Internacional | RSS ok |
| The New Stack | Internacional | RSS ok |
| Ars Technica | Internacional | RSS ok |
| TLDR (Tech, AI, DevOps, InfoSec) | Newsletter | RSS ok — cada item da edição vira um candidato |
| Last Week in AWS | Newsletter | RSS ok |
| The Pragmatic Engineer | Newsletter (parte paga) | RSS ok — só conteúdo aberto |
| DevOps Weekly | Newsletter | sem feed — coletar pelo arquivo de edições |
| Hacker News | Termômetro | RSS ok (hnrss) — sinal de pauta, não fonte de texto |
| r/sysadmin, r/devops | Termômetro | RSS limitado por taxa; API do Reddit restringe uso comercial |
| Forrester | Research | RSS do blog ok — só material público |
| Gartner | Research | sem feed (403) — página de newsroom |
| IDC | Research | sem feed — página de press releases (IDC Brasil) |

O cadastro de fontes fica no painel (adicionar, pausar, editar URL, editoria padrão, idioma, tipo). **[Claude]**

### 5.2 Fluxo **[Usuário]** + detalhamento **[Claude]**

1. **Coleta** a cada 30 min **[Claude]**: lê os feeds, normaliza (título, link canônico, data, resumo, autor, idioma) e grava como **candidata**. Para itens que avançam, baixa o texto completo da página original como base interna (nunca publicada). **[Usuário]**
2. **Deduplicação**: mesma URL canônica ou mesma história em fontes diferentes (similaridade de título/conteúdo) são agrupadas; o admin vê "3 fontes cobriram isto". **[Claude]**
3. **Triagem por IA**: sugere categoria, modalidade, tags e uma nota de relevância para o público (CIO/gestor). Itens de consumo/games de baixa relevância caem para o fim da fila. **[Claude]**
**Volume:** cerca de **1 matéria publicada por dia** **[Usuário]**. Por isso, a fila é organizada por relevância e o admin escolhe a pauta do dia entre as melhores candidatas. Não existe reescrita automática em massa. **[Claude]**

4. **Reescrita por IA** (sob demanda, quando o admin escolhe uma candidata): título, linha fina, corpo em pt-BR com palavras próprias e tom TI MAGAZINE, tempo de leitura, sugestão de SEO (slug, meta description). Usa o conteúdo da fonte apenas como base factual.
5. **Imagem por IA**: ilustração editorial original no estilo do manual (escura, detalhes verdes), sem pessoas reais identificáveis nem logotipos de terceiros. Admin pode pedir outra versão. **[Usuário]** + regras **[Claude]**
6. **Revisão no painel**: lado a lado original × reescrita; editar texto, trocar imagem, ajustar categoria/tags, agendar, aprovar ou descartar (com motivo).
7. **Publicação**: só após aprovação; entra em Notícias, na Home e no sitemap/feeds do próprio portal.

**Crédito de fonte:** linha discreta no fim de cada matéria — "Com informações de {Fonte}", com link para o original. **[Claude — padrão proposto; usuário não se opôs]**

**Status de um item:** coletada → triada → em reescrita → aguardando revisão → aprovada/agendada → publicada · descartada · erro.

**Conteúdo próprio:** o admin também pode criar matéria do zero (reportagem, entrevista, opinião), sem passar pela coleta. **[Claude]**

## 6. Mapa do site **[Usuário]**

Menu: Home | Notícias | Empresas | Relatórios | Eventos | Academia | Sobre | Contato · pesquisa · conta · botão "Assine no WhatsApp". No celular, menu recolhível acessível.

1. Home · 2. Notícias · 3. Página de publicação · 4. Mural de Empresas · 5. Perfil de empresa · 6. Relatório Oficial de TI · 7. Eventos · 8. Página de evento · 9. Academia · 10. Página de conteúdo educacional · 11. Sobre · 12. Contato · 13. Cadastro e login · 14. Área do usuário · 15. Painel administrativo · 16. Política de Privacidade · 17. Termos de Uso · 18. Política Editorial e de Correções.

### 6.1 Home **[Usuário]**
- **Cabeçalho** fixo e compacto ao rolar: logo, navegação, pesquisa, conta, "Assine no WhatsApp".
- **Abertura compacta**: texto à esquerda, globo digital verde à direita. Título "Tecnologia, inovação e negócios para quem lidera a transformação." Descrição "Informação qualificada, tendências de mercado e as vozes de CIOs, líderes e especialistas em um só lugar." Botões "Assine no WhatsApp" e "Leia as últimas notícias". As primeiras notícias devem aparecer cedo na rolagem.
- **Faixa de acesso rápido**: Notícias diárias · Relatório Oficial de TI · Mural de Empresas · Eventos e CIO Talks.
- **Destaques da edição**: 1 principal grande + 4 secundárias, com imagem, categoria, título, data, tempo de leitura; link "Ver todas as notícias". Escolha manual no painel, com fallback para as mais recentes. **[Claude]**
- **Últimas notícias**: grade/lista com filtros rápidos por tema e "Carregar mais".
- **Relatório Oficial de TI**: capa, título, resumo, ano, "Baixar PDF", "Conheça a metodologia" — tudo vindo do painel; sem edição cadastrada, estado informativo.
- **Demais seções**: Empresas em destaque · Próximos eventos · Academia · Entrevistas e CIO Talks · Newsletter · Chamada WhatsApp.

### 6.2 Notícias, categorias e modalidades **[Usuário]**
- **Categorias:** Inteligência Artificial · Cloud e Infraestrutura · Cibersegurança · Dados e Analytics · Desenvolvimento e Software · Gestão e Governança de TI · Transformação Digital · GovTech e Setor Público · Tecnologia na Saúde · Startups e Negócios · Carreiras e Liderança · Hardware e Conectividade.
- **Modalidades:** Notícia · Reportagem · Análise · Artigo de opinião · Entrevista · Tutorial · Review · Vídeo · Podcast.
- Cada publicação: categoria principal, modalidade e tags. Patrocinado identificado visivelmente; opinião diferenciada de informativo.
- **Rótulo de origem** **[Claude]**: "Curadoria" (reescrita a partir de fonte externa) × "Apuração própria" — o site atual já faz essa distinção e ela dá credibilidade.

### 6.3 Pesquisa e filtros **[Usuário]**
Palavra-chave · categoria · modalidade · autor · tags · intervalo de datas · ordenação (recentes, antigas, mais lidas; relevância em buscas textuais). Filtros combináveis, refletidos na URL e preservados ao voltar. Contagem de resultados, paginação, "Limpar filtros", estados de carregamento, erro e vazio.

### 6.4 Demais páginas — **[Claude]**
O briefing do usuário parou na seção 6. As definições abaixo são minhas e seguem o manual da marca, que lista as funcionalidades essenciais. Se o usuário mandar o restante do briefing, ele prevalece.

- **Página de publicação:**
  - **Topo:** chapéu (categoria e modalidade), título, linha fina, autor, data de publicação e de atualização, tempo de leitura.
  - **Imagem:** grande, com legenda **"Ilustração gerada por IA"**, por transparência com o leitor.
  - **Corpo:** com intertítulos e uma caixa opcional "O que fazer agora", herdada do site atual.
  - **Rodapé da matéria:** linha "Com informações de {Fonte}" com link, tags com link, compartilhar, nota de correção quando houver, 3 relacionadas e chamada para newsletter/WhatsApp.
  - **Rótulos:** selo "Patrocinado" ou "Opinião" quando se aplicar.
- **Mural de Empresas:**
  - Diretório mantido pelo admin na v1. A empresa pode **solicitar inclusão** por formulário, e a solicitação cai numa fila de aprovação no painel.
  - Filtros por segmento (as mesmas 12 categorias) e busca.
  - Campo "Destaque" para as Empresas em destaque da Home. O destaque pago fica para o futuro.
- **Perfil de empresa:** logo, descrição, segmentos, serviços e soluções, cases, site e contatos, e notícias do portal que citam a empresa.
- **Relatório Oficial de TI:**
  - Edição atual (capa, resumo, ano, metodologia) e edições anteriores.
  - O download do PDF pede nome, e-mail, empresa e cargo, com consentimento LGPD. Não precisa de conta: o lead fica gravado para o CRM futuro.
  - Sem edição cadastrada, mostra o estado informativo.
- **Eventos:**
  - Próximos e passados, com filtro por tipo: presencial, online, webinar, CIO Talks.
- **Página de evento:**
  - Data, local ou link, programação, palestrantes e "Adicionar ao calendário" (.ics).
  - Inscrição por formulário interno (com limite de vagas opcional) **ou** link externo, à escolha do admin.
- **Academia:**
  - Conteúdos dos tipos curso/trilha, vídeo, e-book e template, com filtros por tipo, tema e nível.
- **Conteúdo educacional:**
  - A página mostra o conteúdo.
  - Downloads e vídeos completos exigem login gratuito. É o principal motivo para o leitor criar conta.
- **Cadastro e login:**
  - E-mail e senha, com confirmação de e-mail e recuperação de senha.
  - Login com Google é opcional.
  - Limite de tentativas.
- **Área do usuário:**
  - Perfil e matérias salvas.
  - Temas de interesse e inscrição na newsletter.
  - Meus eventos e meus downloads.
  - Privacidade: exportar dados e excluir conta.
- **Painel administrativo:**
  - **Visão geral:** fila do dia e as mais lidas.
  - **Curadoria:** candidatas, reescrita, imagem e aprovação.
  - **Conteúdo:**
    - publicações próprias e curadas;
    - destaques da Home;
    - fontes;
    - empresas e solicitações;
    - eventos e inscrições;
    - relatórios e leads;
    - Academia.
  - **Administração:**
    - páginas institucionais e políticas;
    - usuários e papéis;
    - configurações (link do Canal do WhatsApp, newsletter);
    - registro de auditoria (quem aprovou, editou ou publicou o quê).
- **Sobre:**
  - Propósito, equipe editorial, metodologia de curadoria e o vídeo de motion da marca.
- **Contato:**
  - Formulário com assunto (pauta, correção, imprensa, parcerias e patrocínio, outro), com consentimento.
  - Canais diretos.
- **Políticas** (Privacidade, Termos, Editorial e de Correções):
  - Texto editável no painel.
  - A Política Editorial explica a coleta, o uso de IA no texto e na imagem, a aprovação humana, o crédito às fontes e como pedir correção.
- **Newsletter:**
  - Semanal, combinando com o volume de 1 matéria por dia.
  - Confirmação dupla por e-mail e descadastro em um clique.
- **Mais lidas:**
  - Contador de leitura próprio, sem cookies de rastreamento.

## 7. Como será construído **[Claude]**

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Páginas renderizadas no servidor = SEO e velocidade; resolve o problema das rotas `#` do site atual |
| Estilo | Tailwind CSS v4 + shadcn/ui, tokens da marca | Consistência com o manual, componentes acessíveis |
| Banco | PostgreSQL gerenciado (Neon ou Supabase) + Drizzle ORM | Busca textual em português nativa, relacional para filtros |
| Autenticação | Auth.js, com papéis leitor / editor / admin | Cadastro e login próprios, sem dependência paga |
| Arquivos | Vercel Blob (imagens, PDFs do relatório) | Integrado à hospedagem |
| Hospedagem | Vercel, deploy automático a cada push no GitHub | Pedido de "ficar na nuvem pelo repositório" |
| Agendamento | Vercel Cron (coleta a cada 30 min) | Sem servidor próprio |
| IA de texto | API da Anthropic (Claude) — modelo maior para reescrita, menor para triagem | Qualidade em pt-BR, custo controlado |
| IA de imagem | Google Imagen/Gemini API **[Usuário]**, atrás de uma interface trocável | Custo baixo, bom em ilustração editorial |
| E-mail/newsletter | Resend | Simples e barato |
| Busca | Full-text do PostgreSQL (config `portuguese` + `unaccent`) | Sem serviço extra na v1 |

## 8. Requisitos transversais **[Claude]**
- **Desempenho:** LCP < 2,5 s em 4G; imagens otimizadas (AVIF/WebP) com tamanhos responsivos.
- **SEO:** URLs limpas (`/noticias/{slug}`), sitemap, RSS próprio, Open Graph, `NewsArticle` em JSON-LD, canonical.
- **Acessibilidade:** WCAG 2.2 AA, navegação por teclado, foco visível, `prefers-reduced-motion`.
- **LGPD:** banner de consentimento com recusa fácil, registro de consentimento, exclusão de conta e exportação de dados na área do usuário.
- **Segurança:** painel só para papéis editor/admin; registro de quem aprovou cada matéria; limite de tentativas no login.
- **Repositório:** o GitHub guarda código e documentação; chaves de API ficam nas variáveis de ambiente da Vercel, nunca no repositório.
- **Referência de UI:** catálogo ui-vault (github.com/en970/ui-vault) em `docs/referencias/ui-vault`. **[Usuário]**

## 9. Decisões tomadas na revisão e pendências

### 9.1 Decisões minhas após a revisão independente **[Claude]**
- **Reddit fica fora da coleta na v1** (a API restringe uso comercial e o feed é limitado por taxa). Hacker News entra só como "termômetro de pauta" no painel.
- **The Pragmatic Engineer e Olhar Digital Pro:** só itens abertos. Item marcado como pago no feed é ignorado.
- **Autoria:** matérias de curadoria saem como "Redação TI MAGAZINE". O sistema registra internamente qual editor aprovou, e o JSON-LD usa a organização como autora.
- **CRM:** fora da v1, mas todo formulário (newsletter, WhatsApp, contato, empresas) já grava o consentimento LGPD e a origem do lead, para a integração futura não exigir refazer nada.
- **Custos de infraestrutura:** uso comercial com cron de 30 min exige o plano pago da Vercel (Pro). Banco e armazenamento começam nos planos gratuitos ou de entrada e sobem conforme o volume.

### 9.2 Respostas do usuário (07/11/2026) **[Usuário]**
- **Site atual:** o novo portal vem primeiro e assume o domínio timagazine.com.br. As cerca de 431 matérias antigas são importadas e as rotas antigas (`#/materia/…`, `/m/…`) ganham redirecionamento. Radar, Acervo, PRISMA, TSI/Régua, G.O.A.T. e Clube ficam para a **fase 2**, já na nova identidade. Até lá não são descontinuados nem migrados.
- **Texto-fonte:** a coleta pode baixar o texto completo da matéria original **só como base interna** para a IA. O original nunca é publicado, fica no banco apenas para a revisão lado a lado e é apagado após X dias **[Claude: 90 dias]**.
- **Imagens:** Google (Imagen/Gemini API), com o serviço isolado atrás de uma interface para permitir troca futura. A imagem é gerada sob demanda (na reescrita ou quando o admin pede), não para toda candidata. **[Claude]**
- **"Assine no WhatsApp":** link para um Canal do WhatsApp da TI MAGAZINE (URL configurável no painel). Não há coleta de telefone na v1.

- **Volume:** cerca de 1 matéria publicada por dia.
- **Contas:** o usuário já tem contas na Vercel, na Anthropic e no Google AI. As chaves vão direto para as variáveis de ambiente da Vercel, nunca para o chat nem para o repositório.

### 9.3 Pendências
Nenhuma que bloqueie o plano. Se o restante do briefing original for enviado, ele substitui as definições da §6.4.

## 10. O que fica a critério de quem constrói
Escolhas de componentes, estrutura de pastas, nomes de tabelas, bibliotecas auxiliares e detalhes visuais finos dentro do manual.
