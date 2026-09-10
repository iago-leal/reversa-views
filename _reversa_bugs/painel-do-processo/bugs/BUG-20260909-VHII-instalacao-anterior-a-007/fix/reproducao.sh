#!/usr/bin/env sh
# Reprodução do BUG-20260909-VHII: a extensão instalada não carrega os módulos da feature 007.
# Sai com 1 (defeito presente) ou 0 (instalação com a feature). Só lê; não instala nada.
set -u
DIR=$(ls -d "$HOME"/.vscode/extensions/iagoleal-local.reversa-views-* 2>/dev/null | sort -V | tail -1)
if [ -z "$DIR" ]; then echo "nenhuma instalação de reversa-views encontrada"; exit 2; fi
echo "instalação: $DIR"
echo "versão:     $(grep -o '"version": *"[^"]*"' "$DIR/package.json")"
faltam=0
for m in update.js net.js build.js; do
  if [ -f "$DIR/out/host/$m" ]; then echo "  out/host/$m: presente"; else echo "  out/host/$m: AUSENTE"; faltam=$((faltam+1)); fi
done
if [ "$faltam" -gt 0 ]; then echo "DEFEITO PRESENTE: a instalação é anterior à feature 007 ($faltam módulos ausentes)"; exit 1; fi
echo "ok: a instalação carrega a feature 007"; exit 0
