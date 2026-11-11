// Etapa 1: leitura da estrutura do ClickUp. SOMENTE LEITURA, não altera nada.
// Uso: node --env-file=.env.local scripts/etapa1-explorar.mjs
import { mkdir, writeFile } from "node:fs/promises";

const TOKEN = process.env.CLICKUP_API_TOKEN;
const FOLDER_ID = process.env.CLICKUP_SOCIAL_MEDIA_FOLDER_ID || "901318383354";
const SAMPLE_TASK = process.env.CLICKUP_SAMPLE_TASK_ID || "17tqamexhbg";
const API = "https://api.clickup.com/api/v2";

if (!TOKEN || !TOKEN.startsWith("pk_")) {
  console.error("Falta CLICKUP_API_TOKEN no .env.local (o token começa com pk_).");
  process.exit(1);
}

const STATUS_ESPERADOS = [
  "stand-by", "gravar", "criar copy", "editar vídeo", "criar layout",
  "ajuste", "em aprovação (cliente)", "aprovado", "publicado", "finalizado",
];

async function get(path) {
  const res = await fetch(API + path, { headers: { Authorization: TOKEN } });
  if (!res.ok) throw new Error(`${res.status} em ${path}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const fmtData = (ms) => (ms ? new Date(Number(ms)).toLocaleDateString("pt-BR") : "—");
const out = [];
const say = (s = "") => { out.push(s); console.log(s); };

const pasta = await get(`/folder/${FOLDER_ID}`);
say(`# Etapa 1: pasta "${pasta.name}" (${pasta.lists.length} listas)\n`);

const raw = { pasta, listas: [], amostra: {} };

for (const l of pasta.lists) {
  const lista = await get(`/list/${l.id}`);
  const campos = (await get(`/list/${l.id}/field`)).fields ?? [];
  const tasks = [];
  for (let page = 0; ; page++) {
    const r = await get(`/list/${l.id}/task?include_closed=true&subtasks=true&page=${page}`);
    tasks.push(...r.tasks);
    if (r.last_page || r.tasks.length === 0) break;
  }

  const statusLista = lista.statuses.map((s) => s.status.toLowerCase());
  const faltando = STATUS_ESPERADOS.filter((s) => !statusLista.includes(s));
  const porStatus = {};
  for (const t of tasks) porStatus[t.status.status] = (porStatus[t.status.status] ?? 0) + 1;

  say(`## ${l.name}  (id ${l.id})`);
  say(`- tasks: ${tasks.length} | por status: ${JSON.stringify(porStatus)}`);
  say(`- status que faltam na lista: ${faltando.length ? faltando.join(", ") : "nenhum"}`);
  say(`- campos personalizados: ${campos.map((c) => `${c.name} (${c.type})`).join(", ") || "nenhum"}`);

  const campoData = campos.find((c) => c.name.trim().toLowerCase() === "data de publicação");
  const aprov = tasks.filter((t) => t.status.status.toLowerCase() === "em aprovação (cliente)");
  for (const t of aprov) {
    const pub = campoData ? t.custom_fields?.find((f) => f.id === campoData.id)?.value : null;
    say(`  - [aprovação] ${t.name} | vencimento ${fmtData(t.due_date)} | publicação ${fmtData(pub)} | tags: ${t.tags.map((x) => x.name).join(", ") || "—"}`);
  }
  say();
  raw.listas.push({ id: l.id, name: l.name, statuses: lista.statuses, campos, totalTasks: tasks.length });
}

// Teste crítico: a API devolve os arquivos anexados em comentários?
say(`## Amostra: task ${SAMPLE_TASK}`);
const task = await get(`/task/${SAMPLE_TASK}`);
const comentarios = await get(`/task/${SAMPLE_TASK}/comment`);
say(`- anexos da task: ${task.attachments?.length ?? 0}`);
for (const a of task.attachments ?? []) say(`  - ${a.title} | ${a.mimetype ?? a.extension} | url: ${a.url ? "sim" : "não"}`);
say(`- comentários: ${comentarios.comments.length}`);
for (const c of comentarios.comments) {
  const partes = Array.isArray(c.comment) ? c.comment : [];
  const anexos = partes.filter((p) => p.type === "attachment" || p.attachment);
  say(`  - ${c.user?.username} | ${fmtData(c.date)} | partes: ${partes.length} | anexos no comentário: ${anexos.length} | texto: ${(c.comment_text ?? "").slice(0, 60).replace(/\n/g, " ")}`);
}
raw.amostra = { task, comentarios };

await mkdir(".data", { recursive: true });
await mkdir("relatorios", { recursive: true });
await writeFile(".data/etapa1-bruto.json", JSON.stringify(raw, null, 2));
await writeFile("relatorios/etapa1.md", out.join("\n"));
say("\nRelatório salvo em relatorios/etapa1.md (dados brutos em .data/, fora do git).");
