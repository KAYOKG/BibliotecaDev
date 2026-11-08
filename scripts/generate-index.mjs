import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const booksDir = path.join(rootDir, 'LivrosDev');
const coversDir = path.join(rootDir, 'assets', 'img');
const outputFile = path.join(rootDir, 'index.html');
// Share previews need absolute URLs.
const siteUrl = 'https://kayokg.github.io/BibliotecaDev/';

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

const spinePalette = [
  ['#7b1e2b', '#fff'],
  ['#5f8fc2', '#fff'],
  ['#1c1c1c', '#fff'],
  ['#e2a72a', '#171717'],
  ['#5c4f78', '#fff'],
  ['#ece9e2', '#171717'],
  ['#2f5d50', '#fff'],
  ['#b5532f', '#fff'],
];

// One featured book per category keeps the hero varied without manual curation.
function pickFeatured(books) {
  return categoryOrder
    .map((category) => books.find((book) => book.category === category && book.cover))
    .filter(Boolean);
}

function renderRackBook(book, index, activeIndex) {
  const title = escapeHtml(book.title);
  const [spine, ink] = spinePalette[index % spinePalette.length];

  return `
        <a class="rack-book${index === activeIndex ? ' is-active' : ''}" href="${escapeHtml(book.pdfHref)}" target="_blank" rel="noopener"
          data-rack-book data-title="${title}" data-author="${escapeHtml(book.author)}" data-category="${escapeHtml(book.category)}"
          data-section="#${encodeURIComponent(book.category)}" style="--spine-bg: ${spine}; --spine-ink: ${ink};"
          aria-label="${title} — abrir PDF">
          <span class="book-3d">
            <span class="book-face book-front"><img src="${book.coverHref}" alt="" width="206" height="300"></span>
            <span class="book-face book-spine" aria-hidden="true"><span>${title}</span></span>
          </span>
        </a>`;
}

// Every category becomes a themed shelf in an inert <template>; the page draws one at random per visit.
function renderShelves(books) {
  return categoryOrder
    .map((category) => {
      const shelf = books.filter((book) => book.category === category && book.cover);
      if (!shelf.length) return '';
      return `    <template data-shelf="${escapeHtml(category)}">${shelf.map((book, index) => renderRackBook(book, index, -1)).join('')}
    </template>`;
    })
    .join('\n');
}

function renderRack(books) {
  const featured = pickFeatured(books);
  const activeIndex = Math.floor(featured.length / 2);
  const active = featured[activeIndex];

  return `
  <section class="intro" id="top" aria-labelledby="heroTitle">
    <span class="eyebrow">Leitura para quem constrói software</span>
    <h1>BibliotecaDev</h1>
    <p class="rack-hint"><span class="hint-hover">Passe o mouse para virar a capa · clique para abrir o PDF</span><span class="hint-touch">Deslize o dedo pelos livros · toque para abrir o PDF</span></p>

    <p class="rack-shelf" data-shelf-label>Um de cada categoria</p>

    <div class="rack" data-rack>
      <div class="rack-row" data-rack-row>
        <noscript>
${featured.map((book, index) => renderRackBook(book, index, activeIndex)).join('\n')}
        </noscript>
      </div>
    </div>
${renderShelves(books)}

    <div class="rack-detail" aria-live="polite">
      <h2 id="heroTitle" data-detail-title>${escapeHtml(active.title)}</h2>
      <p data-detail-meta>${escapeHtml(active.author)} · ${escapeHtml(active.category)}</p>
      <div class="rack-actions">
        <a class="btn-solid" data-detail-open href="${escapeHtml(active.pdfHref)}" target="_blank" rel="noopener">Abrir PDF</a>
        <a class="btn-outline" data-detail-section href="#${encodeURIComponent(active.category)}">Ver categoria</a>
      </div>
    </div>
  </section>`;
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
  <title>BibliotecaDev — livros de tecnologia em PDF</title>
  <meta name="description" content="${books.length} livros de programação, arquitetura, DevOps, cloud, dados, agilidade e carreira para ler em PDF, organizados por categoria.">
  <link rel="canonical" href="${siteUrl}">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
  <meta name="theme-color" content="#ffffff">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="BibliotecaDev">
  <meta property="og:title" content="BibliotecaDev — livros de tecnologia em PDF">
  <meta property="og:description" content="${books.length} livros de programação, arquitetura, DevOps, dados e carreira, organizados por categoria.">
  <meta property="og:url" content="${siteUrl}">
  <meta property="og:image" content="${siteUrl}assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="BibliotecaDev: estante com lombadas coloridas de livros">
  <meta name="twitter:card" content="summary_large_image">
  <style>
    :root {
      color-scheme: light;
      --text: #171717;
      --muted: #686868;
      --line: #dedede;
      --accent: #171717;
      --accent-dark: #171717;
      --surface: #ffffff;
      --surface-strong: #f6f6f6;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    a { color: inherit; text-decoration: none; }
    button, input { font: inherit; }
    [hidden] { display: none !important; }

    :focus-visible {
      outline: 2px solid #171717;
      outline-offset: 3px;
    }

    .skip-link {
      position: fixed;
      top: 8px;
      left: 8px;
      z-index: 100;
      transform: translateY(-150%);
      padding: 8px 12px;
      background: #fff;
      color: #111;
      font-weight: 700;
    }

    .skip-link:focus { transform: translateY(0); }
    main { min-width: 0; }

    .filter-button {
      display: flex;
      align-items: center;
      border: 0;
      background: transparent;
      cursor: pointer;
    }

    .search-row {
      display: grid;
      align-items: center;
    }

    .search-box { position: relative; }

    .search-box span {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted);
      pointer-events: none;
    }

    .search-box input {
      width: 100%;
      background: #fff;
      color: var(--text);
      outline: none;
    }

    .visible-count {
      color: var(--muted);
      text-align: right;
    }

    .category-section:last-child { margin-bottom: 0; }
    .section-heading span { display: inline-flex; }

    .book-grid { display: grid; }

    .book-card {
      display: flex;
      flex-direction: column;
      transition: transform 180ms ease;
    }

    .cover-link {
      width: 100%;
      display: grid;
      place-items: center;
      overflow: hidden;
    }

    .cover-link img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    }

    .cover-placeholder {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      background: #171717;
      color: #fff;
      font-weight: 800;
    }

    .book-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .book-body h3 {
      display: -webkit-box;
      margin: 0;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }

    .book-body h3 a:hover,
    .book-body h3 a:focus-visible {
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .book-body p {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .open-link {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }

    .empty-state {
      margin: 36px 0 0;
      padding: 28px;
      border: 1px dashed #b8b8b8;
      color: var(--muted);
      text-align: center;
    }

    .page-footer a { font-weight: 700; }
    .page-footer a:hover { text-decoration: underline; text-underline-offset: 3px; }

    /* Storefront layout inspired by the supplied editorial reference. */
    body {
      margin: 0;
      background: #fff;
      color: #171717;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.5;
    }

    .site-header {
      position: sticky;
      top: 0;
      z-index: 30;
      overflow: visible;
      background: rgba(255, 255, 255, 0.97);
      color: #171717;
      border-bottom: 1px solid #e7e7e7;
      backdrop-filter: blur(14px);
    }

    .site-header::before {
      display: none;
    }

    .header-shell {
      margin: 0 auto;
      width: min(1480px, calc(100% - 64px));
      min-height: 92px;
      padding: 0;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 56px;
      align-items: center;
    }

    .brand {
      display: inline-flex;
      align-items: baseline;
      gap: 10px;
      color: #111;
      white-space: nowrap;
    }

    .brand-main {
      font-size: clamp(1.2rem, 2vw, 1.7rem);
      font-weight: 800;
      letter-spacing: 0.25em;
    }

    .brand-sub {
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.18em;
    }

    .main-nav {
      display: flex;
      justify-content: center;
      gap: clamp(24px, 4vw, 64px);
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .main-nav a {
      padding: 34px 0 30px;
      border-bottom: 2px solid transparent;
    }

    .main-nav a:hover,
    .main-nav a:focus-visible,
    .main-nav a:first-child {
      border-color: #171717;
      outline: none;
    }

    .github-link {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .intro {
      width: min(1480px, calc(100% - 64px));
      margin: 0 auto;
      padding: 74px 0 58px;
      text-align: center;
    }

    .intro .eyebrow {
      margin: 0 0 10px;
      color: #767676;
      font-family: inherit;
      font-size: 0.7rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .intro h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 3.6rem);
      font-weight: 400;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .hint-touch { display: none; }
    @media (hover: none) {
      .hint-hover { display: none; }
      .hint-touch { display: inline; }
    }

    .rack-shelf {
      margin: 34px 0 0;
      color: #171717;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .rack-hint {
      margin: 14px 0 0;
      color: #8a8a8a;
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    /* Hero rack: books hang on a rod showing the spine and turn to the cover on hover/focus. */
    .rack {
      --cover-w: 206px;
      --cover-h: 300px;
      --thick: 46px;
      --rest: 84px;
      --fade: 7%;
      position: relative;
      margin: 40px auto 0;
      padding: 34px 32px 72px;
      /* fade every edge into the page so the clipped scroll area never shows a seam */
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 var(--fade), #000 calc(100% - var(--fade)), transparent);
      mask-image: linear-gradient(90deg, transparent, #000 var(--fade), #000 calc(100% - var(--fade)), transparent);
      overflow-x: auto;
      scrollbar-width: none;
    }

    .rack::-webkit-scrollbar { display: none; }

    .rack-row {
      position: relative;
      width: max-content;
      min-width: 100%;
      display: flex;
      justify-content: center;
      gap: clamp(22px, 3vw, 44px);
      padding: 46px 28px 0;
    }

    /* the rod */
    .rack-row::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      border: 1px solid #a9a9a9;
      border-radius: 3px;
      background: linear-gradient(#fafafa, #cfcfcf);
    }

    .rack-book {
      position: relative;
      flex: 0 0 var(--rest);
      height: var(--cover-h);
      perspective: 1400px;
      transition: flex-basis 600ms cubic-bezier(0.22, 1, 0.36, 1);
      outline: none;
    }

    /* the hook */
    .rack-book::before {
      content: "";
      position: absolute;
      top: -46px;
      left: 50%;
      width: 12px;
      height: 46px;
      margin-left: -6px;
      border: 1.5px solid #8d8d8d;
      border-bottom: 0;
      border-radius: 6px 6px 0 0;
      clip-path: inset(0 0 0 50%);
    }

    .rack-book.is-active { flex-basis: var(--cover-w); }

    .book-3d {
      position: absolute;
      top: 0;
      left: 50%;
      width: var(--cover-w);
      height: var(--cover-h);
      margin-left: calc(var(--cover-w) / -2);
      transform-style: preserve-3d;
      transform: rotateY(78deg);
      transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .rack-book.is-active .book-3d { transform: rotateY(0deg) scale(1.06); }
    @media (hover: hover) {
      .rack-book:not(.is-active):hover .book-3d { transform: rotateY(66deg); }
    }

    .book-face {
      position: absolute;
      top: 0;
      height: 100%;
      backface-visibility: hidden;
    }

    .book-front {
      left: 0;
      width: 100%;
      transform: translateZ(calc(var(--thick) / 2));
      background: #f1f1f1;
      box-shadow: 0 22px 36px -14px rgba(0, 0, 0, 0.24), 0 6px 14px -8px rgba(0, 0, 0, 0.12);
    }

    .book-front img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }

    /* binding crease */
    .book-front::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.18) 3%, transparent 7%);
    }

    .book-spine {
      left: calc((var(--cover-w) - var(--thick)) / 2);
      width: var(--thick);
      transform: rotateY(-90deg) translateZ(calc(var(--cover-w) / 2));
      display: grid;
      place-items: center;
      overflow: hidden;
      padding: 18px 0;
      background:
        linear-gradient(90deg, rgba(0, 0, 0, 0.28), rgba(255, 255, 255, 0.14) 38%, rgba(0, 0, 0, 0.22)),
        var(--spine-bg);
      color: var(--spine-ink);
    }

    .book-spine span {
      max-height: 100%;
      overflow: hidden;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 0.66rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .rack-book:focus-visible .book-front,
    .rack-book:focus-visible .book-spine {
      outline: 2px solid #171717;
      outline-offset: 4px;
    }

    .rack-detail {
      max-width: 820px;
      margin: -20px auto 0;
    }

    .rack-detail h2 {
      margin: 0;
      font-size: clamp(1.6rem, 3.4vw, 3rem);
      font-weight: 400;
      line-height: 1.12;
      letter-spacing: -0.01em;
    }

    .rack-detail p {
      margin: 14px 0 0;
      color: #555;
      font-size: 0.86rem;
    }

    .rack-actions {
      display: flex;
      justify-content: center;
      gap: 14px;
      margin-top: 26px;
    }

    .btn-solid,
    .btn-outline {
      min-width: 220px;
      min-height: 50px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 24px;
      border: 1px solid #171717;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.06em;
    }

    .btn-solid { background: #171717; color: #fff; }
    .btn-outline { background: #fff; color: #171717; border-color: #d4d4d4; }
    .btn-solid:hover, .btn-solid:focus-visible { background: #fff; color: #171717; }
    .btn-outline:hover, .btn-outline:focus-visible { border-color: #171717; }

    .toolbar {
      position: relative;
      top: auto;
      z-index: 10;
      background: #fff;
      border-top: 1px solid #ededed;
      border-bottom: 1px solid #dedede;
      backdrop-filter: none;
    }

    .toolbar-shell {
      margin: 0 auto;
      width: min(1480px, calc(100% - 64px));
      padding: 0;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
      gap: 32px;
      align-items: center;
    }

    .filter-row {
      display: flex;
      gap: 34px;
      margin: 0;
      overflow-x: auto;
      scrollbar-width: thin;
    }

    .filter-button {
      width: auto;
      min-height: 66px;
      flex: 0 0 auto;
      padding: 0;
      border-radius: 0;
      justify-content: center;
      color: #5c5c5c;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .filter-button span {
      display: none;
    }

    .filter-button:hover,
    .filter-button:focus-visible,
    .filter-button.is-active {
      background: transparent;
      color: #111;
      box-shadow: inset 0 -2px 0 #111;
    }

    .search-row {
      grid-template-columns: 1fr auto;
      gap: 10px;
    }

    .search-box input {
      height: 42px;
      border: 0;
      border-bottom: 1px solid #bdbdbd;
      border-radius: 0;
      padding-left: 34px;
    }

    .search-box input:focus {
      border-color: #111;
      box-shadow: none;
    }

    .search-box span {
      left: 6px;
      filter: grayscale(1);
    }

    .visible-count {
      min-width: auto;
      font-size: 0.76rem;
      white-space: nowrap;
    }

    .catalog-shell {
      width: min(1480px, calc(100% - 64px));
      margin: 0 auto;
      padding: 72px 0 100px;
      display: block;
    }

    .category-section {
      margin-bottom: 112px;
      scroll-margin-top: 112px;
    }

    .section-heading {
      display: block;
      margin-bottom: 44px;
      padding: 0;
      border: 0;
      text-align: center;
    }

    .section-heading h2 {
      font-size: clamp(1.25rem, 2vw, 1.8rem);
      font-weight: 500;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .section-heading span {
      margin-top: 10px;
      padding: 0;
      border: 0;
      background: transparent;
      font-size: 0.68rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .section-heading p {
      max-width: 620px;
      margin: 12px auto 0;
      font-size: 0.88rem;
    }

    .book-grid {
      position: relative;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 38px 24px;
      padding-top: 34px;
      border-top: 2px solid #b9b9b9;
    }

    .book-grid::before,
    .book-grid::after {
      content: "";
      position: absolute;
      top: -9px;
      width: 5px;
      height: 16px;
      border: 1px solid #888;
      background: #fff;
    }

    .book-grid::before { left: 0; }
    .book-grid::after { right: 0; }

    .book-card {
      min-height: 0;
      overflow: visible;
      border: 0;
      border-radius: 0;
      background: transparent;
      text-align: center;
    }

    .book-card:hover {
      transform: translateY(-5px);
      border-color: transparent;
      box-shadow: none;
    }

    .cover-link {
      height: 340px;
      padding: 10px;
      background: #fafafa;
      border: 0;
    }

    .cover-link img {
      filter: drop-shadow(0 12px 12px rgba(0, 0, 0, 0.16));
    }

    .book-body {
      align-items: center;
      padding: 22px 8px 0;
    }

    .book-body h3 {
      font-size: 1rem;
      font-weight: 500;
      line-height: 1.35;
    }

    .book-body p {
      margin: 8px 0 16px;
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .open-link {
      width: 100%;
      min-height: 42px;
      justify-content: center;
      margin-top: auto;
      border: 1px solid #171717;
      border-radius: 0;
      background: #171717;
      color: #fff;
      font-size: 0.76rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .open-link:hover,
    .open-link:focus-visible {
      background: #fff;
      color: #171717;
      border-color: #171717;
    }

    .page-footer {
      margin: 0 auto;
      width: min(1480px, calc(100% - 64px));
      padding: 28px 0;
      border-top: 1px solid #e4e4e4;
      text-align: center;
    }

    @media (max-width: 1100px) {
      .main-nav { display: none; }
      .header-shell { grid-template-columns: 1fr auto; }
      .toolbar-shell { grid-template-columns: 1fr; padding: 0 0 16px; }
      .book-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    @media (max-width: 700px) {
      .header-shell,
      .intro,
      .toolbar-shell,
      .catalog-shell,
      .page-footer {
        width: min(100% - 28px, 1480px);
      }

      .header-shell { min-height: 72px; gap: 16px; }
      .brand-main { font-size: 1rem; }
      .brand-sub, .github-link { font-size: 0.62rem; }
      .intro { padding: 52px 0 40px; }
      .intro h1 { font-size: 1.7rem; }
      /* All books fit the screen: no horizontal scroll, so a sideways swipe scrubs the rack. */
      .rack { --cover-w: 36vw; --cover-h: 52vw; --thick: 4.5vw; --rest: 6.5vw; --fade: 2%; margin: 24px -14px 0; padding: 30px 0 60px; overflow: hidden; touch-action: pan-y; }
      .rack-row { gap: 1.5vw; padding-left: 2vw; padding-right: 2vw; }
      .book-3d { transform: rotateY(84deg); }
      .book-spine { padding: 10px 0; }
      .book-spine span { font-size: 0.5rem; letter-spacing: 0.1em; }
      .rack-actions { flex-direction: column; align-items: stretch; }
      .btn-solid, .btn-outline { min-width: 0; }
      .filter-row { gap: 24px; }
      .filter-button { min-height: 58px; }
      .search-row { grid-template-columns: 1fr; }
      .visible-count { text-align: left; }
      .catalog-shell { padding-top: 52px; }
      .category-section { margin-bottom: 78px; }
      .book-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 34px 14px; }
      .cover-link { height: 260px; }
    }

    @media (max-width: 430px) {
      .book-grid { grid-template-columns: 1fr; }
      .cover-link { height: 360px; }
    }

    @media (prefers-reduced-motion: reduce) {
      html {
        scroll-behavior: auto;
      }

      .book-card,
      .rack-book,
      .book-3d {
        transition: none;
      }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#catalogo">Ir para o catálogo</a>
  <header class="site-header">
    <div class="header-shell">
      <a class="brand" href="#top" aria-label="BibliotecaDev — início">
        <span class="brand-main">Biblioteca</span>
        <span class="brand-sub">Dev</span>
      </a>
      <nav class="main-nav" aria-label="Navegação principal">
        <a href="#catalogo">Acervo</a>
        <a href="#categorias">Categorias</a>
        <a href="https://github.com/KAYOKG/BibliotecaDev#readme" target="_blank" rel="noopener">Sobre</a>
      </nav>
      <a class="github-link" href="https://github.com/KAYOKG/BibliotecaDev" target="_blank" rel="noopener">GitHub ↗</a>
    </div>
  </header>

${renderRack(books)}

  <div class="toolbar" id="categorias">
    <div class="toolbar-shell">
      <nav class="filter-row" aria-label="Categorias">
          ${filters}
      </nav>
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

    // Random themed shelf per visit: one category, or one book from each. Never the same theme twice in a row.
    const spinePalette = ${JSON.stringify(spinePalette)};
    const shelves = [...document.querySelectorAll('template[data-shelf]')];
    const shuffle = (list) => {
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    };
    const shelfBooks = (template) => [...template.content.children].map((node) => node.cloneNode(true));
    let lastTheme = null;
    try { lastTheme = localStorage.getItem('bibliotecadev-shelf'); } catch {}
    const themes = ['mix', ...shelves.map((template) => template.dataset.shelf)].filter((theme) => theme !== lastTheme);
    const theme = themes[Math.floor(Math.random() * themes.length)];
    try { localStorage.setItem('bibliotecadev-shelf', theme); } catch {}

    const shelf = theme === 'mix'
      ? shelves.map((template) => shuffle(shelfBooks(template))[0])
      : shuffle(shelfBooks(shelves.find((template) => template.dataset.shelf === theme))).slice(0, 8);
    shelf.forEach((book, index) => {
      const [spine, ink] = spinePalette[index % spinePalette.length];
      book.style.setProperty('--spine-bg', spine);
      book.style.setProperty('--spine-ink', ink);
    });
    document.querySelector('[data-rack-row]').replaceChildren(...shelf);
    document.querySelector('[data-shelf-label]').textContent = theme === 'mix' ? 'Um de cada categoria' : 'Estante · ' + theme;

    const rackBooks = [...document.querySelectorAll('[data-rack-book]')];
    const detailTitle = document.querySelector('[data-detail-title]');
    const detailMeta = document.querySelector('[data-detail-meta]');
    const detailOpen = document.querySelector('[data-detail-open]');
    const detailSection = document.querySelector('[data-detail-section]');

    function activateBook(book) {
      if (book.classList.contains('is-active')) return;
      rackBooks.forEach((item) => item.classList.toggle('is-active', item === book));
      detailTitle.textContent = book.dataset.title;
      detailMeta.textContent = book.dataset.author + ' · ' + book.dataset.category;
      detailOpen.href = book.href;
      detailSection.href = book.dataset.section;
    }

    for (const book of rackBooks) {
      book.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') activateBook(book);
      });
      book.addEventListener('focus', () => activateBook(book));
    }

    // Touch scrub: sliding a finger across the rack turns the book under it, like hover.
    // A plain tap still reaches the link and opens the PDF. Touch pointers are captured
    // by the element they start on, so hit-test the finger position instead of event.target.
    const rack = document.querySelector('[data-rack]');
    function scrub(event) {
      if (event.pointerType === 'mouse') return;
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const book = hit && hit.closest('[data-rack-book]');
      if (book) activateBook(book);
    }
    rack.addEventListener('pointerdown', scrub);
    rack.addEventListener('pointermove', scrub);
    activateBook(rackBooks[Math.floor(rackBooks.length / 2)]);

    // The target section may be hidden by an active filter or search.
    detailSection.addEventListener('click', () => {
      search.value = '';
      document.querySelector('[data-category-filter="all"]').click();
    });
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
