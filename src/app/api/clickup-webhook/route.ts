import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CLIENTES } from "@/lib/clients";
import { obterTask, tagLista, tagTask } from "@/lib/clickup";

// Recebe os avisos do ClickUp (status mudou, task editada, comentário novo) e limpa o cache da
// task e da lista na hora, para o portal mostrar a mudança sem esperar o cache vencer.
// Sem o segredo certo na assinatura, a chamada é recusada.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const segredo = process.env.CLICKUP_WEBHOOK_SECRET;
  if (!segredo) return new Response("webhook não configurado", { status: 503 });

  const corpo = await req.text();
  const recebida = req.headers.get("x-signature") ?? "";
  const esperada = createHmac("sha256", segredo).update(corpo).digest("hex");
  const a = Buffer.from(recebida);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response("assinatura inválida", { status: 401 });

  let taskId: unknown;
  try {
    taskId = (JSON.parse(corpo) as { task_id?: unknown }).task_id;
  } catch {
    return new Response("corpo inválido", { status: 400 });
  }

  if (typeof taskId === "string" && /^[a-z0-9]{6,20}$/i.test(taskId)) {
    revalidateTag(tagTask(taskId), { expire: 0 });
    try {
      // O aviso não diz de qual lista é a task; uma consulta resolve e ignora o que não é de cliente.
      const task = await obterTask(taskId);
      if (CLIENTES.some((c) => c.listaId === task.list.id)) revalidateTag(tagLista(task.list.id), { expire: 0 });
    } catch {
      /* task apagada ou ClickUp ocupado: o cache curto resolve em até 30 s */
    }
  }
  return Response.json({ ok: true });
}
