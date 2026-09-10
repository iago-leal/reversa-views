# Registro de Bugs (Reversa Bugs)

> Gerado pelo Reversa em 2026-09-09. Este arquivo é o contrato do registro de bugs deste projeto.
> Source of truth: cada `<contexto>/bugs/<ID>/bug.md`. Tudo em `generated/` é projeção regenerável.

## Configuração do projeto

```yaml
closure_policy: package          # local-software | package | production-service
control_mode: gated              # supervised | gated | autonomous
```

`closure_policy: package` foi decidida pelo usuário em 2026-09-10, na primeira execução completa do
`/reversa-debugger`, substituindo o `local-software` assumido em 2026-09-09 numa sessão sem
interlocutor. A troca reconhece o que os bugs 2, 4 e 5 mostraram: neste projeto a suíte verde não
encerra nada, porque o defeito continua vivo na extensão instalada até o pacote novo ser gerado e
instalado. Publicar, aqui, é empacotar o `.vsix` e instalá-lo pelo executável do editor; não há
Marketplace, e não é preciso haver para que a instalação conte como entrega.

Bugs registrados antes desta decisão guardam `closure.policy: local-software` no próprio front
matter, e a trava `DONE.md` deles não se reabre por causa da troca. A política nova vale do
`display_number: 4` em diante.

- `closure_policy` define o que "resolvido" exige:
  - `local-software`: testes de regressão passando + veredito de spec
  - `package`: anterior + merge + versão corrigida publicada (+ backports requeridos)
  - `production-service`: anterior + entrega + janela de observação sem recorrência
- `control_mode: gated` (padrão): leitura, reprodução isolada e diagnóstico fluem sem aprovação;
  gate obrigatório para aplicar testes, aplicar change set, alterar spec efetiva, usar harness
  externo com acesso ao projeto e qualquer operação destrutiva.

## Estrutura

Os bugs são agrupados por **contexto** (feature, módulo ou caso de uso, na linguagem de quem reporta). Cada contexto é uma pasta agregadora com TUDO daquela área: bugs, inspeções e views. A pasta nasce sob demanda, quando o primeiro problema da área é reportado; nada é criado vazio.

```text
_reversa_bugs/
├── README.md                    este contrato
├── taxonomy.yaml                vocabulário controlado de area/module/feature
└── <contexto>/                  ex.: painel-do-processo/
    ├── bugs/BUG-<data>-<sufixo>-<slug>/   pasta única do bug (endereço IMUTÁVEL, nunca se move)
    │   ├── bug.md               registro canônico
    │   ├── evidence/  ├── debate/  └── fix/
    ├── intake/                  relatos brutos e evidências como chegaram
    ├── inspections/<varredura>/ relatórios do pente-fino do contexto
    └── generated/               views do contexto, regeneradas pelo /reversa-debugger-graph
```

## Ciclo de vida

`status`: `open` → `active` → `resolved`. `phase` detalha a etapa dentro de `active`
(mitigating, reproducing, diagnosing, testing, patching, delivering, observing, awaiting-human).
Bloqueio é condição (`blocking:`), nunca status. Todo fechamento tem `resolution_kind`.

**Trava de conclusão:** ao satisfazer a closure policy, o bug recebe `DONE.md` na pasta e vira
SOMENTE LEITURA para todos os agentes. Reabertura: remover a trava conscientemente, ou registrar um
bug novo com `regression-of`. A lista dos travados aparece no `graph.html` do contexto (view
derivada, sem edição manual).

## Regra de rastreabilidade

Todo bug DEVE identificar:

1. A seção de spec que define o comportamento esperado (spec efetiva = original + adendos vigentes).
   Sem spec, o bug carrega o label `spec-gap` e a lacuna é tratada antes da resolução.
2. O código afetado (onde aparece) e, após investigação, a causa raiz (onde nasceu), com estado
   epistemológico e evidências.
3. Os testes de reprodução e de regressão.

Um bug NÃO pode ser `resolved: fixed` com `traceability.specs`, `root_cause` (confirmed) ou
`regression_tests` vazios.

## Protocolo dos agentes

1. Registrar (`/reversa-debugger`) NUNCA corrige. Corrigir (`/reversa-debugger-fix`) segue dois gates de
   aprovação com diff (testes que falham; change set que faz os testes passarem).
2. A spec original NUNCA é editada. Mudança de spec vira adendo versionado e imutável em
   `_reversa_sdd/addenda/bug-<ID>-vNNN.md`, com decisão humana registrada.
3. Diff do código e diff/adendo da spec ficam registrados JUNTOS na Resolution do bug.
4. Bugs com `visibility: restricted` ficam fora das views e nada explorável vai a harness externo.
5. Relação e causa raiz têm estado epistemológico: hipótese não é fato.

## Convenções

- ID canônico: `BUG-<YYYYMMDD>-<sufixo>` (merge-safe). `display_number` é apelido humano.
- Referências sempre por ID; as views resolvem o caminho.
- Evidências em `evidence/`, nunca logs gigantes dentro do Markdown.
- Schema completo: `.claude/skills/reversa-debugger/references/bug-schema.md`.
- Regeneração das views: `node _reversa_bugs/gerar-views.mjs . [contexto]` (o mesmo protocolo do
  `/reversa-debugger-graph`, em script, para não depender de sessão; valida as invariantes e para
  nas inconsistências).
- Este projeto não tem `architecture.md` nem `domain.md`: a taxonomia foi semeada das cinco specs
  de `_reversa_sdd/sdd/` e das features do ciclo forward.
