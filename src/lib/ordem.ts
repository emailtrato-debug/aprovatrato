// Ordena os arquivos de um carrossel pelo número no nome: "Melhorias-1.png", "slide 2.png", "03_capa.png"...

function nomeLimpo(nome: string): string {
  let n = nome;
  try {
    n = decodeURIComponent(n); // o ClickUp às vezes entrega "mensalidade%20final"
  } catch {
    /* mantém como veio */
  }
  return n.replace(/\.[a-z0-9]{2,5}$/i, "").trim();
}

/** Número no fim do nome ("arte-3", "arte (3)", "arte_03"), ou null. */
function numeroFinal(nome: string): number | null {
  const m = nomeLimpo(nome).match(/(\d+)\s*\)?$/);
  return m ? Number(m[1]) : null;
}

/** Número no começo do nome ("1-capa", "02 slide"), ou null. */
function numeroInicial(nome: string): number | null {
  const m = nomeLimpo(nome).match(/^\(?(\d+)(?=[\s._)-]|$)/);
  return m ? Number(m[1]) : null;
}

/**
 * Se TODOS os arquivos têm número no fim do nome (ou, não tendo, todos no começo), ordena por ele.
 * Se algum arquivo não tem número, ou os números se repetem, mantém a ordem original do ClickUp:
 * melhor não embaralhar do que adivinhar errado.
 */
export function ordenarPorNumero<T>(itens: T[], nomeDe: (i: T) => string): T[] {
  if (itens.length < 2) return itens;
  for (const extrair of [numeroFinal, numeroInicial]) {
    const numeros = itens.map((i) => extrair(nomeDe(i)));
    if (numeros.some((n) => n === null)) continue;
    if (new Set(numeros).size !== numeros.length) continue;
    return itens.map((item, i) => ({ item, n: numeros[i] as number })).sort((a, b) => a.n - b.n).map((x) => x.item);
  }
  return itens;
}
