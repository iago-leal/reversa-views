#!/usr/bin/env sh
# Aplica os diffs propostos do BUG-20260909-FJBD (estratégia A: adaptação A4/A5 do leitor herdado).
# Rode na raiz do clone, depois de aprovar o plano (fix/plan.html) e o veredito de spec.
set -eu
DIR=$(cd "$(dirname "$0")" && pwd)
for d in CHG-001 CHG-002 CHG-003 CHG-004 CHG-005 CHG-006; do
  echo "== $d"; git apply --check "$DIR/$d.proposto.diff"; git apply "$DIR/$d.proposto.diff"
done
node scripts/verificar-heranca.js --local
npx vitest run src/heranca/reversa-domain/tests/impact.spec.ts tests/leitura-impacto-nota-greenfield.spec.ts tests/heranca-verificador-local.spec.ts
