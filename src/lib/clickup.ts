import "server-only";

// Cliente mínimo da API v2 do ClickUp. O token vive só no servidor (variável de ambiente)
// e nunca é enviado ao navegador.

const API = "https://api.clickup.com/api/v2";

export type CuTask = {
  id: string;
  name: string;
  status: { status: string };
  text_content?: string;
  description?: string;
  tags: { name: string }[];
  custom_fields?: { id: string; name: string; value?: string | number | null }[];
};

export type CuTaskResumo = {
  id: string;
  name: string;
  status: { status: string };
  list: { id: string };
  assignees?: { id: number; username?: string }[];
};

export type CuComentario = {
  id: string;
  comment: Record<string, unknown>[];
  comment_text: string;
  date: string;
  user?: { id: number; username?: string };
};

export const tagLista = (listaId: string) => `lista:${listaId}`;
export const tagTask = (taskId: string) => `task:${taskId}`;

function token(): string {
  const t = process.env.CLICKUP_API_TOKEN;
  if (!t) throw new Error("CLICKUP_API_TOKEN não configurado");
  return t;
}

type Opcoes = {
  /** Segundos de cache. Omitido = sem cache (sempre dado fresco). */
  revalidar?: number;
  tags?: string[];
  metodo?: "GET" | "PUT" | "POST";
  corpo?: unknown;
};

async function chamar<T>(caminho: string, op: Opcoes = {}): Promise<T> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const res = await fetch(API + caminho, {
      method: op.metodo ?? "GET",
      headers: { Authorization: token(), ...(op.corpo ? { "Content-Type": "application/json" } : {}) },
      body: op.corpo ? JSON.stringify(op.corpo) : undefined,
      ...(op.revalidar ? { next: { revalidate: op.revalidar, tags: op.tags } } : { cache: "no-store" as const }),
    });
    if (res.status === 429) {
      // Respeita o aviso do ClickUp de quando a janela de 1 minuto reinicia (máx. 8 s de espera).
      const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
      const espera = reset > Date.now() ? Math.min(reset - Date.now() + 200, 8000) : 1500 * (tentativa + 1);
      await new Promise((r) => setTimeout(r, espera));
      continue;
    }
    if (!res.ok) throw new Error(`ClickUp ${res.status} em ${op.metodo ?? "GET"} ${caminho.split("?")[0]}`);
    return res.json() as Promise<T>;
  }
  throw new Error("ClickUp: limite de requisições excedido");
}

/** Todas as tasks da lista (inclusive publicadas e finalizadas). Cache curto de 30 s. */
export async function listarTasks(listaId: string): Promise<CuTask[]> {
  const todas: CuTask[] = [];
  for (let pagina = 0; pagina < 10; pagina++) {
    const r = await chamar<{ tasks: CuTask[]; last_page?: boolean }>(
      `/list/${listaId}/task?include_closed=true&subtasks=true&page=${pagina}`,
      { revalidar: 30, tags: [tagLista(listaId)] },
    );
    todas.push(...r.tasks);
    if (r.last_page || r.tasks.length === 0) break;
  }
  return todas;
}

/**
 * Comentários da task. O ClickUp limita a ~100 chamadas por minuto, então o cache é generoso:
 * posts em andamento 90 s; posts já publicados (quase nunca mudam) 30 min.
 * Toda ação do cliente limpa o cache da task (updateTag), então nada fica velho depois de agir.
 */
export async function listarComentarios(taskId: string, publicado = false): Promise<CuComentario[]> {
  const r = await chamar<{ comments: CuComentario[] }>(`/task/${taskId}/comment`, {
    revalidar: publicado ? 1800 : 90,
    tags: [tagTask(taskId)],
  });
  return r.comments;
}

// ----------------------------- leitura fresca + escrita -----------------------------

/** Comentários sem cache: usados para conferir a arte logo antes de uma ação do cliente. */
export async function comentariosSemCache(taskId: string): Promise<CuComentario[]> {
  return (await chamar<{ comments: CuComentario[] }>(`/task/${encodeURIComponent(taskId)}/comment`)).comments;
}

/** Task sem cache: usada para conferir lista e status logo antes de qualquer ação. */
export function obterTask(taskId: string): Promise<CuTaskResumo> {
  return chamar<CuTaskResumo>(`/task/${encodeURIComponent(taskId)}`);
}

/** Nomes dos status configurados na lista (cache de 5 min). */
export async function statusDaLista(listaId: string): Promise<string[]> {
  const r = await chamar<{ statuses: { status: string }[] }>(`/list/${listaId}`, { revalidar: 300 });
  return r.statuses.map((s) => s.status);
}

export function atualizarStatus(taskId: string, status: string) {
  return chamar<unknown>(`/task/${encodeURIComponent(taskId)}`, { metodo: "PUT", corpo: { status } });
}

/** Troca os responsáveis da task: coloca `add` e tira `rem`. */
export function atualizarResponsaveis(taskId: string, add: number[], rem: number[]) {
  return chamar<unknown>(`/task/${encodeURIComponent(taskId)}`, { metodo: "PUT", corpo: { assignees: { add, rem } } });
}

/**
 * Cria um comentário na task. Com `mencionar`, o comentário marca (@) essas pessoas, no fim da
 * primeira linha: "<cabeçalho> @Fulano @Ciclana\n<corpo>". O ClickUp avisa quem foi marcado.
 */
export function criarComentario(taskId: string, cabecalho: string, corpo: string, mencionar: number[] = []) {
  const caminho = `/task/${encodeURIComponent(taskId)}/comment`;
  if (mencionar.length === 0) {
    return chamar<{ id: string | number }>(caminho, {
      metodo: "POST",
      corpo: { comment_text: `${cabecalho}\n${corpo}`, notify_all: true },
    });
  }
  const marcas = mencionar.flatMap((id) => [{ text: " " }, { type: "tag", user: { id } }]);
  return chamar<{ id: string | number }>(caminho, {
    metodo: "POST",
    corpo: { comment: [{ text: cabecalho }, ...marcas, { text: `\n${corpo}` }], notify_all: true },
  });
}
