const TZ = "America/Sao_Paulo";

export const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "AAAA-MM-DD" no fuso de São Paulo a partir de um timestamp em milissegundos. */
export function dataISO(ms: number | string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date(Number(ms)));
}

export function mesAtual(): string {
  return dataISO(Date.now()).slice(0, 7);
}

export function mesValido(valor: unknown): valor is string {
  if (typeof valor !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(valor)) return false;
  const ano = Number(valor.slice(0, 4));
  return ano >= 2024 && ano <= 2035;
}

export function mesVizinho(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function nomeMes(mes: string): string {
  return MESES[Number(mes.slice(5, 7)) - 1];
}

/** "2026-11-21" → "21/11" */
export function diaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** "2026-11-21" → "sexta, 21/11" */
export function diaSemanaEData(iso: string): string {
  const d = new Date(`${iso}T12:00:00-03:00`);
  const semana = d.toLocaleDateString("pt-BR", { weekday: "long", timeZone: TZ }).split("-")[0];
  return `${semana}, ${diaMes(iso)}`;
}

/** ISO completo → "04/11, 16:20" */
export function dataHora(iso: string): string {
  const d = new Date(iso);
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: TZ });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  return `${dia}, ${hora}`;
}
