// Cadastra, lista ou apaga o webhook do ClickUp que mantém o portal atualizado.
//   npm run webhook -- criar https://aprovetrato.com.br
//   npm run webhook -- listar
//   npm run webhook -- apagar <idDoWebhook>
// O segredo do webhook aparece UMA vez, na criação. Este script grava em .env.production.local
// (fora do git) e não mostra na tela.
import { appendFile } from "node:fs/promises";

const TOKEN = process.env.CLICKUP_API_TOKEN;
const TEAM = process.env.CLICKUP_TEAM_ID || "9010127467";
const PASTA = process.env.CLICKUP_SOCIAL_MEDIA_FOLDER_ID || "901318383354";
const API = "https://api.clickup.com/api/v2";

if (!TOKEN) {
  console.error("Falta CLICKUP_API_TOKEN (rode pelo npm: ele lê o .env.local).");
  process.exit(1);
}
const h = { Authorization: TOKEN, "Content-Type": "application/json" };
const [, , cmd = "listar", arg] = process.argv;

if (cmd === "listar") {
  const r = await (await fetch(`${API}/team/${TEAM}/webhook`, { headers: h })).json();
  for (const w of r.webhooks ?? []) console.log(`${w.id}  ${w.endpoint}  [${w.events.join(", ")}]  saúde: ${w.health?.status}`);
  if (!r.webhooks?.length) console.log("Nenhum webhook cadastrado.");
} else if (cmd === "criar") {
  if (!/^https:\/\//.test(arg ?? "")) {
    console.error("Uso: npm run webhook -- criar https://seu-endereco");
    process.exit(1);
  }
  const res = await fetch(`${API}/team/${TEAM}/webhook`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      endpoint: `${arg.replace(/\/$/, "")}/api/clickup-webhook`,
      events: ["taskStatusUpdated", "taskUpdated", "taskCommentPosted"],
      folder_id: PASTA,
    }),
  });
  const r = await res.json();
  if (!res.ok) {
    console.error("Não foi possível criar:", JSON.stringify(r));
    process.exit(1);
  }
  await appendFile(".env.production.local", `CLICKUP_WEBHOOK_SECRET=${r.webhook.secret}\n`);
  console.log(`Webhook ${r.id} criado para ${r.webhook.endpoint}.\nO segredo foi salvo em .env.production.local (não vai para o git).`);
} else if (cmd === "apagar") {
  const res = await fetch(`${API}/webhook/${arg}`, { method: "DELETE", headers: h });
  console.log(res.ok ? "Webhook apagado." : `Falhou: ${res.status}`);
} else {
  console.error("Comandos: criar <url> | listar | apagar <id>");
  process.exit(1);
}
