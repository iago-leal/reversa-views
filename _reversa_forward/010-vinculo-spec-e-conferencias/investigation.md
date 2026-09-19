# Investigação: vínculo entre spec e entrega, e conferências do onboarding

> Identificador: `010-vinculo-spec-e-conferencias`
> Data: `2026-09-19`

## 1. Pergunta de fundo

Onde, no disco, uma entrega declara quais componentes planejados ela realizou, e onde o humano
registra que conferiu o que o agente entregou? As duas respostas precisam ser lidas sem escrita,
sem interpretar Markdown além de seção e tabela, e sem inventar autoridade que o processo do Reversa
não prescreve.

## 2. Fontes examinadas

| Fonte | O que mostrou |
|-------|---------------|
| `.claude/skills/reversa-coding/SKILL.md`, "Geração do legacy-impact.md" | A tabela `Arquivo afetado \| Componente \| Tipo \| Severidade \| Justificativa` é prescrita; no greenfield, o componente é "o correspondente das specs em `_reversa_sdd/sdd/`". Única fonte prescrita do vínculo |
| `legacy-impact.md` das pastas 001 a 009 deste repositório | Uma tabela de impacto por arquivo. De 001 a 005, a coluna traz prosa com o caminho da spec entre parênteses; de 006 a 009, o nome nu da spec. Nenhum nome fora das cinco specs |
| `financas-ali`, `001-fechamento-mensal-mvp/legacy-impact.md` | Coluna `Componente (spec de origem)`, com `` `fundacao-persistencia.md` `` entre crases e, em algumas células, várias specs separadas por vírgula |
| `financas-ali`, `002-infra-remota-auth-assistente/legacy-impact.md` | Uma tabela de mapeamento `Componente \| Spec de origem \| Situação` (linha 22) e seis tabelas de impacto, uma por componente; três componentes sem spec: `acesso-e-identidade`, `operacao-de-producao` e `assistente`, este sem hífen |
| `financas-ali`, `002-infra-remota-auth-assistente/onboarding.md`, seção 9 | Tabela `Data \| Marco \| Item \| Resultado \| Observação` com vinte linhas. Às 15h47 de 2026-09-19 (commit `38e6cc5`), três tinham `Data` e `Resultado`: M2, M3 e segredos, este com "não executável" |
| `financas-ali`, `001-fechamento-mensal-mvp/onboarding.md` | Roteiro de conferência em prosa (seção 4), sem seção de registro |
| `.claude/skills/reversa-plan/SKILL.md`, linha 61 | O `onboarding.md` é passo a passo executável; a seção de registro não é prescrita, e aparece em 1 de 307 onboardings de `~/dev` |
| `src/heranca/reversa-domain/src/table.ts` | `findTable` devolve a primeira tabela cujo cabeçalho inteiro casa; `matchesHeader` e a chave de coluna com artigo e anotação são internos ao módulo, e o índice exporta só `cellsOf`, `findTable`, `normalizeCell` e `splitSections` |
| `src/heranca/reversa-probe/src/files.ts` | `readText` devolve nulo para ausente, ilegível e acima de `REVERSA_FILE_CAP` (256 KiB), sem distinguir os três |
| `src/probe/features.ts` | Já chama `listNames` em cada pasta, para o teste de diretório, e descarta o resultado |

## 3. Alternativas avaliadas

### 3.1 Fonte do vínculo

| Alternativa | Veredito | Motivo |
|-------------|----------|--------|
| Coluna `Componente` do `legacy-impact.md` | adotada | Prescrita pelo processo, escrita no fim da entrega, nomeia o que foi entregue |
| Tabela do adendo (coluna `Artefato`) | descartada | Todo adendo deste repositório cita de quatro a cinco das cinco specs: tocar uma spec não é entregá-la |
| Specs citadas no `requirements.md` | descartada | A 001 do `financas-ali` cita sete e adia duas por escrito (RN-09 e RN-14 daquela feature) |
| Arquivo de configuração de mapeamento | descartada | Criaria autoridade nova, escrita à mão, fora do processo |

### 3.2 Casamento por nome e declaração

A resposta 1b fixou a precedência do nome. A soma irrestrita tiraria as pastas 006 a 009 deste
repositório de "Fora do plano", porque elas declaram `painel-do-processo` e outras specs que já
têm pasta homônima; isso contrariaria o cenário aceito da 009 e diria que uma feature de cartões
"entregou" o painel, que a 003 entregou.

### 3.3 Reconhecimento de componente sem spec

| Regra | Resultado nas formas medidas |
|-------|------------------------------|
| kebab com hífen obrigatório (versão inicial) | perde `assistente` |
| kebab, uma palavra ou mais (adotada, resposta 4a) | acha os três da 002; exclui "Verificação local", "Tema", "(todos)", `docker-compose.yml` |
| qualquer célula não vazia | transformaria a prosa de 001 a 005 em dezenas de componentes |

### 3.4 Registro de conferências

| Alternativa | Veredito | Motivo |
|-------------|----------|--------|
| Seção pelo começo do título normalizado, tabela pelas colunas `Data` e `Resultado` | adotada | Mesmo molde do RF-07.4; independe da numeração e da ordem das colunas |
| Contar marcadores `[ ]` no roteiro | descartada | O roteiro em prosa não tem marcador, e contar prosa é interpretar Markdown |
| Classificar `Resultado` em "confere" e "diverge" | descartada | O painel passaria a julgar o teste; "10 conferem; 10 divergente" não se reduz a um valor |
| Anomalia para onboarding sem a seção | descartada | A seção não é prescrita: acusar anomalia em 306 de 307 projetos seria ruído |

### 3.5 Onde a conferência pendente aparece

A resposta 2a manteve a faixa de bloqueio para o que o processo prescreve. A contagem no histórico
e no panorama basta ao Operador, e a faixa não passa a disputar atenção com uma prática opcional.

### 3.6 Feature nascida da extração greenfield

A resposta 3a dispensou sinal próprio. A 001 deste repositório nasceu da mesma forma e recebeu
adendo; o `/reversa-sync` prevê o adendo no greenfield (passo 4.2). Nenhum dos três sinais
candidatos resiste: `newproject_progress` no modo guiado não registra feature, o id 001 é
convenção, e a nota greenfield aparece em toda feature greenfield.

## 4. Padrões aplicáveis

- Sonda que olha e domínio que julga, como em `probe/greenfield.ts` e `domain/greenfield.ts`.
- Protocolo por acréscimo, com ausência declarada como "não lido" (feature 002, D-13 da 009).
- União local de anomalias na forma `DisplayAnomaly` (D-04 da 008, D-19 da 009).
- Ordem decidida numa função pura só, consumida pela tela e pelo resumo (D-15 da 009).
- Degradação alcançada por cópia adoecida em pasta temporária (`estragar-*.js`).

## 5. Links

- `_reversa_bugs/painel-do-processo/intake/leitura-financas-ali-2026-09-19.md`, o insumo
- `_reversa_sdd/addenda/009-greenfield-e-features-do-prd.md`, RN-04 a RN-07 vigentes
- `_reversa_sdd/addenda/bug-BUG-20260914-DTLI-v001.md`, RF-07.1 a RF-07.3
- `_reversa_sdd/addenda/bug-BUG-20260914-5UH7-v001.md`, RF-07.4, RF-07.5 e EC-5UH7
