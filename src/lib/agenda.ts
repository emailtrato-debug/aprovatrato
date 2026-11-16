import "server-only";
import ICAL from "ical.js";
import type { Cliente } from "./clients";
import type { ReuniaoResumo } from "./types";

// "Nossa próxima reunião é...": lê a agenda do Google da Trato pelo endereço secreto no formato iCal
// (Google Agenda › Configurações da agenda › "Endereço secreto no formato iCal"), guardado em AGENDA_ICS_URL.
//
// Padrão de título da agenda: "Reunião | Trato x <Cliente>" (ex.: "Reunião | Trato x AABB").
// Só entra no portal do cliente o evento com esse padrão E o nome do cliente depois do "x". Qualquer outro
// título (reunião interna, de outro cliente, sem o padrão) é ignorado. A lógica não diferencia maiúsculas,
// acentos nem "x"/"×", e aceita um complemento depois do nome ("Reunião | Trato x AABB | pauta de dezembro").
// Só título, horário e link da chamada saem daqui: descrição, convidados e demais detalhes nunca chegam ao navegador.

export type Reuniao = ReuniaoResumo;

const FUSO = "America/Sao_Paulo";
const JANELA_DIAS = 120;
const MAX_OCORRENCIAS = 400;
/** "Reunião | Trato x <resto>": o resto começa pelo nome do cliente. */
const TITULO_PADRAO = /^\s*reuni[aã]o\s*[|\-–:]\s*trato\s*[x×]\s*(.+?)\s*$/i;

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** O título segue o padrão "Reunião | Trato x <Cliente>" e o cliente é este (o nome vem logo depois do "x"). */
export function tituloDoCliente(titulo: string, cliente: Pick<Cliente, "nome">): boolean {
  const m = titulo.match(TITULO_PADRAO);
  if (!m) return false;
  return new RegExp(`^${escapar(sem(cliente.nome))}($|[^a-z0-9])`).test(sem(m[1]));
}

const diaDe = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(d); // AAAA-MM-DD

function hora(d: Date): string {
  const p = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "numeric", minute: "2-digit", hour12: false }).formatToParts(d);
  const h = p.find((x) => x.type === "hour")?.value ?? "";
  const m = p.find((x) => x.type === "minute")?.value ?? "00";
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export function descreverQuando(inicio: Date, diaInteiro: boolean, agora = new Date()): string {
  const dia = diaDe(inicio);
  const hoje = diaDe(agora);
  const amanha = diaDe(new Date(agora.getTime() + 24 * 60 * 60 * 1000));
  const horario = diaInteiro ? "" : ` às ${hora(inicio)}`;
  if (dia === hoje) return `hoje${horario}`;
  if (dia === amanha) return `amanhã${horario}`;
  const semana = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long" }).format(inicio).replace("-feira", "");
  const [, mes, d] = dia.split("-");
  return `${semana}, ${d}/${mes}${horario}`;
}

function linkDaChamada(ev: ICAL.Component): string | null {
  const candidatos = [ev.getFirstPropertyValue("x-google-conference"), ev.getFirstPropertyValue("location"), ev.getFirstPropertyValue("url")];
  for (const c of candidatos) {
    const t = typeof c === "string" ? c.trim() : "";
    if (/^https:\/\/\S+$/.test(t)) return t;
  }
  return null;
}

type Candidata = { inicio: Date; diaInteiro: boolean; link: string | null };

/** Próxima ocorrência de um evento (simples ou recorrente) que ainda não terminou. */
function proximaOcorrencia(componente: ICAL.Component, excecoes: ICAL.Component[], agora: Date): Candidata | null {
  const ev = new ICAL.Event(componente);
  for (const e of excecoes) ev.relateException(new ICAL.Event(e));
  const link = linkDaChamada(componente);
  const limite = agora.getTime() + JANELA_DIAS * 24 * 60 * 60 * 1000;

  // Evento de dia inteiro não tem horário nem fuso: usa o dia do calendário, sem deixar o fuso do servidor
  // (UTC na Cloudflare) empurrar a data para o dia anterior. 15h UTC = meio-dia em São Paulo.
  const diaDoCalendario = (t: ICAL.Time, hora: number) => new Date(Date.UTC(t.year, t.month - 1, t.day, hora));

  const avaliar = (inicioIcal: ICAL.Time, fimIcal: ICAL.Time | null): Candidata | null => {
    const inicio = inicioIcal.isDate ? diaDoCalendario(inicioIcal, 15) : inicioIcal.toJSDate();
    // O fim de um evento de dia inteiro é o dia seguinte (exclusivo): vale até a meia-noite de São Paulo (03h UTC).
    const fim = !fimIcal ? inicio : fimIcal.isDate ? diaDoCalendario(fimIcal, 3) : fimIcal.toJSDate();
    if (fim.getTime() < agora.getTime()) return null;
    if (inicio.getTime() > limite) return null;
    return { inicio, diaInteiro: inicioIcal.isDate, link };
  };

  if (!ev.isRecurring()) return avaliar(ev.startDate, ev.endDate);

  const it = ev.iterator();
  for (let i = 0; i < MAX_OCORRENCIAS; i++) {
    const proxima = it.next();
    if (!proxima) return null;
    const det = ev.getOccurrenceDetails(proxima);
    if (det.startDate.toJSDate().getTime() > limite) return null;
    const c = avaliar(det.startDate, det.endDate);
    if (c) return c;
  }
  return null;
}

/** Lê o texto iCal e devolve a próxima reunião do cliente. Separado do download para poder ser testado. */
export function proximaReuniaoNoIcs(texto: string, cliente: Pick<Cliente, "nome">, agora = new Date()): (Reuniao & { inicio: number }) | null {
  const raiz = new ICAL.Component(ICAL.parse(texto));
  const eventos = raiz.getAllSubcomponents("vevent");

  // Remarcações de uma ocorrência (RECURRENCE-ID) ficam presas ao evento original (mesmo UID).
  const excecoes = new Map<string, ICAL.Component[]>();
  const principais: ICAL.Component[] = [];
  for (const e of eventos) {
    if (String(e.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED") continue;
    if (e.hasProperty("recurrence-id")) {
      const uid = String(e.getFirstPropertyValue("uid"));
      excecoes.set(uid, [...(excecoes.get(uid) ?? []), e]);
    } else {
      principais.push(e);
    }
  }

  let melhor: Candidata | null = null;
  for (const e of principais) {
    const titulo = String(e.getFirstPropertyValue("summary") ?? "");
    if (!tituloDoCliente(titulo, cliente)) continue;
    try {
      const c = proximaOcorrencia(e, excecoes.get(String(e.getFirstPropertyValue("uid"))) ?? [], agora);
      if (c && (!melhor || c.inicio < melhor.inicio)) melhor = c;
    } catch (erro) {
      console.error("[agenda] evento ignorado:", erro instanceof Error ? erro.message : erro);
    }
  }
  return melhor
    ? { quando: descreverQuando(melhor.inicio, melhor.diaInteiro, agora), link: melhor.link, inicio: melhor.inicio.getTime() }
    : null;
}

/** Endereços iCal configurados: pode haver mais de uma agenda (uma por pessoa), separadas por espaço, vírgula ou quebra de linha. */
function enderecosDaAgenda(): string[] {
  return (process.env.AGENDA_ICS_URL ?? "")
    .split(/[\s,]+/)
    .filter(Boolean)
    // https sempre; http só em localhost, para testar com um arquivo local durante o desenvolvimento.
    .filter((u) => /^https:\/\//.test(u) || (process.env.NODE_ENV !== "production" && /^http:\/\/localhost[:/]/.test(u)));
}

/** Próxima reunião marcada com este cliente em qualquer das agendas. Sem agenda configurada (ou com falha), devolve null e o portal segue normal. */
export async function proximaReuniao(cliente: Cliente): Promise<Reuniao | null> {
  const lidas = await Promise.all(
    enderecosDaAgenda().map(async (url) => {
      try {
        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) throw new Error(`agenda respondeu ${res.status}`);
        return proximaReuniaoNoIcs(await res.text(), cliente);
      } catch (e) {
        console.error("[agenda] falha ao ler uma agenda:", e instanceof Error ? e.message : e);
        return null;
      }
    }),
  );
  const primeira = lidas.filter((r) => r !== null).sort((a, b) => a.inicio - b.inicio)[0];
  return primeira ? { quando: primeira.quando, link: primeira.link } : null;
}
