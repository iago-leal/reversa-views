# Regression watch: leitura do processo do Reversa

> Identificador da feature: `001-leitura-do-processo`
> Data da criação: `2026-09-09`
> Gerado por: `/reversa-coding`

**Feature greenfield.** Não houve extração `/reversa` sobre este repositório, porque não havia
código a extrair. Sem extração não há regras 🟢, e sem regras 🟢 não há o que vigiar: o watch
principal nasce vazio, por definição e não por omissão.

O que a feature entrega ganha peso de regressão quando uma extração futura sobre este código o
confirmar como 🟢. Até lá, os requisitos funcionais implementados ficam na seção "Observações", como
registro do que deveria aparecer nessa extração.

## Watch

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| | | | | |

Vazio. Nenhuma regra 🟢 foi alterada ou removida, porque nenhuma existia.

## Histórico de re-extrações

| Data | Extração | Itens conferidos | Itens violados |
|------|----------|------------------|----------------|
| | | | |

Vazio. Será preenchido pelo agente reverso quando `/reversa` rodar sobre este repositório.

## Arquivadas

| ID | Motivo do arquivamento | Data |
|----|------------------------|------|
| | | |

Vazio.

## Observações

Sem peso de regressão. São os requisitos funcionais que esta entrega implementa, e o que uma
extração futura precisaria reencontrar para confirmá-los. Os identificadores `W001` a `W018` são
estáveis e serão reciclados quando algum destes virar item de watch.

| ID | RF | O que a entrega implementou | Onde vive |
|----|----|-----------------------------|-----------|
| W001 | RF-01 | A leitura se parte em duas: uma metade toca o disco, a outra julga e não importa módulo de sistema de arquivos | `src/heranca/reversa-domain/src/`, `src/heranca/reversa-probe/src/files.ts` |
| W002 | RF-02 | As pastas de saída e de ciclo forward saem do estado do Reversa, com os padrões do framework quando os campos faltam | `src/heranca/reversa-domain/src/state.ts` |
| W003 | RF-03 | As cinco fases da descoberta são derivadas por precedência normativa, e a contradição vira anomalia | `src/heranca/reversa-domain/src/state.ts` |
| W004 | RF-04 | O estágio da feature ativa é classificado pelos artefatos fisicamente presentes, não pelo campo autodeclarado | `src/heranca/reversa-domain/src/forward.ts` |
| W005 | RF-05 | Entrega concluída sem adendo é distinguida da concluída com adendo vigente, e adendo superado conta como ausente | `src/heranca/reversa-domain/src/forward.ts` |
| W006 | RF-06 | As ações são contadas varrendo o arquivo inteiro, com fechadas, abertas e emendas relatadas à parte | `src/heranca/reversa-domain/src/actions.ts` |
| W007 | RF-07 | Toda degradação da leitura é registrada com arquivo, código do problema e detalhe | `src/heranca/reversa-domain/src/anomaly.ts` |
| W008 | RF-08 | Caminho declarado que escape da raiz do workspace é recusado e relatado, e os demais eixos seguem sendo lidos | `src/heranca/reversa-probe/src/files.ts`, `src/heranca/reversa-probe/src/snapshot.ts` |
| W009 | RF-09 | Arquivo acima do teto de bytes não é lido, e o truncamento é relatado em vez de silenciado | `src/heranca/reversa-probe/src/files.ts` |
| W010 | RF-10 | Campos desconhecidos sobrevivem à leitura em vez de serem descartados | `src/heranca/reversa-domain/src/state.ts` |
| W011 | RF-11 | Workspace sem o Reversa devolve processo válido, marcado como não instalado, sem exceção ao consumidor | `src/heranca/reversa-domain/src/index.ts` |
| W012 | RF-12 | O relatório da sonda nomeia o que foi lido, recusado e truncado, incluindo as pastas resolvidas | `src/heranca/reversa-probe/src/snapshot.ts` |
| W013 | RF-13 | O julgamento e a leitura de disco entraram por cópia, com as suítes herdadas junto | `src/heranca/`, 34 arquivos `.ts` e 3 fixtures |
| W014 | RF-14 | As importações que cruzavam a fronteira dos dois pacotes de origem foram remapeadas para caminho interno | `src/heranca/PROCEDENCIA.md`, adaptações A1 e A2 |
| W015 | RF-15 | A camada de rota da origem não foi copiada, nem o módulo nem a suíte | `src/heranca/PROCEDENCIA.md`, seção de descartes; adaptação A3 |
| W016 | RF-16 | A procedência está em texto legível junto ao código: versão do Reversa, data, revisão de origem e descartes | `src/heranca/PROCEDENCIA.md` e o carimbo dos 34 arquivos |
| W017 | RF-17 | A paridade com o gancho é verificada contra dois alvos independentes: o fixture interno e o gancho instalado | `src/heranca/reversa-domain/tests/hook-parity.spec.ts`, `tests/paridade-gancho-instalado.spec.ts` |
| W018 | RF-18 | Os oito eixos da origem são lidos e julgados, sem poda dos de migração e ideação | `src/heranca/reversa-domain/src/migration.ts`, `src/heranca/reversa-domain/src/ideation.ts` |

Dois desses itens já têm guarda executável e não dependem de extração para acusar quebra: W017, pela
suíte de paridade, e W013, pela conferência de fidelidade contra a origem descrita no passo 8 do
`onboarding.md`. Os demais são cobertos pelas 17 suítes herdadas, que rodam pelo mesmo comando de
teste do repositório.
