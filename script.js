// ============================================================
// CONFIGURAÇÃO — Cloudflare Workers AI
// ============================================================
const CF_WORKER_URL = "https://lively-flower-1122.hildebrando-24104708360041.workers.dev";
const CF_FALLBACK   = ["llama-3.1-8b"]; // só para o loop, o Worker decide o modelo real

const MODELS = [
  { id: "o500",     name: "Mercedes-Benz O500",       sub: "Articulado BRT" },
  { id: "torinonl", name: "Marcopolo Torino Euro 5",  sub: "Articulado BRT" },
  { id: "torinos",  name: "Marcopolo Torino Euro 6",  sub: "Articulado BRT" },
  { id: "torino",   name: "Marcopolo Torino (Padrão)",sub: "Urbano" },
  { id: "apache",   name: "Caio Apache VIP",          sub: "Chassi MAN D08" },
  { id: "volvo",    name: "Volvo",                    sub: "Urbano/Articulado" }
];

const PARTS = {
  alt:            { name: "Alternador",                    icon: "⚡" },
  bat:            { name: "Bateria",                       icon: "🔋" },
  mot:            { name: "Motor de partida",              icon: "🔑" },
  chicote:        { name: "Chicote / fiação",              icon: "🧵" },
  porta:          { name: "Porta pneumática (sensor/solenoide)", icon: "🚪" },
  farol:          { name: "Faróis e lanternas",            icon: "💡" },
  fusivel:        { name: "Fusíveis e relés",              icon: "🔌" },
  ecu:            { name: "Módulo / painel (CAN)",         icon: "📟" },
  freio:          { name: "Freios e ABS",                  icon: "🛑" },
  transmissao:    { name: "Transmissão / Retardador",      icon: "⚙️" },
  arcondicionado: { name: "Ar-condicionado / Calefação",   icon: "❄️" },
  limpador:       { name: "Limpador de para-brisa",        icon: "🌧️" },
  suspensao:      { name: "Suspensão Eletropneumática",    icon: "🚍" }
};

const ITEMS = [
  { t: "Bateria descarregando sozinha", ic: "🔋", p: "bat", k: "bateria descarregando descarrega sozinha fraca não carrega consumo parasita", q: "ônibus bateria descarregando consumo parasita teste", causes: ["Consumo parasita (algo ligado com a chave desligada)", "Bateria velha ou com células sulfatadas", "Bornes frouxos ou oxidados", "Alternador não carregando"] },
  { t: "Alternador não carrega", ic: "⚡", p: "alt", k: "alternador não carrega luz da bateria acesa correia regulador troca trocar", q: "como trocar alternador ônibus teste regulador de tensão", causes: ["Regulador de tensão defeituoso", "Correia frouxa ou patinando", "Escovas/carvões gastos", "Cabo B+ solto ou com mau contato"] },
  { t: "Motor de partida não gira", ic: "🔑", p: "mot", k: "motor de partida não pega não liga estalo clique arranque partida", q: "ônibus motor de partida não gira diagnóstico solenoide", causes: ["Bateria fraca", "Relé ou solenoide do motor de partida", "Cabo de massa solto", "Interruptor de partida / fusível queimado"] },
  { t: "Porta não abre / não fecha", ic: "🚪", p: "porta", k: "porta não abre não fecha travada sensor solenoide pneumática", q: "ônibus porta pneumática não fecha solenoide sensor elétrico", causes: ["Solenoide da porta sem sinal", "Sensor de fim de curso desregulado", "Fusível ou relé da porta", "Fio rompido no chicote da porta"] },
  { t: "Farol / lanterna apagada", ic: "💡", p: "farol", k: "farol apagado lanterna luz não acende lâmpada seta freio", q: "ônibus farol não acende diagnóstico relé fusível", causes: ["Lâmpada queimada", "Fusível queimado", "Mau contato no conector", "Falta de massa (negativo)"] },
  { t: "Fusível queimando toda hora", ic: "🔌", p: "fusivel", k: "fusível queimando queima curto circuito relé esquentando", q: "ônibus fusível queimando curto circuito como achar", causes: ["Curto-circuito (fio descascado encostando na lataria)", "Componente puxando corrente demais", "Fusível com amperagem errada", "Umidade no conector"] },
  { t: "Chicote com fio rompido / curto", ic: "🧵", p: "chicote", k: "chicote fio rompido curto fiação ressecada roedor emenda conector", q: "ônibus chicote elétrico fio rompido reparo conector", causes: ["Fio ressecado ou roído", "Conector com água ou oxidação", "Fio esticado em curva (fadiga)", "Emenda mal feita"] },
  { t: "Painel com luzes acesas / sem comunicação", ic: "📟", p: "ecu", k: "painel luz acesa erro falha comunicação can módulo ecu aviso", q: "ônibus painel falha comunicação CAN módulo", causes: ["Tensão baixa na bateria", "Falha na rede CAN (fio ou terminador)", "Módulo sem alimentação ou massa", "Conector solto no módulo"] },
  { t: "Luz do ABS acesa / Falha no freio", ic: "🛑", p: "freio", k: "freio abs asr luz acesa sensor válvula controle desgaste pastilha", q: "ônibus falha abs asr sensor roda diagnóstico", causes: ["Sensor ABS sujo ou danificado", "Fio do sensor rompido", "Falha no módulo ABS/ASR", "Desgaste excessivo nas pastilhas"] },
  { t: "Falha na transmissão automática / Retardador", ic: "⚙️", p: "transmissao", k: "câmbio transmissão automática retardador temperatura voith zf allison", q: "ônibus falha retardador temperatura transmissão automática", causes: ["Superaquecimento do fluido da transmissão", "Falha no relé do retardador", "Fio solto no seletor de marchas", "Problema no módulo eletrônico (ZF/Voith/Allison)"] },
  { t: "Ar-condicionado não gela / Calefação falha", ic: "❄️", p: "arcondicionado", k: "ar condicionado não gela compressor correia calefação ventilador", q: "ônibus ar condicionado manutenção compressor", causes: ["Filtro obstruído (feltro)", "Correia do compressor frouxa ou rompida", "Falta de gás/óleo no compressor", "Falha na válvula eletromagnética da calefação"] },
  { t: "Limpador de para-brisa não funciona", ic: "🌧️", p: "limpador", k: "limpador lavador para-brisa motor não funciona relé", q: "ônibus limpador de para-brisa não liga motor relé", causes: ["Motor do limpador queimado", "Relé temporizador defeituoso", "Fusível queimado", "Falha na chave direcional/interruptor"] },
  { t: "Veículo fora de nível / Suspensão não sobe", ic: "🚍", p: "suspensao", k: "suspensão eletropneumática ar ecas kneeling não sobe fora de nível", q: "ônibus suspensão a ar não sobe ecas válvula", causes: ["Vazamento de ar nas bolsas ou válvulas", "Falha no sensor de nível (ECAS)", "Problema no módulo Wabco da suspensão", "Relé ou alimentação elétrica cortada"] }
];

const CHIPS = ["Bateria descarregando", "Alternador não carrega", "Motor de partida não gira", "Porta não fecha", "Luz do ABS acesa", "Falha no Retardador", "Ar-condicionado"];

const MANUALS = [
  { id: "o500",     name: "Mercedes-Benz O500",       pdf: "manuais/MERCEDES.pdf", index: "manuais/MERCEDES.xml" },
  { id: "torinonl", name: "Marcopolo Torino New",     pdf: "manuais/TORINONL.pdf", index: "manuais/TORINONL.xml" },
  { id: "torinos",  name: "Marcopolo Torino S",       pdf: "manuais/TORINOS.pdf",  index: "manuais/TORINOS.xml"  },
  { id: "torino",   name: "Marcopolo Torino (Padrão)",pdf: "manuais/TORINO.pdf",   index: "manuais/TORINO.xml"   },
  { id: "apache",   name: "Caio Apache VIP",          pdf: "manuais/APACHE.pdf",   index: "manuais/APACHE.xml"   },
  { id: "volvo",    name: "Volvo",                    pdf: "manuais/VOLVO.pdf",    index: "manuais/VOLVO.xml"    }
];

// ============================================================
// Helpers
// ============================================================
const $ = s => document.querySelector(s);
const app = $("#app");
const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ytLink = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
const glink = q => "https://www.google.com/search?q=" + encodeURIComponent(q);

let ENTRIES = [];
let INDEX_FAIL = 0;
let INDEX_DONE = false;
let currentPages = [];
let rec = null;
let listening = false;

// ============================================================
// Índices XML
// ============================================================
function extractPages(pageStr) {
  if (!pageStr) return [];
  return pageStr.split(",").map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p > 0);
}

async function loadIndexes() {
  await Promise.all(MANUALS.map(async m => {
    try {
      const r = await fetch(m.index);
      if (!r.ok) { INDEX_FAIL++; return; }

      const text = await r.text();
      const x = new DOMParser().parseFromString(text, "application/xml");

      x.querySelectorAll("termo").forEach(t => {
        const nome = t.getAttribute("nome");
        const tPages = extractPages(t.getAttribute("pagina"));

        tPages.forEach(pg => ENTRIES.push({ m: m.id, termo: nome, sub: "", pagina: pg }));

        t.querySelectorAll("subitem").forEach(si => {
          const siPages = extractPages(si.getAttribute("pagina"));
          const finalPages = siPages.length ? siPages : (tPages.length ? [tPages[0]] : []);
          finalPages.forEach(sp => ENTRIES.push({ m: m.id, termo: nome, sub: si.getAttribute("nome"), pagina: sp }));
        });
      });
    } catch (e) {
      console.error(`Erro ao processar ${m.index}:`, e);
      INDEX_FAIL++;
    }
  }));

  INDEX_DONE = true;
}

const INDEX_READY = loadIndexes();

const stems = s => [...new Set(norm(s).split(/[^a-z0-9]+/).filter(w => w.length >= 4).map(w => w.slice(0, 5)))];

function scoreEntries(hints) {
  const hs = new Set(stems(hints));
  return ENTRIES
    .map(e => ({ e, sc: stems(e.termo + " " + e.sub).filter(w => hs.has(w)).length }))
    .filter(o => o.sc > 0)
    .sort((a, b) => b.sc - a.sc)
    .map(o => o.e);
}

function indexSummary() {
  if (!ENTRIES.length) {
    return "(ÍNDICE VAZIO — os arquivos XML não foram carregados. Verifique a pasta manuais/ e rode via servidor local.)";
  }

  const byManual = {};
  ENTRIES.forEach(e => {
    (byManual[e.m] = byManual[e.m] || []).push(e);
  });

  const lines = [];
  lines.push(`Total: ${ENTRIES.length} entradas em ${Object.keys(byManual).length} manuais.`);
  lines.push("Formato: ID_MANUAL | TERMO [> SUBITEM] | PÁGINA");

  Object.entries(byManual).forEach(([mId, entries]) => {
    const m = MANUALS.find(x => x.id === mId);
    lines.push("");
    lines.push(`### ${m ? m.name : mId} (id="${mId}", ${entries.length} entradas)`);

    const seen = new Set();
    let shown = 0;
    for (const e of entries) {
      const key = e.termo + "|" + e.sub + "|" + e.pagina;
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(`${mId} | ${e.termo}${e.sub ? " > " + e.sub : ""} | p.${e.pagina}`);
      shown++;
      if (shown >= 80) break;
    }
  });

  return lines.join("\n");
}

function manualOf(id) {
  return MANUALS.find(m => m.id === id);
}

async function fillPages(r) {
  await INDEX_READY;

  const box = $("#pgbox");
  if (!box) return;

  let list = [];

  (r.aiPicks || []).forEach(p => {
    if (!p || !p.manual) return;
    const termoN = norm(p.termo || "");
    const matches = ENTRIES.filter(e => {
      if (e.m !== p.manual) return false;
      if (termoN && norm(e.termo) !== termoN && !norm(e.termo).includes(termoN)) return false;
      if (p.pagina && e.pagina !== p.pagina) return false;
      return true;
    });
    matches.forEach(e => list.push(e));
  });

  scoreEntries(r.hints || "").forEach(e => list.push(e));

  const seen = new Set();
  list = list.filter(e => {
    const k = e.m + "-" + e.pagina;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 8);

  if (!list.length) {
    box.innerHTML = ENTRIES.length
      ? `<div class="note">Nenhuma página do manual combinou com este problema.</div>`
      : `<div class="note">Não consegui ler os índices XML (${INDEX_FAIL} falha/s). Verifique se os arquivos estão na pasta <b>manuais/</b> e se você está rodando o site via servidor local (ex: python -m http.server).</div>`;
    return;
  }

  currentPages = list;

  box.innerHTML = `<div class="pg">${list.map((e, i) => `<button class="pgchip" onclick="openPg(${i})"><b>p. ${e.pagina}</b> ${esc(e.termo + (e.sub ? " · " + e.sub : ""))}<small>${esc(manualOf(e.m)?.name || e.m)}</small></button>`).join("")}</div><div id="pdfv"></div>`;
  openPg(0);
}

function openPg(i) {
  const e = currentPages[i];
  if (!e) return;
  const m = manualOf(e.m);
  if (!m) return;

  document.querySelectorAll(".pgchip").forEach((c, n) => c.classList.toggle("on", n === i));

  const u = m.pdf + "#page=" + e.pagina;
  $("#pdfv").innerHTML = `<div class="pdfbox"><iframe src="${esc(u)}" title="${esc(m.name)} página ${e.pagina}"></iframe></div><p style="margin:10px 0 0"><a href="${esc(u)}" target="_blank" rel="noopener">Abrir página ${e.pagina} em tela cheia ↗</a></p>`;
}

function say(txt) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = "pt-BR";
    speechSynthesis.speak(u);
  } catch (e) {}
}

// ============================================================
// Esquemático SVG
// ============================================================
function schematic(part) {
  const base = inner => `<svg class="sch" viewBox="0 0 640 220" role="img" aria-label="Esquema elétrico simplificado">${inner}</svg>`;
  const box = (x, y, w, h, l, c = "#FFE400") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${c}" stroke="#161315" stroke-width="3"/><text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#161315">${l}</text>`;
  const wire = (d, c = "#d62839") => `<path d="${d}" fill="none" stroke="${c}" stroke-width="4"/>`;
  const gnd = (x, y) => `<path d="M${x} ${y}v14M${x - 14} ${y + 14}h28M${x - 9} ${y + 20}h18M${x - 4} ${y + 26}h8" stroke="#cfc9cd" stroke-width="3" fill="none"/>`;

  const S = {
    alt: box(30, 80, 110, 60, "Alternador") + box(270, 20, 110, 50, "Regulador", "#FBAB18") + box(270, 150, 110, 50, "Bateria") + box(500, 80, 110, 60, "Painel/Cargas") + wire("M140 100H200V45H270") + wire("M380 45H440V100H500") + wire("M140 120H200V175H270") + wire("M380 175H440V120H500") + gnd(85, 140) + gnd(325, 200) + `<text x="320" y="110" text-anchor="middle" font-size="13">B+ (cabo grosso vermelho)</text>`,
    bat: box(30, 80, 110, 60, "Bateria") + box(240, 80, 110, 60, "Chave geral", "#FBAB18") + box(450, 80, 150, 60, "Caixa fusíveis/relés") + wire("M140 100H240") + wire("M350 100H450") + gnd(85, 140) + `<text x="320" y="190" text-anchor="middle" font-size="13">Positivo (+) vermelho · Negativo (−) na massa</text>`,
    mot: box(30, 80, 120, 60, "Bateria") + box(260, 20, 120, 50, "Relé partida", "#FBAB18") + box(260, 150, 120, 50, "Motor partida") + box(480, 20, 130, 50, "Chave/Botão") + wire("M150 100H210V175H260") + wire("M380 45H480", "#3300FF") + wire("M320 70V150") + gnd(320, 200) + gnd(90, 140),
    chicote: box(30, 90, 100, 50, "Fonte") + box(250, 90, 140, 50, "Conector", "#FBAB18") + box(500, 90, 110, 50, "Carga") + wire("M130 115H250") + wire("M390 115H500") + `<path d="M300 90 l-10 -30 m20 30 l10 -30" stroke="#d62839" stroke-width="3"/><text x="320" y="45" text-anchor="middle" font-size="13">Verifique: fio quebrado / oxidação / água</text>`,
    porta: box(30, 80, 110, 60, "Painel/Módulo") + box(250, 20, 140, 50, "Solenoide porta", "#FBAB18") + box(250, 150, 140, 50, "Sensor fim curso") + box(500, 80, 110, 60, "Fusível/Relé") + wire("M140 100H200V45H250", "#3300FF") + wire("M140 120H200V175H250", "#3300FF") + wire("M390 45H450V100H500") + gnd(320, 200),
    farol: box(30, 80, 110, 60, "Bateria") + box(250, 80, 110, 60, "Fusível+Relé", "#FBAB18") + box(470, 80, 140, 60, "Lâmpada/Farol") + wire("M140 110H250") + wire("M360 110H470") + gnd(540, 140) + gnd(85, 140),
    fusivel: box(30, 80, 110, 60, "Bateria") + box(250, 80, 120, 60, "Fusível", "#FBAB18") + box(470, 80, 140, 60, "Componente") + wire("M140 110H250") + wire("M370 110H470") + gnd(540, 140) + `<text x="310" y="190" text-anchor="middle" font-size="13">Fusível queima = corrente demais (curto ou carga)</text>`,
    ecu: box(30, 80, 110, 60, "Bateria") + box(250, 20, 130, 50, "Módulo A", "#FBAB18") + box(250, 150, 130, 50, "Módulo B", "#FBAB18") + box(500, 80, 110, 60, "Painel") + wire("M140 100H200V45H250") + wire("M380 45H440V100H500", "#3300FF") + wire("M380 175H440V120H500", "#3300FF") + wire("M315 70V150", "#3300FF") + `<text x="470" y="215" text-anchor="middle" font-size="13">Azul = rede CAN (2 fios)</text>`
  };

  return base(S[part] || S.chicote) + `<div class="note">Esquema didático simplificado. Confirme sempre no manual do modelo.</div>`;
}

// ============================================================
// Sugestões / busca
// ============================================================
function suggestions(q) {
  q = norm(q.trim());
  if (!q) return [];

  const out = [];

  ITEMS.forEach((it, i) => {
    const h = norm(it.t + " " + it.k + " " + PARTS[it.p].name);
    if (q.split(/\s+/).every(w => h.includes(w))) out.push({ ic: it.ic, l: it.t, tag: "problema", i });
  });

  Object.entries(PARTS).forEach(([k, p]) => {
    if (norm(p.name).includes(q) && !out.find(o => o.l === p.name)) out.push({ ic: p.icon, l: p.name, tag: "peça", part: k });
  });

  MODELS.forEach(m => {
    if (norm(m.name).includes(q)) out.push({ ic: "🚌", l: m.name, tag: "modelo", m: m.id });
  });

  return out.slice(0, 6);
}

function renderHome() {
  if (!app) return;

  app.innerHTML = `<section class="hero"><span class="eyebrow">Manual didático · Prevenção</span><h1>O que está acontecendo<br>com o <em>ônibus</em>?</h1><p>Fale, escreva ou toque em uma opção. Pode ser do seu jeito.</p>
  <div class="sb"><input id="q" autocomplete="off" placeholder="Fale ou escreva: bateria, porta, alternador…" aria-label="Buscar"><div class="acts"><button id="mic" class="ib m" onclick="mic()" aria-label="Falar" title="Falar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button><button class="ib g" onclick="search($('#q').value)" aria-label="Buscar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button></div><div id="sg" class="sug" hidden></div></div>
  <div class="chips">${CHIPS.map(c => `<button class="chip" onclick="search('${c}')">${c}</button>`).join("")}</div></section>
  <section class="models"><h3>Modelos no manual</h3><div class="mg">${MODELS.map(m => `<div class="mc" onclick="search('${m.name}')">${m.name}<small>${m.sub}</small></div>`).join("")}</div></section>`;

  const q = $("#q");
  const sg = $("#sg");
  let sel = -1;
  let cur = [];

  q.addEventListener("input", () => {
    cur = suggestions(q.value);
    sel = -1;
    sg.hidden = !cur.length;
    sg.innerHTML = cur.map((s, n) => `<div data-n="${n}"><i>${s.ic}</i>${esc(s.l)}<em>${s.tag}</em></div>`).join("");
  });

  sg.addEventListener("click", e => {
    const d = e.target.closest("[data-n]");
    if (d) pick(cur[d.dataset.n]);
  });

  q.addEventListener("keydown", e => {
    const ds = sg.querySelectorAll("div");

    if (e.key === "ArrowDown") sel = Math.min(sel + 1, ds.length - 1);
    else if (e.key === "ArrowUp") sel = Math.max(sel - 1, 0);
    else if (e.key === "Enter") {
      e.preventDefault();
      sel >= 0 && cur[sel] ? pick(cur[sel]) : search(q.value);
      return;
    } else return;

    e.preventDefault();
    ds.forEach((d, n) => d.classList.toggle("sel", n === sel));
  });
}

function pick(s) {
  if (s.i !== undefined) showItem(s.i);
  else search(s.l);
}

function search(text) {
  text = (text || "").trim();
  if (!text) return;

  const s = suggestions(text);
  const direct = s.find(x => x.i !== undefined);
  if (direct) return showItem(direct.i);

  const pt = s.find(x => x.part);
  if (pt) {
    const it = ITEMS.findIndex(i => i.p === pt.part);
    if (it >= 0) return showItem(it);
  }

  aiSearch(text);
}

function showItem(i) {
  const it = ITEMS[i];
  const pt = PARTS[it.p];

  result({
    title: it.t,
    part: pt.name,
    partKey: it.p,
    causes: it.causes,
    hints: it.k + " " + it.t + " " + pt.name,
    videos: [
      { t: "Como diagnosticar: " + it.t, u: ytLink(it.q), s: "YouTube" },
      { t: "Mesma peça em outros ônibus/carros", u: ytLink(pt.name + " " + it.t + " passo a passo"), s: "YouTube" },
      { t: "Troca / reparo: " + pt.name, u: ytLink("como trocar " + pt.name + " ônibus"), s: "YouTube" }
    ],
    forums: [{ t: "Discussões em fóruns sobre " + it.t, u: glink(it.q + " fórum mecânica") }]
  });
}

// ============================================================
// Resultado
// ============================================================
function result(r) {
  const speak = r.title + ". Possíveis causas: " + r.causes.join(". ");

  app.innerHTML = `<p><button class="btn s" onclick="go('home')">← Nova busca</button></p>
  <div class="card"><button class="btn say" data-say="${esc(speak)}" onclick="say(this.dataset.say)">🔊 Ouvir</button><span class="tag o">${esc(r.part || "")}</span><h1 style="margin:8px 0 0">${esc(r.title)}</h1></div>
  ${r.ai ? `<div class="note">🤖 Resultado montado por IA (Cloudflare Workers AI). Confirme sempre no manual do fabricante. ${r.summary ? "<br><b>" + esc(r.summary) + "</b>" : ""}</div>` : ""}
  <div class="warn">⚠ Segurança: desligue a chave geral e solte o negativo (−) da bateria antes de mexer na parte elétrica.</div>
  <div class="card"><h2><span class="n">1</span>Possível causa</h2><ul class="c">${r.causes.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div>
  <div class="card"><h2><span class="n">2</span>Esquema elétrico da parte afetada</h2>${schematic(r.partKey || "chicote")}</div>
  <div class="card"><h2><span class="n">3</span>Vídeos</h2><div class="vg">${(r.videos || []).map(v => `<a class="vc" href="${esc(v.u)}" target="_blank" rel="noopener"><div class="vt">▶</div><div class="t">${esc(v.t)}<small>${esc(v.s || "")}</small></div></a>`).join("")}</div>
  ${(r.forums && r.forums.length) ? `<h3>💬 Fóruns e respostas específicas</h3><ul class="c">${r.forums.map(f => `<li><a href="${esc(f.u)}" target="_blank" rel="noopener">${esc(f.t)}</a></li>`).join("")}</ul>` : ""}</div>
  <div class="card"><h2><span class="n">4</span>Páginas do manual</h2><div id="pgbox"><div class="ld" style="padding:24px">Procurando nas páginas do manual…</div></div></div>`;

  window.scrollTo(0, 0);
  fillPages(r);
}

// ============================================================
// Prompt + IA
// ============================================================
function buildPrompt(text, index) {
  const partKeys = Object.keys(PARTS).join(" | ");
  const partList = Object.entries(PARTS).map(([k, p]) => `${k} = ${p.name}`).join("\n");

  return `Você é um engenheiro de manutenção elétrica de ônibus urbanos/BRT no Brasil (Mercedes-Benz, Marcopolo, Caio, Volvo, VW).

O usuário descreveu este problema (texto livre, pode estar mal escrito ou por voz):
"""${text}"""

Sua tarefa tem DUAS partes obrigatórias:

(1) DIAGNÓSTICO — Identifique o sistema/peça elétrica mais provável e liste de 3 a 5 causas curtas e simples.
(2) PÁGINAS DO MANUAL — Escolha de 3 a 5 páginas do índice abaixo que o técnico deve abrir para resolver o problema. Use EXATAMENTE o "termo" e a "pagina" que aparecem no índice (não invente termos nem páginas). Se houver várias edições, priorize o manual que mais se parece com o veículo citado; se não souber o modelo, espalhe as escolhas entre manuais.

=== ÍNDICE DOS MANUAIS ===
${index}
=== FIM DO ÍNDICE ===

Peças disponíveis (use a chave em "partKey"):
${partList}

Regras:
- Responda APENAS com um objeto JSON válido, sem markdown, sem texto antes ou depois.
- "indexPicks[].manual" deve ser o ID do manual (ex: "o500", "torino").
- "indexPicks[].termo" deve ser copiado literalmente do índice.
- "indexPicks[].pagina" deve ser um número inteiro igual ao do índice.
- Se o problema NÃO for de manutenção elétrica de ônibus, retorne {"relevant": false}.

Formato exato:
{
  "relevant": true,
  "title": "nome curto do problema (até 6 palavras)",
  "summary": "uma frase simples explicando o que provavelmente é",
  "partKey": "uma chave de: ${partKeys}",
  "causes": ["causa 1", "causa 2", "causa 3"],
  "searchTerms": ["termo técnico 1", "termo técnico 2", "termo técnico 3"],
  "indexPicks": [
    { "manual": "id-do-manual", "termo": "termo exato do índice", "pagina": 0, "motivo": "por que consultar" }
  ]
}`;
}

function extractJSON(txt) {
  if (!txt) return null;

  // 🔧 Se não for string, converte
  if (typeof txt !== "string") {
    try { txt = JSON.stringify(txt); } catch (_) { return null; }
  }

  let s = txt.replace(/```json/gi, "").replace(/```/g, "").trim();

  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return null;

  let candidate = s.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(candidate);
  } catch (_) {}

  candidate = candidate
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  try {
    return JSON.parse(candidate);
  } catch (_) {
    return null;
  }
}

// 🔧 CLOUDFLARE — chama o Worker (o token fica lá, não aqui)
async function callCloudflare(prompt) {
  const body = {
    messages: [
      {
        role: "system",
        content: "You are a bus electrical maintenance engineer. Always respond with a single valid JSON object. No markdown, no text before or after the JSON."
      },
      { role: "user", content: prompt }
    ],
    max_tokens: 2048,
    temperature: 0.2
  };

  const r = await fetch(CF_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok || data.success === false) {
    const msg = data?.errors?.[0]?.message || data?.error || `HTTP ${r.status}`;
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }

  // 🔧 Pega o texto em qualquer formato possível e GARANTE que é string
  let txt =
    data?.result?.response ??
    data?.result?.choices?.[0]?.message?.content ??
    "";

  if (typeof txt !== "string") {
    txt = JSON.stringify(txt);
  }

  // Log pra debug — remova depois que estiver funcionando
  console.log("[CF] resposta bruta:", data);
  console.log("[CF] txt (string):", txt);

  return { data, txt };
}

async function aiSearch(text) {
  app.innerHTML = `<div class="ld"><div class="sp"></div>Entendendo o problema: “${esc(text)}”…</div>`;

  await INDEX_READY;
  const index = indexSummary();
  const prompt = buildPrompt(text, index);

  let lastError = null;
  let parsed = null;

  try {
    const { txt } = await callCloudflare(prompt);
    parsed = extractJSON(txt);
    if (!parsed) lastError = new Error("Resposta não veio em JSON válido: " + (txt || "").slice(0, 200));
  } catch (e) {
    lastError = e;
  }

  if (!parsed) {
    const detail = lastError ? lastError.message : "sem resposta";
    app.innerHTML = `<p><button class="btn s" onclick="go('home')">← Nova busca</button></p><div class="card"><h2>⚠ A IA não respondeu</h2><p>Busca direta no YouTube para: <b>${esc(text)}</b></p><div class="vg"><a class="vc" href="${ytLink(text + " ônibus elétrica")}" target="_blank" rel="noopener"><div class="vt">▶</div><div class="t">Buscar no YouTube<small>${esc(text)}</small></div></a></div><div class="note">Detalhe: ${esc(detail)}</div></div>`;
    return;
  }

  if (parsed.relevant === false) {
    app.innerHTML = `<p><button class="btn s" onclick="go('home')">← Nova busca</button></p><div class="card"><h2>🤔 Não entendi</h2><p>Isso parece não ter relação com manutenção elétrica de ônibus. Tente: <b>bateria</b>, <b>porta</b>, <b>luz do painel</b>.</p></div>`;
    return;
  }

  const terms = (parsed.searchTerms && parsed.searchTerms.length) ? parsed.searchTerms : [text];
  const vids = [];
  const forums = [];

  terms.forEach(t => vids.push({ t: "Vídeos: " + t, u: ytLink(t), s: "YouTube" }));
  forums.push({ t: "Buscar em fóruns: " + terms[0], u: glink(terms[0] + " fórum") });

  const pk = PARTS[parsed.partKey] ? parsed.partKey : "chicote";

  result({
    ai: true,
    title: parsed.title || text,
    summary: parsed.summary,
    part: PARTS[pk].name,
    partKey: pk,
    causes: Array.isArray(parsed.causes) && parsed.causes.length ? parsed.causes : ["Verifique o sistema elétrico relacionado ao sintoma descrito."],
    aiPicks: Array.isArray(parsed.indexPicks) ? parsed.indexPicks : [],
    hints: (parsed.title || "") + " " + terms.join(" ") + " " + text,
    videos: vids.slice(0, 6),
    forums: forums.slice(0, 5)
  });
}

// ============================================================
// Navegação
// ============================================================
function go(p) {
  document.querySelectorAll("nav a").forEach(a => a.classList.remove("on"));
  const navItem = $("#n-" + p);
  if (navItem) navItem.classList.add("on");

  if (p === "about") {
    app.innerHTML = `<div class="card about"><h1>Quem somos</h1><p>Somos uma empresa criada com a intenção primária na área da segurança nos transportes públicos, seja de modo prevencional e imediata. Nosso site foi idealizado considerando que muitos trabalhadores na área da manutenção lidam com os mais diversos modelos. Por isso, decidimos focar na parte elétrica, desenvolvendo um manual de manutenção intuitivo para auxiliar no diagnóstico do dia a dia.</p></div>`;
  } else {
    renderHome();
  }

  window.scrollTo(0, 0);
}

function mic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const b = $("#mic");
  const q = $("#q");

  if (!SR) {
    q.value = "";
    q.placeholder = "Sem microfone neste navegador. Use o Chrome.";
    return;
  }

  if (listening) { rec.stop(); return; }

  rec = new SR();
  rec.lang = "pt-BR";
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onstart = () => {
    listening = true;
    b.classList.add("rec");
    q.value = "";
    q.placeholder = "Ouvindo… fale agora";
  };

  rec.onresult = e => {
    let t = "";
    for (const r of e.results) t += r[0].transcript;
    q.value = t;
    q.dispatchEvent(new Event("input"));
    if (e.results[e.results.length - 1].isFinal) setTimeout(() => search(t), 400);
  };

  rec.onerror = e => {
    q.placeholder = e.error === "not-allowed" ? "Permita o microfone no navegador" : "Não consegui ouvir. Tente de novo";
  };

  rec.onend = () => {
    listening = false;
    b.classList.remove("rec");
  };

  rec.start();
}

document.addEventListener("click", e => {
  const sg = $("#sg");
  if (sg && !e.target.closest(".sb")) sg.hidden = true;
});

go("home");
