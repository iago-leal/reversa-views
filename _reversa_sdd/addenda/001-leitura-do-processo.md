# Adendo: leitura do processo do Reversa

> Identificador da feature: `001-leitura-do-processo`
> Data: `2026-09-09`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte. A extração em `_reversa_sdd/` descreve o produto como ele foi
especificado, e a entrega da feature 001 já mudou o repositório: onde as specs falam em futuro,
há código. O que segue diz como ler cada artefato da extração enquanto a re-extração não vem.

## Vigência

Vigente desde 2026-09-09.

## Resumo da entrega

A feature entrega a camada que converte os arquivos deixados no disco pelo Reversa num valor
tipado que descreve o processo inteiro, acompanhado do relatório do que foi lido, recusado ou
truncado. Ela existe porque o framework não tem runtime: o estado vive só como arquivo, e as
regras que lhe dão sentido não estavam escritas em lugar visível. É pré-requisito dos outros
quatro componentes do produto, e serve primeiro ao host da extensão, que precisa do estado sem
conhecer o layout dos arquivos.

O caminho escolhido foi a cópia, e não a reescrita: 34 arquivos `.ts` e 3 fixtures vieram do
`scrum-harness` na revisão `420305d`, byte a byte a partir da linha 8, com carimbo de origem e
três adaptações declaradas. A camada de rota ficou deliberadamente de fora, porque uma extensão
de editor fala com a sonda por chamada de função.

**21 ações concluídas de 21 previstas**, nenhuma aberta, conforme `actions.md` e as 21 linhas de
`progress.jsonl`. A suíte fecha com 19 arquivos, 215 casos, nenhuma falha e nenhum pulo.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#4-escopo-in`, bloco do núcleo | componente-novo | Os quatro eixos do núcleo deixaram de existir apenas como texto: identidade, descoberta, ciclo forward e bloqueio humano já têm quem os produza a partir do disco. Falta somente quem os exiba. |
| `_reversa_sdd/prd.md` | `#4-escopo-in`, bloco do diagnóstico | componente-novo | Os três eixos de diagnóstico ganharam produtor. Anomalias, relatório da sonda e política de escrita no legado chegam prontos ao consumidor, e não dependem mais da tela para existir. |
| `_reversa_sdd/prd.md` | `#6-restricoes` | componente-novo | A restrição de ler sem escrever passou de intenção a guarda executável: as suítes `readonly` herdadas leem o próprio fonte e falham se a camada de julgamento importar sistema de arquivos. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#6-requisitos-funcionais` | componente-novo | Os doze requisitos da seção estão implementados em `src/heranca/reversa-domain/src/` e `src/heranca/reversa-probe/src/`. Leia-os como contrato cumprido, não como plano. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#7-requisitos-nao-funcionais` | componente-novo | RNF-01 ganhou medida no workspace de referência: 44 ms contra o teto de 200 ms, com a leitura de aquecimento incluída. RNF-05 cita 20 suítes herdadas; a cópia traz 17 arquivos, 14 do julgamento e 3 da sonda, e a diferença inclui a suíte da rota, descartada por decisão. |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#15-decisoes-tomadas-decision-log` | componente-novo | As três decisões da seção foram exercidas e não apenas registradas: a vendorização ocorreu, a camada de rota ficou fora e os oito eixos são lidos sem poda dos de migração e ideação. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | componente-novo | Três dos dez requisitos foram atendidos aqui: carimbo de origem nos 34 arquivos (RF-01), adaptações declaradas em `PROCEDENCIA.md` (RF-04) e suítes copiadas rodando pelo comando de teste do repositório (RF-06). Manifesto com resumo criptográfico, verificador e ressincronizador (RF-02, RF-03, RF-05) seguem sem código, e são escopo da feature 004. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | Só a primeira parte de RF-09 existe: o comando único de teste roda as suítes herdadas do modelo e da sonda. Painel e host ainda não têm o que rodar. Build, VSIX, preview e verificação de tipos da webview continuam sem código. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | arquivo inteiro, como base de compilação | componente-novo | O repositório ganhou manifesto de pacote, arquivo de trava, configuração de compilador e configuração de executor de testes, nada além. A emissão CommonJS foi fixada e provada por carregamento da saída, e essa escolha condiciona o host da feature 002. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#10-integracoes-e-dependencias` | componente-novo | A dependência obrigatória `leitura-do-processo` deixou de ser promessa. O host a consumirá por chamada de função sobre a saída CommonJS, jamais por requisição: a linha "Rede ou serviço remoto: Nenhuma" agora tem lastro no código. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#9-modelo-de-dados` | componente-novo | O tipo do processo que o painel consome já existe, e é o da origem. Ao desenhar a tela, leia o modelo pelo código em `src/heranca/reversa-domain/src/`, que é hoje a forma mais precisa dele. |

**11 impactos registrados, todos de tipo `componente-novo`.** Nenhum outro tipo aparece, e isso é
esperado: não houve extração `/reversa` sobre este repositório, logo não há regra a alterar,
componente a extinguir nem contrato externo a deslocar.

## Regras sob vigilância

O watch principal de `regression-watch.md` nasceu **vazio**, por definição e não por omissão: sem
extração não há regras 🟢, e sem regras 🟢 não há o que vigiar.

Os identificadores **W001 a W018** existem, reservados e estáveis, na seção "Observações" daquele
arquivo. Registram os dezoito requisitos funcionais que esta entrega implementou e que uma
extração futura precisará reencontrar para convertê-los em itens de watch de fato.

Conteúdo integral em `_reversa_forward/001-leitura-do-processo/regression-watch.md`. Dois desses
itens, W013 e W017, já têm guarda executável e acusam quebra sem depender de extração.

## Fontes

- `_reversa_forward/001-leitura-do-processo/legacy-impact.md`
- `_reversa_forward/001-leitura-do-processo/regression-watch.md`
- `_reversa_forward/001-leitura-do-processo/requirements.md`
- `_reversa_forward/001-leitura-do-processo/actions.md`
- `_reversa_forward/001-leitura-do-processo/progress.jsonl`
