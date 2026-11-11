// Gerencia o cadastro de clientes (src/lib/clients.ts).
//   npm run clientes                       lista os clientes, confere cada lista no ClickUp e mostra os links
//   npm run clientes -- novo "Nome" <idDaLista> [arquivoDaLogo]
//   npm run clientes -- remover <slug-ou-nome>
import { randomInt } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const ARQ = "src/lib/clients.ts";
const BASE = process.env.PORTAL_URL || "https://aprovetrato.netlify.app";
const TOKEN = process.env.CLICKUP_API_TOKEN;
const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789"; // sem letras que se confundem (i, l, o, 0, 1)

const LINHA = /^\s*\{ slug: "([^"]+)", nome: "([^"]+)", listaId: "(\d+)", logo: "([^"]+)" \},\s*$/;

const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slugDe = (nome) => `${semAcento(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("")}`;

async function ler() {
  const texto = await readFile(ARQ, "utf8");
  const linhas = texto.split("\n");
  const clientes = linhas.map((l, i) => ({ m: l.match(LINHA), i })).filter((x) => x.m)
    .map(({ m, i }) => ({ slug: m[1], nome: m[2], listaId: m[3], logo: m[4], linha: i }));
  return { linhas, clientes };
}

async function lista(id) {
  const res = await fetch(`https://api.clickup.com/api/v2/list/${id}`, { headers: { Authorization: TOKEN } });
  return res.ok ? res.json() : null;
}

function exigirToken() {
  if (!TOKEN) {
    console.error("Falta CLICKUP_API_TOKEN (rode pelo npm: ele lê o .env.local).");
    process.exit(1);
  }
}

const [, , cmd = "listar", ...args] = process.argv;
const { linhas, clientes } = await ler();

if (cmd === "listar") {
  exigirToken();
  let problemas = 0;
  const slugs = new Set();
  const listas = new Set();
  for (const c of clientes) {
    const l = await lista(c.listaId);
    const avisos = [];
    if (!l) avisos.push("lista NÃO encontrada no ClickUp");
    else if (semAcento(l.name) !== semAcento(c.nome)) avisos.push(`nome da lista no ClickUp é "${l.name}"`);
    if (!existsSync(`public${c.logo}`)) avisos.push(`logo ausente (public${c.logo})`);
    if (slugs.has(c.slug)) avisos.push("slug repetido");
    if (listas.has(c.listaId)) avisos.push("lista repetida em outro cliente");
    if (!/-[a-km-np-z2-9]{6}$/.test(c.slug)) avisos.push("slug sem sufixo aleatório de 6 caracteres");
    slugs.add(c.slug);
    listas.add(c.listaId);
    problemas += avisos.length;
    console.log(`${avisos.length ? "⚠" : "✓"} ${c.nome.padEnd(10)} ${BASE}/c/${c.slug}${avisos.length ? "\n    " + avisos.join("\n    ") : ""}`);
  }
  console.log(`\n${clientes.length} clientes, ${problemas} problema(s).`);
  process.exit(problemas ? 1 : 0);
}

if (cmd === "novo") {
  exigirToken();
  const [nome, listaId, logoArg] = args;
  if (!nome || !/^\d+$/.test(listaId ?? "")) {
    console.error('Uso: npm run clientes -- novo "Nome" <idDaLista> [arquivoDaLogo]');
    process.exit(1);
  }
  if (clientes.some((c) => c.listaId === listaId || semAcento(c.nome) === semAcento(nome))) {
    console.error("Já existe um cliente com esse nome ou essa lista.");
    process.exit(1);
  }
  const l = await lista(listaId);
  if (!l) {
    console.error("Não achei essa lista no ClickUp. Confira o ID (fica na URL da lista).");
    process.exit(1);
  }
  const logo = logoArg ? (logoArg.startsWith("/") ? logoArg : `/logos/${logoArg}`) : `/logos/${semAcento(nome).replace(/[^a-z0-9]+/g, "-")}.png`;
  const novo = { slug: slugDe(nome), nome, listaId, logo };
  const texto = `  { slug: "${novo.slug}", nome: "${novo.nome}", listaId: "${novo.listaId}", logo: "${novo.logo}" },`;
  const fim = linhas.findIndex((x) => x.trim() === "];");
  linhas.splice(fim, 0, texto);
  await writeFile(ARQ, linhas.join("\n"));
  console.log(`Cliente "${nome}" cadastrado (lista "${l.name}").\nLink: ${BASE}/c/${novo.slug}`);
  if (!existsSync(`public${logo}`)) console.log(`Falta colocar a logo em public${logo} (imagem quadrada, de preferência 480x480).`);
  process.exit(0);
}

if (cmd === "remover") {
  const alvo = semAcento(args[0] ?? "");
  const achado = clientes.find((c) => c.slug === args[0] || semAcento(c.nome) === alvo);
  if (!achado) {
    console.error("Cliente não encontrado. Rode `npm run clientes` para ver a lista.");
    process.exit(1);
  }
  linhas.splice(achado.linha, 1);
  await writeFile(ARQ, linhas.join("\n"));
  console.log(`Cliente "${achado.nome}" removido. O link deixa de funcionar no próximo deploy.`);
  process.exit(0);
}

console.error(`Comando desconhecido: ${cmd}`);
process.exit(1);
