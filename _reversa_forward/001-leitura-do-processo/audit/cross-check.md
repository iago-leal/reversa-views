# Cross-check: Leitura do processo do Reversa

> Identificador: `001-leitura-do-processo`
> Data: `2026-09-09`
> Artefatos analisados:
> `_reversa_forward/001-leitura-do-processo/requirements.md`,
> `_reversa_forward/001-leitura-do-processo/roadmap.md`,
> `_reversa_forward/001-leitura-do-processo/actions.md`
> Apoio de leitura: `data-delta.md`, `investigation.md`, `onboarding.md`, as specs em `_reversa_sdd/sdd/`,
> o `.gitignore` e o histórico git deste repositório, e a árvore de origem em `HARNESS/scrum-harness`.
> Nenhum dos artefatos acima foi alterado por esta auditoria.

## Resumo

| Severidade | Findings |
|------------|----------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 6 |
| LOW | 4 |

Não há `_reversa_sdd/domain.md` nem `_reversa_sdd/architecture.md`: o projeto é greenfield. O eixo
"coerência com o legado" foi aplicado contra as specs SDD, que aqui fazem as vezes de fonte de verdade.
Não há `interfaces/`, e o roadmap declara que nenhum contrato externo existe; o item 2.3 é vazio por construção.

## Findings

| ID | Severidade | Eixo | Descrição | Onde está |
|----|------------|------|-----------|-----------|
| A001 | MEDIUM | Consistência 2.2 | O roadmap cita `RF-01`, `RF-04` e `RF-09` de outras specs (`heranca-e-sincronia.md`, `empacotamento-e-verificacao.md`) com o mesmo formato dos RF deste `requirements.md`, em que RF-01 é a separação ler/julgar e RF-09 o teto de bytes. Os IDs existem nas specs citadas, logo não são fantasmas, mas colidem com os locais e só o caminho entre parênteses desambigua | `roadmap.md` §5, tabela de delta arquitetural, linhas de "Procedência" e "Infraestrutura mínima" |
| A002 | MEDIUM | Cobertura 1.1 | RF-01 a RF-12 e RF-18 não são citados por ID em nenhuma decisão do roadmap. A cobertura existe, porque a cópia integral (D-01) traz o comportamento e as suítes que o provam, mas a rastreabilidade requisito → decisão só se reconstrói por inferência. O roadmap cita por ID apenas RF-14 e RF-17 | `roadmap.md` §3 (D-01 a D-11) contra `requirements.md` §5 |
| A003 | MEDIUM | Sanidade do actions 4.x e Consistência 2.1 | T019 e o onboarding §5 buscam `@scrum-harness/` em instruções `import`/`export` sobre `src/heranca/` sem restringir a extensão. T021 (D-08) grava `src/heranca/PROCEDENCIA.md` nessa mesma pasta com os trechos originais das importações A1 e A2 em bloco de código, cujas linhas começam por `import`. Depois de T021 a busca acusa falso positivo e o critério de pronto "zero ocorrências" fica vermelho sem defeito real. O critério de RF-14 fala em "arquivos copiados", que a procedência não é | `actions.md` T019; `onboarding.md` §5, primeiro comando; `roadmap.md` §10, oitavo item |
| A004 | MEDIUM | Consistência 2.1 | O roadmap (risco 6) e o onboarding (§7) afirmam que o repositório não tem commit e condicionam o critério de clone limpo ao primeiro commit. O repositório tem o commit `45c9ecb primeiro commit`. O risco é nulo e a instrução do onboarding, embora inofensiva, parte de premissa falsa | `roadmap.md` §9, sexta linha; `onboarding.md` §7 |
| A005 | MEDIUM | Coerência com a spec 3.1 | A spec `leitura-do-processo.md` fala em 16 suítes do modelo, 20 no total, "20 de 20" na métrica de sucesso e RNF-05 com "20 suítes herdadas". O `requirements.md` mediu 14 + 4 = 18, adotou 17 depois do descarte da rota, e registrou nota pedindo reconciliação da spec. A reconciliação não aconteceu; a spec continua com os números antigos enquanto roadmap, actions e onboarding usam 17, 45 blocos e 213 casos | `_reversa_sdd/sdd/leitura-do-processo.md` §2, §3, §7 (RNF-05), §15; `requirements.md` §10, nota de reconciliação |
| A006 | MEDIUM | Cobertura 1.2 (inversa) | T002 exclui `src/heranca/**/tests/**` do `tsconfig.json`, porque as suítes usam `import.meta.url`, incompatível com CommonJS. É decisão de configuração com efeito no comando `typecheck` e não consta de D-02 nem de outra decisão do roadmap. Pelo princípio de que a spec precede o artefato, o roadmap deveria absorvê-la | `actions.md` T002; `roadmap.md` D-02 |
| A007 | LOW | Consistência 2.1 | O `requirements.md` §2 afirma, com 🟢, que o `.gitignore` ignora apenas `.claude/` e `.agents/`. Hoje ele ignora também `.DS_Store`, `.devcontainer/` e `.reversa/config.user.toml`. A conclusão que importa, o gancho em `.reversa/hooks/` viajar no clone, permanece verdadeira | `requirements.md` §2, última linha da tabela; §9, segunda resposta |
| A008 | LOW | Sanidade do actions 4.2 | T019 e T020 têm o mesmo arquivo alvo, `src/heranca/`, e ambos levam `[//]`. São verificações somente leitura, sem conflito de escrita, mas violam a letra da regra. Situação análoga, por aninhamento, entre T009 (`tests/fixtures/`) e T010 (`tests/`), que escrevem arquivos distintos | `actions.md` T009, T010, T019, T020 |
| A009 | LOW | Consistência 2.1 | RF-17 descreve "a suíte de paridade" verificando dois alvos; roadmap (D-06) e actions (T006) realizam a segunda verificação num teste local separado, deixando a suíte herdada `hook-parity.spec.ts` intocada. O comportamento é o mesmo; a formulação sugere um único arquivo onde há dois | `requirements.md` RF-17 e cenários "Paridade contra..."; `roadmap.md` D-06; `actions.md` T006 |
| A010 | LOW | Cobertura 1.3 | O cenário "Cópia independente da árvore de origem (RF-13)" exige compilação e testes com a origem indisponível. Nenhuma ação simula a ausência; T020 até depende da presença. A independência fica garantida indiretamente, por A1 e A2 removerem toda referência ao pacote de origem (T013, T014, T019), mas não é demonstrada como o cenário descreve | `requirements.md` §7; `actions.md` T018, T020 |

Nenhum finding CRITICAL ou HIGH. Os seis MEDIUM não bloqueiam o coding; A003 é o único que produziria
um vermelho falso na verificação final, e merece ajuste antes de T019 ser executada.

### Direção sugerida para os MEDIUM

- **A001 e A006** vivem no `roadmap.md`. A via é edição manual: qualificar as citações cruzadas
  (por exemplo, "RF-01 da spec de herança") e acrescentar a D-02 a frase sobre a exclusão das suítes
  do `tsconfig.json`. `/reversa-clarify` não cobre roadmap; `/reversa-plan` regeraria o documento inteiro.
- **A002** também é do roadmap: uma coluna ou frase em D-01 listando os RF que a cópia cobre (RF-01 a
  RF-12, RF-18) fecha a rastreabilidade sem mudar decisão alguma. Edição manual.
- **A003** pede duas edições manuais pequenas: em `actions.md` T019 e em `onboarding.md` §5, restringir
  a busca a `--include=*.ts`. Alternativa sem tocar na busca: T021 indentar os trechos de importação
  na procedência para que a linha não comece por `import`. A primeira é mais honesta com o critério de RF-14.
- **A004** pede reescrita do risco 6 do roadmap e do §7 do onboarding, que passam a instruir um commit
  do trabalho, e não o commit inicial. Edição manual.
- **A005** é dívida da spec, anterior a esta feature: reconciliar `leitura-do-processo.md` com os
  números medidos (18 arquivos, 17 após descarte, 45 blocos, 213 casos). Edição manual da spec, ou
  nova passada de `/reversa-spec-sdd` se preferir regenerar.

## Itens verificados que passaram

### Cobertura

- RF-13 (cópia com suítes) coberto por D-01, D-11 e T008 a T012, T018.
- RF-14 (remapeio) coberto por D-10, §1 do roadmap, e T013, T014, T019.
- RF-15 (rota descartada) coberto por D-09 e T011, T012, T015, T019.
- RF-16 (procedência) coberto por D-08 e T021.
- RF-17 (paridade dupla, pulo declarado) coberto por D-06, T006, T010 (suíte herdada) e T018 (0 pulados neste repositório).
- RNF de desempenho (200 ms, workspace de referência) coberto por D-07 e T007, com a definição exata da sessão de esclarecimentos.
- RNF de limite de recurso (256 KB, 50 adendos) coberto pelas constantes herdadas, listadas em `data-delta.md` §5.
- RNF de segurança (nenhuma função escreve; confinamento à raiz) coberto pelas suítes `readonly` e `snapshot` herdadas, copiadas em T010 e T012.
- Toda decisão D-01 a D-11 tem pelo menos uma ação correspondente (D-01: T008 a T012; D-02: T002, T017; D-03: T001, T003; D-04: T001, T005; D-05: T009, T016; D-06: T006; D-07: T007; D-08: T021; D-09: T015; D-10: T015; D-11: T001 a T004).
- Os 22 cenários Gherkin têm cobertura: os de comportamento (RF-01 a RF-12, RF-18) pelas 17 suítes herdadas executadas em T018; os de cópia (RF-13 a RF-17) pelas ações listadas acima, com a ressalva A010.
- O formato do carimbo (sete linhas) cabe no teto de dez linhas do RNF-03 da spec de herança.
- O descarte da rota consta como adaptação declarada, como exige RF-04 da spec de herança.

### Consistência

- Os cinco IDs de decisão citados no `actions.md` (D-01 a D-11) e os dois RF (RF-14, RF-15) existem.
- Os números-chave coincidem entre requirements, roadmap, investigation, onboarding e actions: 37 arquivos copiados (34 `.ts` e 3 fixtures), 17 suítes herdadas, 45 blocos, 213 casos, 3 importações cruzadas, 21 menções em comentário, 88 linhas de rota e 12 casos de rota.
- As versões fixadas (5.9.3, 3.2.7, 20.19.9) coincidem entre roadmap D-04, investigation §3, onboarding §2 e actions T001, T005, e batem com o instalado na origem e no kit, conferido nesta auditoria.
- A revisão da origem `420305daa6cdd10858b720a34cb8db67d8e5c5e9` é a mesma em roadmap, investigation, onboarding e actions, e é o HEAD atual da árvore local.
- Os nomes das três estruturas em memória e das constantes-contrato batem entre `data-delta.md` e os fontes da origem.
- O fixture do gancho é idêntico ao gancho instalado, conferido por `cmp` nesta auditoria, o que sustenta D-06 e T006.
- Os dois arquivos de saída da rota que A3 remove são exatamente as duas últimas linhas do índice da sonda, conferido na origem.
- Termos centrais são estáveis nos três documentos: "camada de julgamento", "sonda", "carimbo", "procedência", "adaptação", "descarte", "workspace de referência", "gancho instalado".

### Coerência com as specs

- D-01 (vendorizar), D-09 (descartar rota) e RF-18 (oito eixos) reproduzem as decisões do log da spec `leitura-do-processo.md` §15.
- Nenhuma decisão do roadmap contraria os não-objetivos do PRD (sem escrita, sem rede).
- A política de escrita no legado é respeitada: a única edição fora das pastas do Reversa (`.gitignore`, T004) está condicionada a `.reversa/reversa-config.json`, que hoje traz `allowLegacyEdits: false`.

### Sanidade do actions

- Dependências: todas apontam para IDs existentes (verificado por script).
- Ciclos: nenhum (verificado por script).
- Maior cadeia: 4 ações, como declarado no resumo.
- Total de ações e de `[//]`: 21 e 17, como declarado.
- Ações `[//]` que escrevem arquivo não compartilham alvo com outra `[//]` independente; as sobreposições encontradas são entre pares com dependência declarada (T011 → T013, T011 → T015, T012 → T014), entre pares somente leitura (A008) ou por aninhamento de pasta com arquivos distintos (A008).
- Nenhuma ação de IDE, lint, PR ou commit.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-audit` | reversa |
