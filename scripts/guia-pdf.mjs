// Gera docs/guia-da-equipe.pdf a partir de docs/guia-da-equipe.md (usa o Chrome do Mac).
// Uso: npm run guia
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { marked } from "marked";

const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const raiz = resolve(".");
const fonte = (arq) => pathToFileURL(`${raiz}/src/fonts/${arq}`).href;

const md = await readFile("docs/guia-da-equipe.md", "utf8");
const corpo = marked.parse(md.replace(/^# .*\n/, ""), { gfm: true });
const titulo = (md.match(/^# (.*)$/m) ?? [, "Guia"])[1];

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title><style>
@font-face{font-family:"Dewi";font-weight:400;src:url("${fonte("RFDewi-Regular.woff2")}")}
@font-face{font-family:"Dewi";font-weight:600;src:url("${fonte("RFDewi-Semibold.woff2")}")}
@font-face{font-family:"Dewi";font-weight:700;src:url("${fonte("RFDewi-Bold.woff2")}")}
@font-face{font-family:"DewiExp";font-weight:900;src:url("${fonte("RFDewiExpanded-Black.woff2")}")}
@page{size:A4;margin:16mm 15mm 18mm}
*{box-sizing:border-box}
body{font-family:"Dewi",Helvetica,Arial,sans-serif;color:#212322;font-size:10.5pt;line-height:1.5;margin:0}
.capa{border-bottom:1px solid #e5e5e5;padding-bottom:12px;margin-bottom:18px}
.marca{font-family:"DewiExp",Helvetica,sans-serif;font-weight:900;color:#0040f0;font-size:20pt;letter-spacing:.01em}
.marca sup{font-size:.4em}
h1.titulo{font-size:22pt;font-weight:600;text-transform:uppercase;margin:10px 0 0;line-height:1.1}
h2{font-size:14pt;font-weight:600;text-transform:uppercase;margin:24px 0 8px;padding-top:10px;border-top:1px solid #e5e5e5;break-after:avoid}
h3{font-size:11.5pt;font-weight:700;margin:16px 0 4px;break-after:avoid}
p{margin:6px 0}
ul,ol{margin:6px 0;padding-left:20px}
li{margin:3px 0}
strong{font-weight:700}
a{color:#0040f0;text-decoration:none}
code{font-family:Menlo,monospace;font-size:9pt;background:#f2f1ec;padding:1px 5px;border-radius:4px}
hr{border:0;border-top:1px solid #e5e5e5;margin:14px 0}
table{border-collapse:collapse;width:100%;margin:10px 0;font-size:9.3pt;break-inside:auto}
tr{break-inside:avoid}
th{background:#f2f1ec;text-align:left;font-weight:600;padding:6px 8px;border:1px solid #e5e5e5}
td{padding:6px 8px;border:1px solid #e5e5e5;vertical-align:top}
blockquote{margin:8px 0;padding:6px 12px;background:#f2f1ec;border-radius:6px}
</style></head><body>
<div class="capa"><div class="marca">TRATO<sup>®</sup></div><h1 class="titulo">${titulo}</h1></div>
${corpo}
</body></html>`;

await writeFile("docs/guia-da-equipe.html", html);
execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
  `--print-to-pdf=${raiz}/docs/guia-da-equipe.pdf`, pathToFileURL(`${raiz}/docs/guia-da-equipe.html`).href,
], { stdio: "ignore", timeout: 90000 });
console.log("PDF gerado em docs/guia-da-equipe.pdf");
