// Teste de isolamento entre clientes, contra o portal já rodando (npm run build && npm start).
// Só LÊ o ClickUp e só tenta ações que o portal precisa BLOQUEAR. Não aprova nada de ninguém.
//   node --env-file=.env.local scripts/etapa4-isolamento.mjs [urlBase]
import { readFile } from "node:fs/promises";

const BASE = process.argv[2] || "http://localhost:3100";
const TOKEN = process.env.CLICKUP_API_TOKEN;
const TASK_DE_TESTE = process.env.TASK_DE_TESTE || "17tqamf3j53"; // "TESTE PORTAL", na lista da Trato

let falhas = 0;
const ok = (cond, msg) => {
  if (!cond) falhas++;
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
};

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// --- cadastro ---
const fonte = await readFile("src/lib/clients.ts", "utf8");
const clientes = [...fonte.matchAll(/slug: "([^"]+)", nome: "([^"]+)", listaId: "(\d+)"/g)].map((m) => ({ slug: m[1], nome: m[2], listaId: m[3] }));

// --- ids de tasks de cada lista (verdade do ClickUp) ---
const idsPorLista = {};
for (const c of clientes) {
  const ids = new Set();
  for (let p = 0; p < 5; p++) {
    const r = await (await fetch(`https://api.clickup.com/api/v2/list/${c.listaId}/task?include_closed=true&subtasks=true&page=${p}`, { headers: { Authorization: TOKEN } })).json();
    r.tasks.forEach((t) => ids.add(t.id));
    if (r.last_page || !r.tasks.length) break;
  }
  idsPorLista[c.listaId] = ids;
}

// --- 1. cada página só contém tasks da própria lista ---
console.log("\n1. Páginas: cada cliente só enxerga a própria lista");
const mesAtual = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }).slice(0, 7);
const mesAnterior = (() => { const [a, m] = mesAtual.split("-").map(Number); const d = new Date(Date.UTC(a, m - 2, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; })();
let idsVistos = 0;
let vazou = false;
for (const c of clientes) {
  for (const mes of [mesAtual, mesAnterior]) {
    await espera(5000); // o ClickUp aceita ~100 chamadas por minuto: vai com calma
    const res = await fetch(`${BASE}/c/${c.slug}?mes=${mes}`);
    const html = await res.text();
    if (res.status !== 200) { ok(false, `${c.nome} ${mes}: HTTP ${res.status}`); continue; }
    const ids = new Set([...html.matchAll(/\\?"id\\?":\\?"([a-z0-9]{7,11})\\?"/g)].map((m) => m[1]));
    for (const id of ids) {
      const dono = clientes.find((x) => idsPorLista[x.listaId].has(id));
      if (!dono) continue; // id de outra coisa (mensagem de conversa, etc.)
      idsVistos++;
      if (dono.slug !== c.slug) { vazou = true; ok(false, `${c.nome} ${mes}: task ${id} pertence a ${dono.nome}`); }
    }
    ok(!/pk_\d+_/.test(html), `${c.nome} ${mes}: nenhum token do ClickUp no HTML`);
    ok(!/app\.clickup\.com\/t\//.test(html), `${c.nome} ${mes}: nenhum link interno do ClickUp no HTML`);
  }
}
ok(!vazou, `nenhuma task de outro cliente apareceu (${idsVistos} tasks conferidas)`);
ok(idsVistos > 0, "o teste viu tasks de verdade (não passou em branco)");

// --- 2. links inválidos ---
console.log("\n2. Links inválidos e rotas internas");
const primeiro = clientes[0].slug;
for (const [caminho, esperado] of [
  ["/c/inexistente-aaaaaa", 404],
  ["/c/" + primeiro.toUpperCase(), 404],
  ["/c/" + primeiro.slice(0, -1), 404],
  ["/c/trato", 404],
  ["/c/", 404],
  ["/demo", 404],
]) {
  const r = await fetch(BASE + caminho);
  ok(r.status === esperado, `${caminho} → ${r.status} (esperado ${esperado})`);
}
const cab = (await fetch(`${BASE}/c/${primeiro}`)).headers;
ok(/noindex/.test(cab.get("x-robots-tag") ?? ""), "cabeçalho noindex presente (buscadores não indexam)");

// --- 3. ações entre clientes são bloqueadas no servidor ---
console.log("\n3. Ações: um link não consegue mexer em post de outro cliente");
const manifesto = JSON.parse(await readFile(".next/server/server-reference-manifest.json", "utf8")).node;
const idAcao = (nome) => Object.entries(manifesto).find(([, v]) => v.exportedName === nome)?.[0];

async function chamar(nome, args) {
  await espera(1500);
  const id = idAcao(nome);
  if (!id) throw new Error(`ação ${nome} não encontrada no manifesto (rode npm run build)`);
  const r = await fetch(`${BASE}/c/${primeiro}`, {
    method: "POST",
    headers: { "Next-Action": id, "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component" },
    body: JSON.stringify(args),
  });
  return r.text();
}

const trato = clientes.find((c) => c.nome === "Trato");
const outros = clientes.filter((c) => c.nome !== "Trato");
ok(idsPorLista[trato.listaId].has(TASK_DE_TESTE), "a task de teste está mesmo na lista da Trato");
const alvoOutro = [...idsPorLista[outros[0].listaId]][0];

for (const o of outros.slice(0, 3)) {
  for (const [nome, args] of [
    ["aprovarPost", [o.slug, TASK_DE_TESTE]],
    ["comentarPost", [o.slug, TASK_DE_TESTE, "teste de isolamento (não deve chegar)"]],
    ["pedirAjuste", [o.slug, TASK_DE_TESTE, ["Arte"], "teste de isolamento (não deve chegar)"]],
  ]) {
    const corpo = await chamar(nome, args);
    ok(/Post não encontrado/.test(corpo), `${nome} com o link de ${o.nome} numa task da Trato → bloqueado`);
  }
}
const c1 = await chamar("aprovarPost", [trato.slug, alvoOutro]);
ok(/Post não encontrado/.test(c1), `aprovarPost com o link da Trato numa task de ${outros[0].nome} → bloqueado`);
const c2 = await chamar("aprovarPost", ["inexistente-aaaaaa", TASK_DE_TESTE]);
ok(/Post não encontrado/.test(c2), "aprovarPost com link inexistente → bloqueado");
const c3 = await chamar("aprovarPost", [trato.slug, "../../list/1"]);
ok(/Post não encontrado/.test(c3), "id de task malformado → bloqueado");

console.log(`\n${falhas === 0 ? "TUDO CERTO" : falhas + " FALHA(S)"}`);
process.exit(falhas ? 1 : 0);
