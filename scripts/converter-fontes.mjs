// Converte as fontes RF Dewi (.ttf) para woff2. Uso: npm run fontes
import { readFile, writeFile, mkdir } from "node:fs/promises";
import wawoff2 from "wawoff2";

const ORIGEM = process.env.FONTES_DIR || `${process.env.HOME}/Downloads`;
const ARQUIVOS = [
  "RFDewiExpanded-Black",
  "RFDewi-Regular",
  "RFDewi-Semibold",
  "RFDewi-Bold",
];

await mkdir("src/fonts", { recursive: true });
for (const nome of ARQUIVOS) {
  const ttf = await readFile(`${ORIGEM}/${nome}.ttf`);
  const woff2 = await wawoff2.compress(ttf);
  await writeFile(`src/fonts/${nome}.woff2`, woff2);
  console.log(`${nome}: ${(ttf.length / 1024).toFixed(0)} KB → ${(woff2.length / 1024).toFixed(0)} KB`);
}
