-- Dados mínimos de produção, idempotentes (ON CONFLICT DO NOTHING): as 12 categorias de
-- src/config/taxonomy.ts (mesma ordem; tests/unit/bootstrap-data.test.ts confere), as 4 páginas
-- institucionais com o texto inicial (a equipe edita depois pelo painel; nada aqui sobrescreve) e
-- a chave whatsapp_channel_url (vazia = sem botão do WhatsApp). Textos em E'...' com \n: o
-- conteúdo gravado não depende do fim de linha do checkout (CRLF no Windows).
INSERT INTO "categories" ("slug", "name", "position") VALUES
  ('inteligencia-artificial', 'Inteligência Artificial', 0),
  ('cloud-infraestrutura', 'Cloud e Infraestrutura', 1),
  ('ciberseguranca', 'Cibersegurança', 2),
  ('dados-analytics', 'Dados e Analytics', 3),
  ('desenvolvimento-software', 'Desenvolvimento e Software', 4),
  ('gestao-governanca', 'Gestão e Governança de TI', 5),
  ('transformacao-digital', 'Transformação Digital', 6),
  ('govtech-setor-publico', 'GovTech e Setor Público', 7),
  ('tecnologia-saude', 'Tecnologia na Saúde', 8),
  ('startups-negocios', 'Startups e Negócios', 9),
  ('carreiras-lideranca', 'Carreiras e Liderança', 10),
  ('hardware-conectividade', 'Hardware e Conectividade', 11)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint
INSERT INTO "pages" ("slug", "title", "body") VALUES
  ('sobre', 'Sobre a TI MAGAZINE',
    E'A TI MAGAZINE é um portal de notícias sobre tecnologia, inovação e negócios, voltado a quem lidera a transformação nas organizações.\n\nPublicamos reportagens, análises, entrevistas e conteúdos de curadoria, sempre identificando a origem de cada matéria.\n\nTexto inicial: a equipe editorial deve revisar e complementar esta página.'),
  ('politica-de-privacidade', 'Política de Privacidade',
    E'Esta política explica como a TI MAGAZINE trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD).\n\n## Dados que coletamos\n\nColetamos apenas os dados que você nos envia, como nome, e-mail e mensagem no formulário de contato. O portal não usa cookies de rastreamento; o único cookie é o de sessão do painel administrativo, essencial ao funcionamento.\n\n## Seus direitos\n\nVocê pode solicitar acesso, correção ou exclusão dos seus dados pelo formulário de contato.\n\nTexto inicial: revisar com o responsável jurídico antes da publicação definitiva.'),
  ('termos-de-uso', 'Termos de Uso',
    E'Ao acessar o portal TI MAGAZINE você concorda com estes termos.\n\n## Uso do conteúdo\n\nO conteúdo publicado é protegido por direitos autorais. A reprodução parcial é permitida com citação da fonte e link para a matéria original.\n\n## Responsabilidade\n\nEmpenhamo-nos em manter as informações corretas e atualizadas, mas não garantimos que estejam isentas de erros.\n\nTexto inicial: revisar com o responsável jurídico antes da publicação definitiva.'),
  ('politica-editorial', 'Política Editorial e de Correções',
    E'Esta política explica como o conteúdo da TI MAGAZINE é produzido, revisado e corrigido.\n\n## Coleta em fontes\n\nAs matérias partem de fontes identificáveis: comunicados oficiais, documentos públicos, estudos, entrevistas e publicações de veículos e instituições. Cada matéria informa se é apuração própria ou curadoria. Nas curadorias, o crédito da fonte aparece no fim do texto ("Com informações de ..."), com link para o original.\n\n## Uso de inteligência artificial\n\nUsamos inteligência artificial como ferramenta de apoio na redação dos textos e na criação de imagens. Ilustrações geradas por IA recebem a legenda "Ilustração gerada por IA". A IA não publica nada sozinha.\n\n## Aprovação humana obrigatória\n\nToda matéria é revisada e aprovada por uma pessoa da equipe editorial antes de ser publicada. A responsabilidade pelo conteúdo é sempre humana.\n\n## Conteúdo patrocinado e opinião\n\nConteúdo patrocinado é sempre identificado como tal. Artigos de opinião refletem a visão de quem assina.\n\n## Como pedir uma correção\n\nViu um erro? Fale com a redação pela página de [Contato](/contato), escolhendo o assunto "Correção" e indicando a matéria e o trecho. Correções relevantes são registradas na própria matéria.\n\nTexto inicial: a equipe editorial deve revisar e complementar esta página.')
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint
INSERT INTO "settings" ("key", "value") VALUES ('whatsapp_channel_url', '')
ON CONFLICT ("key") DO NOTHING;
