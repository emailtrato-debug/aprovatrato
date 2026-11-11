#!/bin/sh
# Gera os ícones do app (180, 192 e 512 px) a partir das logos em public/logos. Usa o sips do macOS.
# Uso: npm run icones
cd "$(dirname "$0")/.." || exit 1
mkdir -p public/icons
for f in public/logos/*.png; do
  nome=$(basename "$f" .png)
  for t in 180 192 512; do
    sips -s format png -z "$t" "$t" "$f" --out "public/icons/$nome-$t.png" >/dev/null 2>&1 && echo "ok $nome-$t"
  done
done
