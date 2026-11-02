import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const booksDir = path.join(rootDir, 'LivrosDev');
const coversDir = path.join(rootDir, 'assets', 'img');
const outputFile = path.join(rootDir, 'index.html');

const categoryOrder = [
  'Algoritmos e Fundamentos',
  'Arquitetura, Design e Código',
  'Web, Mobile e APIs',
  'DevOps e Cloud',
  'Dados, BI e Estatística',
  'Agilidade e Qualidade',
  'Carreira, Produto e Soft Skills',
  'Liderança e Cultura',
];

const categoryDescriptions = {
  'Algoritmos e Fundamentos': 'Computação, algoritmos, redes, expressões regulares e preparação técnica.',
  'Arquitetura, Design e Código': 'Arquitetura limpa, refatoração, DDD, padrões e qualidade estrutural de software.',
  'Web, Mobile e APIs': 'Front-end, mobile, UX, APIs, Node, REST, OAuth e tecnologias de interface.',
  'DevOps e Cloud': 'AWS, Azure, Linux, Docker, Kubernetes, CI/CD, automação e infraestrutura.',
  'Dados, BI e Estatística': 'Data science, BI, big data, estatística, bancos modernos e análise de dados.',
  'Agilidade e Qualidade': 'Scrum, Kanban, XP, Lean, TDD, BDD, testes e métricas ágeis.',
  'Carreira, Produto e Soft Skills': 'Carreira, produto, aprendizado, produtividade e habilidades profissionais.',
  'Liderança e Cultura': 'Gestão, cultura, liderança, times, comunicação e melhoria organizacional.',
};

const categoryRules = [
  {
    category: 'Algoritmos e Fundamentos',
    terms: [
      'algoritmos',
      'basic principles of computers',
      'expressões regulares',
      'expressoes regulares',
      'cracking the coding interview',
      'comunicação de dados',
      'comunicacao de dados',
      'redes de computadores',
    ],
  },
  {
    category: 'Dados, BI e Estatística',
    terms: [
      'data science',
      'big data',
      'business intelligence',
      'estatistica',
      'estatística',
      'machine learning',
      'mongodb',
      'nosql',
    ],
  },
  {
    category: 'DevOps e Cloud',
    terms: [
      'amazon aws',
      'aws',
      'azure',
      'cloud',
      'docker',
      'containers',
      'devops',
      'entrega continua',
      'entrega contínua',
      'jenkins',
      'kubernetes',
      'linux',
      'git e github',
      'servidor linux',
      'sysops',
      'solutions architect',
      'cloud practitioner',
      'developer associate',
      'security specialty',
    ],
  },
  {
    category: 'Web, Mobile e APIs',
    terms: [
      'web',
      'mobile',
      'android',
      'html5',
      'css',
      'ux',
      'usabilidade',
      'oauth',
      'api rest',
      'rest',
      'node',
      'typescript',
      'spring security',
      'seo',
    ],
  },
  {
    category: 'Arquitetura, Design e Código',
    terms: [
      'arquitetura',
      'domain driven',
      'dsl',
      'domain-driven',
      'design de software',
      'padrões',
      'padroes',
      'refatoração',
      'refatoracao',
      'código limpo',
      'codigo limpo',
      'clean coder',
      'software craftsman',
      'trabalho eficaz',
      'soa aplicado',
      'princípios de design',
      'principios de design',
    ],
  },
  {
    category: 'Agilidade e Qualidade',
    terms: [
      'agile',
      'scrum',
      'kanban',
      'lean',
      'extreme programming',
      'extreme',
      'xp',
      'tdd',
      'test-driven',
      'testes automatizados',
      'teste e design',
      'bdd',
      'métricas ágeis',
      'metricas ageis',
      'crystal clear',
    ],
  },
  {
    category: 'Liderança e Cultura',
    terms: [
      'liderança',
      'lideranca',
      'equipe',
      'feedback',
      'cultura',
      'netflix',
      'ego',
      'happiness',
      'retrospectives',
      'coaching agile teams',
      'sprint',
      'more agile testing',
    ],
  },
];

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(author|autor|auto)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function encodeUrlPath(...parts) {
  return parts.map((part) => encodeURIComponent(part).replaceAll('%2E', '.')).join('/');
}

function titleAndAuthor(stem) {
  const match = stem.match(/\s+-\s+(?:Autor|Author|Auto)\s*\(([^)]+)\)\s*$/iu);

  if (!match) {
    return {
      title: stem.trim().replace(/\s+/g, ' '),
      author: 'Autor não informado',
    };
  }

  return {
    title: stem.slice(0, match.index).trim().replace(/\s+/g, ' '),
    author: match[1].trim().replace(/\s+/g, ' '),
  };
}

function categoryFor(book) {
  const haystack = normalize(`${book.title} ${book.author} ${book.file}`);

  for (const rule of categoryRules) {
    if (rule.terms.some((term) => haystack.includes(normalize(term)))) {
      return rule.category;
    }
  }

  return 'Carreira, Produto e Soft Skills';
}

function tokenScore(left, right) {
  const leftTokens = new Set(normalize(left).split(' ').filter(Boolean));
  const rightTokens = new Set(normalize(right).split(' ').filter(Boolean));

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  let shared = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      shared += 1;
    }
  }

  return shared / Math.max(leftTokens.size, rightTokens.size);
}

function coverFor(book, covers) {
  const title = normalize(book.title);

  let best = null;
  let bestScore = 0;

  for (const cover of covers) {
    const coverTitle = normalize(cover.stem);
    let score = tokenScore(title, coverTitle);

    if (coverTitle === title) {
      score = 1;
    } else if (title && (coverTitle.includes(title) || title.includes(coverTitle))) {
      score = Math.max(score, 0.92);
    }

    if (score > bestScore) {
      best = cover;
      bestScore = score;
    }
  }

  return bestScore >= 0.55 ? best : null;
}

function initialsFor(title) {
  return normalize(title)
    .split(' ')
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'BD';
}

function renderCover(book) {
  if (!book.cover) {
    return `<span class="cover-placeholder" aria-hidden="true">${escapeHtml(initialsFor(book.title))}</span>`;
  }

  return `<img src="${book.coverHref}" alt="Capa do livro ${escapeHtml(book.title)}" loading="lazy">`;
}

function renderBook(book) {
  const title = escapeHtml(book.title);
  const author = escapeHtml(book.author);
  const category = escapeHtml(book.category);
  const href = escapeHtml(book.pdfHref);
  const search = escapeHtml(normalize(`${book.title} ${book.author} ${book.category}`));

  return `
          <article class="book-card" data-book-card data-category="${category}" data-search="${search}">
            <a class="cover-link" href="${href}" target="_blank" rel="noopener" aria-label="Abrir PDF: ${title}">
              ${renderCover(book)}
            </a>
            <div class="book-body">
              <h3><a href="${href}" target="_blank" rel="noopener">${title}</a></h3>
              <p>${author}</p>
              <a class="open-link" href="${href}" target="_blank" rel="noopener" aria-label="Abrir PDF de ${title}">
                Abrir PDF <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>`;
}

function renderSection(category, books) {
  const description = categoryDescriptions[category] || 'Livros disponíveis localmente.';
  const cards = books.map(renderBook).join('\n');

  return `
      <section class="category-section" id="${encodeURIComponent(category)}" data-category-section="${escapeHtml(category)}">
        <div class="section-heading">
          <div>
            <h2>${escapeHtml(category)}</h2>
            <span>${books.length} livros</span>
          </div>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="book-grid">
${cards}
        </div>
      </section>`;
}

function renderHtml(books) {
  const booksByCategory = new Map();
  for (const category of categoryOrder) {
    booksByCategory.set(category, []);
  }

  for (const book of books) {
    booksByCategory.get(book.category).push(book);
  }

  const sections = categoryOrder
    .filter((category) => booksByCategory.get(category).length)
    .map((category) => renderSection(category, booksByCategory.get(category)))
    .join('\n');

  const filters = [
    `<button class="filter-button is-active" type="button" data-category-filter="all">Todos <span>${books.length}</span></button>`,
    ...categoryOrder
      .filter((category) => booksByCategory.get(category).length)
      .map((category) => {
        const count = booksByCategory.get(category).length;
        return `<button class="filter-button" type="button" data-category-filter="${escapeHtml(category)}">${escapeHtml(category)} <span>${count}</span></button>`;
      }),
  ].join('\n          ');

  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date());

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BibliotecaDev</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f8fa;
      --surface: #ffffff;
      --surface-strong: #f6f8fa;
      --text: #1f2328;
      --muted: #59636e;
      --line: #d1d9e0;
      --accent: #0969da;
      --accent-dark: #0550ae;
      --header: #25292e;
      --ink: #1f2328;
      --shadow: 0 8px 24px rgba(31, 35, 40, 0.08);
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    :focus-visible {
      outline: 3px solid rgba(9, 105, 218, 0.35);
      outline-offset: 2px;
    }

    .skip-link {
      position: fixed;
      top: 8px;
      left: 8px;
      z-index: 100;
      transform: translateY(-150%);
      padding: 8px 12px;
      border-radius: 6px;
      background: var(--surface);
      color: var(--accent-dark);
      font-weight: 700;
    }

    .skip-link:focus {
      transform: translateY(0);
    }

    button,
    input {
      font: inherit;
    }

    .site-header {
      position: relative;
      overflow: hidden;
      background: var(--header);
      color: #ffffff;
      border-bottom: 1px solid #3d444d;
    }

    .site-header::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 78% 18%, rgba(130, 80, 223, 0.28), transparent 28%),
        radial-gradient(circle at 58% 110%, rgba(47, 129, 247, 0.24), transparent 36%),
        linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
      background-size: auto, auto, 32px 32px, 32px 32px;
      pointer-events: none;
    }

    .header-shell {
      width: min(1240px, calc(100% - 32px));
      margin: 0 auto;
      position: relative;
      padding: 64px 0 58px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 64px;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      min-width: 0;
    }

    .brand-mark {
      width: 72px;
      height: 72px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      background: linear-gradient(135deg, #2f81f7, #8250df);
      color: #fff;
      font-weight: 800;
      font-size: 1.15rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
    }

    .eyebrow {
      display: block;
      margin-bottom: 8px;
      color: #8c959f;
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .brand h1 {
      margin: 0;
      font-size: clamp(3rem, 7vw, 5.4rem);
      line-height: 1;
      letter-spacing: -0.035em;
    }

    .brand p {
      margin: 10px 0 0;
      max-width: 680px;
      color: #b1bac4;
      font-size: clamp(1rem, 2vw, 1.18rem);
      line-height: 1.65;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 24px;
    }

    .hero-actions a {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 15px;
      border-radius: 7px;
      font-weight: 700;
    }

    .hero-primary {
      background: #2f81f7;
      color: #ffffff;
      box-shadow: 0 8px 24px rgba(47, 129, 247, 0.24);
    }

    .hero-primary:hover {
      background: #1f6feb;
    }

    .hero-secondary {
      border: 1px solid #57606a;
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
    }

    .hero-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .stat {
      min-width: 0;
      padding: 20px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid #3d444d;
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }

    .stat:last-child {
      grid-column: 1 / -1;
    }

    .stat strong {
      display: block;
      font-size: 2rem;
      line-height: 1;
      color: #ffffff;
    }

    .stat span {
      display: block;
      margin-top: 6px;
      color: #b1bac4;
      font-size: 0.84rem;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 20;
      background: rgba(255, 255, 255, 0.96);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(12px);
    }

    .toolbar-shell {
      width: min(1240px, calc(100% - 32px));
      margin: 0 auto;
      padding: 14px 0;
      display: grid;
      gap: 14px;
    }

    .search-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
    }

    .search-box {
      position: relative;
    }

    .search-box span {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted);
      font-size: 1rem;
      pointer-events: none;
    }

    .search-box input {
      width: 100%;
      height: 52px;
      padding: 0 16px 0 42px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text);
      outline: none;
    }

    .search-box input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.16);
    }

    .visible-count {
      min-width: 120px;
      color: var(--muted);
      font-size: 0.92rem;
      text-align: right;
    }

    .filter-row {
      display: grid;
      gap: 5px;
      margin-top: 18px;
    }

    .filter-button {
      width: 100%;
      min-height: 42px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--text);
      padding: 9px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      text-align: left;
      cursor: pointer;
    }

    .filter-button span {
      min-width: 24px;
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--surface-strong);
      color: var(--muted);
      font-size: 0.78rem;
    }

    .filter-button:hover,
    .filter-button:focus-visible {
      background: #f3f5f7;
      color: var(--accent-dark);
      outline: none;
    }

    .filter-button.is-active {
      background: #ddf4ff;
      color: var(--accent-dark);
      box-shadow: inset 3px 0 0 var(--accent);
    }

    .filter-button.is-active span {
      background: #b6e3ff;
      color: var(--accent-dark);
    }

    .catalog-shell {
      width: min(1240px, calc(100% - 32px));
      margin: 0 auto;
      padding: 32px 0 72px;
      display: grid;
      grid-template-columns: 248px minmax(0, 1fr);
      gap: 32px;
      align-items: start;
    }

    .sidebar {
      position: sticky;
      top: 96px;
    }

    .sidebar-card {
      padding: 18px 14px 14px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: 0 1px 0 rgba(31, 35, 40, 0.04);
    }

    .sidebar-eyebrow {
      color: var(--accent-dark);
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .sidebar h2 {
      margin: 4px 0 0;
      font-size: 1.4rem;
      letter-spacing: -0.02em;
    }

    .sidebar p {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 0.86rem;
    }

    main {
      min-width: 0;
    }

    .category-section {
      margin-bottom: 44px;
      scroll-margin-top: 100px;
    }

    .category-section:last-child {
      margin-bottom: 0;
    }

    .section-heading {
      display: grid;
      grid-template-columns: minmax(220px, 0.8fr) minmax(260px, 1.2fr);
      gap: 24px;
      align-items: center;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
    }

    .section-heading span {
      display: inline-flex;
      margin-top: 8px;
      padding: 2px 8px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      background: var(--surface-strong);
      font-size: 0.76rem;
      font-weight: 600;
    }

    .section-heading h2 {
      margin: 0;
      color: var(--ink);
      font-size: clamp(1.35rem, 2.4vw, 1.8rem);
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .section-heading p {
      margin: 0;
      color: var(--muted);
      max-width: 620px;
    }

    .book-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .book-card {
      min-height: 430px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
    }

    .book-card:hover {
      transform: translateY(-4px);
      border-color: #afb8c1;
      box-shadow: var(--shadow);
    }

    .cover-link {
      width: 100%;
      height: 282px;
      display: grid;
      place-items: center;
      overflow: hidden;
      padding: 18px;
      background:
        linear-gradient(135deg, rgba(9, 105, 218, 0.06), rgba(130, 80, 223, 0.08)),
        #f6f8fa;
      border-bottom: 1px solid var(--line);
    }

    .cover-link img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
      filter: drop-shadow(0 10px 12px rgba(31, 35, 40, 0.18));
    }

    .cover-placeholder {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #2f81f7, #8250df);
      color: #fff;
      font-weight: 800;
      font-size: 1.4rem;
    }

    .book-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 16px;
    }

    .book-body h3 {
      margin: 2px 0 0;
      color: var(--text);
      font-size: 1.02rem;
      line-height: 1.35;
      letter-spacing: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .book-body h3 a:hover,
    .book-body h3 a:focus-visible {
      color: var(--accent-dark);
      outline: none;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .book-body p {
      margin: 8px 0 12px;
      color: var(--muted);
      font-size: 0.9rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .open-link {
      margin-top: auto;
      min-height: 36px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 10px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--surface-strong);
      color: var(--text);
      font-weight: 600;
      font-size: 0.88rem;
    }

    .open-link:hover,
    .open-link:focus-visible {
      border-color: #8c959f;
      background: #eef1f4;
      color: var(--accent-dark);
      outline: none;
    }

    .empty-state {
      margin: 36px 0 0;
      padding: 28px;
      background: var(--surface);
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--muted);
      text-align: center;
    }

    .page-footer {
      width: min(1240px, calc(100% - 32px));
      margin: 0 auto;
      padding: 0 0 32px;
      color: var(--muted);
      font-size: 0.86rem;
    }

    .page-footer a {
      color: var(--accent-dark);
      font-weight: 600;
    }

    .page-footer a:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    [hidden] {
      display: none !important;
    }

    @media (max-width: 1080px) {
      .catalog-shell {
        grid-template-columns: 220px minmax(0, 1fr);
        gap: 24px;
      }

      .book-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 820px) {
      .header-shell,
      .section-heading {
        grid-template-columns: 1fr;
      }

      .stats {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .stat:last-child {
        grid-column: auto;
      }

      .catalog-shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
      }

      .filter-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 620px) {
      .header-shell,
      .toolbar-shell,
      .catalog-shell,
      .page-footer {
        width: min(100% - 22px, 1240px);
      }

      .header-shell {
        padding: 42px 0 38px;
      }

      .brand {
        flex-direction: column;
      }

      .brand-mark {
        width: 56px;
        height: 56px;
      }

      .search-row {
        grid-template-columns: 1fr;
      }

      .visible-count {
        min-width: 0;
        text-align: left;
      }

      .stats {
        gap: 8px;
      }

      .stat {
        padding: 14px 10px;
      }

      .stat strong {
        font-size: 1.45rem;
      }

      .filter-row,
      .book-grid {
        grid-template-columns: 1fr;
      }

      .cover-link {
        height: 320px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      html {
        scroll-behavior: auto;
      }

      .book-card {
        transition: none;
      }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#catalogo">Ir para o catálogo</a>
  <header class="site-header">
    <div class="header-shell">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">BD</div>
        <div>
          <span class="eyebrow">github.com/KAYOKG/BibliotecaDev</span>
          <h1>BibliotecaDev</h1>
          <p>Uma biblioteca aberta para quem constrói software. Busque por tema, explore as categorias e abra os PDFs direto no navegador.</p>
          <div class="hero-actions">
            <a class="hero-primary" href="#catalogo">Explorar biblioteca <span aria-hidden="true">↓</span></a>
            <a class="hero-secondary" href="https://github.com/KAYOKG/BibliotecaDev" target="_blank" rel="noopener">Ver no GitHub <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </div>
      <div class="stats" aria-label="Resumo da biblioteca">
        <div class="stat">
          <strong>${books.length}</strong>
          <span>PDFs locais</span>
        </div>
        <div class="stat">
          <strong>${categoryOrder.filter((category) => booksByCategory.get(category).length).length}</strong>
          <span>categorias</span>
        </div>
        <div class="stat">
          <strong>100%</strong>
          <span>com capa</span>
        </div>
      </div>
    </div>
  </header>

  <div class="toolbar">
    <div class="toolbar-shell">
      <div class="search-row">
        <label class="search-box" for="bookSearch">
          <span aria-hidden="true">&#128269;</span>
          <input id="bookSearch" type="search" autocomplete="off" placeholder="Buscar por título, autor ou tecnologia">
        </label>
        <div class="visible-count" aria-live="polite"><strong id="visibleCount">${books.length}</strong> encontrados</div>
      </div>
    </div>
  </div>

  <div class="catalog-shell">
    <aside class="sidebar" aria-label="Sumário da biblioteca">
      <div class="sidebar-card">
        <span class="sidebar-eyebrow">Navegação</span>
        <h2>Sumário</h2>
        <p>Filtre o acervo por área de conhecimento.</p>
        <nav class="filter-row" aria-label="Categorias">
            ${filters}
        </nav>
      </div>
    </aside>

    <main id="catalogo" tabindex="-1">
${sections}
      <div class="empty-state" id="emptyState" hidden>Nenhum livro encontrado para esse filtro.</div>
    </main>
  </div>

  <footer class="page-footer">
    Gerado em ${escapeHtml(generatedAt)} a partir dos PDFs locais em <strong>LivrosDev</strong> · <a href="https://github.com/KAYOKG/BibliotecaDev" target="_blank" rel="noopener">Ver projeto no GitHub ↗</a>
  </footer>

  <script>
    const normalizeText = (value) => value
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    const cards = [...document.querySelectorAll('[data-book-card]')];
    const sections = [...document.querySelectorAll('[data-category-section]')];
    const filters = [...document.querySelectorAll('[data-category-filter]')];
    const search = document.querySelector('#bookSearch');
    const visibleCount = document.querySelector('#visibleCount');
    const emptyState = document.querySelector('#emptyState');
    let activeCategory = 'all';

    function applyFilters() {
      const query = normalizeText(search.value);
      let visible = 0;

      for (const card of cards) {
        const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
        const matchesSearch = !query || card.dataset.search.includes(query);
        const shouldShow = matchesCategory && matchesSearch;
        card.hidden = !shouldShow;

        if (shouldShow) {
          visible += 1;
        }
      }

      for (const section of sections) {
        const hasVisibleBooks = [...section.querySelectorAll('[data-book-card]')].some((card) => !card.hidden);
        section.hidden = !hasVisibleBooks;
      }

      visibleCount.textContent = visible;
      emptyState.hidden = visible > 0;
    }

    search.addEventListener('input', applyFilters);

    for (const filter of filters) {
      filter.addEventListener('click', () => {
        activeCategory = filter.dataset.categoryFilter;
        filters.forEach((item) => item.classList.toggle('is-active', item === filter));
        applyFilters();
      });
    }
  </script>
</body>
</html>
`;
}

const pdfFiles = fs.readdirSync(booksDir)
  .filter((file) => file.toLowerCase().endsWith('.pdf'))
  .sort((left, right) => left.localeCompare(right, 'pt-BR'));

const covers = fs.readdirSync(coversDir)
  .filter((file) => file.toLowerCase().endsWith('.svg') && file.toLowerCase() !== 'header.svg')
  .map((file) => ({
    file,
    stem: path.basename(file, path.extname(file)),
  }));

const books = pdfFiles.map((file) => {
  const stem = path.basename(file, path.extname(file));
  const book = {
    file,
    ...titleAndAuthor(stem),
  };
  book.category = categoryFor(book);
  book.cover = coverFor(book, covers);
  book.pdfHref = encodeUrlPath('LivrosDev', file);
  book.coverHref = book.cover ? encodeUrlPath('assets', 'img', book.cover.file) : '';
  return book;
});

books.sort((left, right) => {
  const categoryDelta = categoryOrder.indexOf(left.category) - categoryOrder.indexOf(right.category);
  return categoryDelta || left.title.localeCompare(right.title, 'pt-BR');
});

fs.writeFileSync(outputFile, renderHtml(books), 'utf8');

const withCovers = books.filter((book) => book.cover).length;
console.log(`Gerado ${path.relative(rootDir, outputFile)} com ${books.length} livros e ${withCovers} capas locais.`);
