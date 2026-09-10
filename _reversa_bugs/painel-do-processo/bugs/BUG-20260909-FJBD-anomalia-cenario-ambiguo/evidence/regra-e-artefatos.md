# A regra que produz a anomalia (leitor herdado) e o teste que a fixa

## src/heranca/reversa-domain/src/impact.ts, linhas 108-113
    }

    // The note is authoritative, but a shape that contradicts it is worth saying.
    if (cenario === 'greenfield' && files.some(file => file.tipo !== 'componente-novo')) {
      log.add(FILE, 'cenario-ambiguo', 'nota de greenfield com impacto que não é componente-novo')
    }

## src/heranca/reversa-domain/tests/impact.spec.ts, linhas 136-141
  it('keeps the note authoritative but flags a contradictory shape', () => {
    const md = `# Impacto\n\n${GREENFIELD_NOTE}\n\n${HEADER}| src/a.js | Comp | regra-alterada | HIGH | mexeu em regra existente |\n`
    const impact = ImpactContract.read(md)
    expect(impact.cenario).toBe('greenfield')
    expect(impact.anomalies.some(a => a.code === 'cenario-ambiguo')).toBe(true)
  })

## .claude/skills/reversa-coding/SKILL.md, linha 101 (a regra do framework)
**Cenário greenfield:** não há legado para impactar. Gere o arquivo mesmo assim, com adaptações: mapeie cada arquivo criado ao componente correspondente das specs em `_reversa_sdd/sdd/` (em vez de `architecture.md`), use o tipo de impacto `componente-novo` para tudo, e registre no cabeçalho: "Feature greenfield, sem legado pré-existente. Âncora: prd.md + specs SDD." As seções "Preservadas" e "Modificadas" ficam vazias com essa nota. Pule os passos 4 e 5 abaixo.

## Tipos usados nas notas de impacto das features 006 e 007
### 006-cartoes-e-cronologia
  20 | componente-novo |
   2 | delta-de-contrato-externo |
   1 | delta-de-dados |
   6 | regra-alterada |
  19 | regra-nova |
### 007-atualizacao-e-progresso
  11 | componente-novo |
   1 | delta-de-contrato-externo |
   4 | regra-alterada |
  23 | regra-nova |
