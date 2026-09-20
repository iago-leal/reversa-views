# Impacto sobre o legado — feature 012, equivalências de checkpoint

Data: 2026-09-20. Feature: `012-equivalencias-de-checkpoint`.

Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.
Não houve extração `/reversa` sobre este repositório, de modo que não existem
`architecture.md` nem `domain.md`, e não há regras 🟢 extraídas para preservar
ou modificar. O mapeamento abaixo liga cada arquivo tocado à spec de
`_reversa_sdd/sdd/` que governa aquela camada, e todo impacto é classificado
como `componente-novo`, conforme a variante greenfield manda.

Política de edição do legado no momento da execução: `allowLegacyEdits: true`
com `allowedPaths: []`, isto é, **liberação irrestrita** sobre a raiz do
projeto, já avisada uma vez nesta sessão.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/domain/types.ts` | `leitura-do-processo.md` | componente-novo | MEDIUM | Quarta situação do checkpoint, procedência, entradas não-agente e as formas do mapa; o protocolo entre host e tela cresceu |
| `src/domain/discovery-state.ts` | `leitura-do-processo.md` | componente-novo | HIGH | Coração do reconhecimento: precedência de `completed_at`, depois `modules_pending`, depois o par aprovado; decide o que vira anomalia |
| `src/domain/equivalencias.ts` | `leitura-do-processo.md` | componente-novo | HIGH | O mapa aprovado em si, gerado pela promoção e versionado; é a única fonte de equivalência que a leitura consulta |
| `src/host/reading.ts` | `ponte-e-host.md` | componente-novo | MEDIUM | Liga o mapa real à leitura e registra no log quantos reconhecimentos houve |
| `src/webview/domain/labels.ts` | `painel-do-processo.md` | componente-novo | MEDIUM | Rótulo da falha, recuo conservador para situação desconhecida, texto da procedência e acesso às entradas não-agente |
| `src/webview/ui/DiscoverySection.tsx` | `painel-do-processo.md` | componente-novo | MEDIUM | Desenha a procedência na linha do checkpoint e o bloco das entradas que não são agente |
| `scripts/equivalencias/elidir.js` | `empacotamento-e-verificacao.md` | componente-novo | HIGH | Decide o que sai do computador rumo ao modelo; é a fronteira de privacidade da ferramenta |
| `scripts/equivalencias/motor.js` | `empacotamento-e-verificacao.md` | componente-novo | MEDIUM | Cliente do motor local, com temperatura zero, semente fixa e descarte de resposta alucinada |
| `scripts/equivalencias/coletar.js` | `empacotamento-e-verificacao.md` | componente-novo | LOW | Isola os pares inéditos e junta a evidência dos projetos |
| `scripts/equivalencias/proposta.js` | `empacotamento-e-verificacao.md` | componente-novo | MEDIUM | Escreve e relê a proposta; a caixa marcada é o ato de aprovar |
| `scripts/equivalencias/gerar-mapa.js` | `empacotamento-e-verificacao.md` | componente-novo | HIGH | Gera o módulo do mapa e recusa conflito entre aprovações; escreve o que a leitura obedece |
| `scripts/aprender-equivalencias.js` | `empacotamento-e-verificacao.md` | componente-novo | MEDIUM | A ferramenta que PROPÕE, fora do build, e que nunca escreve no mapa |
| `scripts/promover-equivalencias.js` | `empacotamento-e-verificacao.md` | componente-novo | HIGH | A ferramenta que DISPÕE, sem conhecer o motor, verificável pelos `require` do topo |
| `scripts/estragar-descoberta.js` | `empacotamento-e-verificacao.md` | componente-novo | LOW | Quinto caso de pré-visualização, o da falha reconhecida |
| `package.json` | `empacotamento-e-verificacao.md` | componente-novo | LOW | Os dois comandos novos, ao lado dos `estragar:*` e fora do `build` |
| `README.md` | `empacotamento-e-verificacao.md` | componente-novo | LOW | Seção do mapa e do rito das duas ferramentas |
| `tests/equivalencias-*.spec.ts` (5 arquivos) | `empacotamento-e-verificacao.md` | componente-novo | MEDIUM | Suítes da elisão, do motor, do coletor, da proposta e do mapa, todas com o motor desligado |
| `tests/domain-discovery-state.spec.ts` | `leitura-do-processo.md` | componente-novo | HIGH | Suíte da precedência, da procedência e do recuo ao comportamento da 011 |
| `tests/webview-labels.spec.ts`, `tests/preview-descoberta.spec.ts` | `painel-do-processo.md` | componente-novo | MEDIUM | Quatro situações na tela e os cinco casos de pré-visualização |
| `tests/host-protocol.spec.ts`, `tests/host-manifest.spec.ts` | `ponte-e-host.md` | componente-novo | MEDIUM | Protocolo com os campos novos e o manifesto com os vinte e dois comandos |
| `tests/vsix-conteudo.spec.ts` | `empacotamento-e-verificacao.md` | componente-novo | HIGH | Exige o mapa dentro do pacote; a escolha do pacote passou a ser por data de modificação |
| `tests/desempenho-referencia.spec.ts` | `leitura-do-processo.md` | componente-novo | MEDIUM | Mede a consulta ao mapa no pior caso contra o teto de 200 ms |
| `tests/helpers/reversa-fixtures.ts`, `tests/fixtures/descoberta/*.json` | `leitura-do-processo.md` | componente-novo | LOW | Quatro fixtures e cinco auxiliares novos, incluindo o retrato anterior à 012 |

## Diff conceitual por componente

**`leitura-do-processo.md`.** O checkpoint tinha três situações e passou a ter
quatro: a falha reconhecida entrou, e ela **jamais** vem do esquema, só de um par
que alguém aprovou. A decisão ganhou um quarto degrau, depois de `completed_at`
e de `modules_pending`: a consulta ao mapa. Reconhecido o par, o checkpoint sai
na situação que o par declara e carrega a procedência, que nomeia o campo e o
valor brutos, exatamente como estão no disco. O valor exibido é o bruto e não o
normalizado, porque mostrar a forma normalizada seria reescrever o arquivo na
tela, e NG-05 proíbe normalizar o que o Reversa escreveu. A anomalia da 011
sobrevive apenas onde o mapa não reconheceu nada: onde alguém já decidiu, o
aviso não tem mais destinatário.

**`ponte-e-host.md`.** O host passou a injetar o mapa real na leitura e a
registrar no log quantos reconhecimentos e quantas entradas não-agente houve na
passada. Nenhuma capacidade nova: o módulo continua sem escrita, sem processo
filho e sem cliente de rede, o que RF-07 pede que seja verificável por inspeção.

**`painel-do-processo.md`.** A linha do checkpoint ganhou a procedência em
texto, e a tela ganhou um bloco à parte para as entradas aprovadas como não
sendo agente, desenhadas sem situação alguma, porque nada se cobra de conclusão
de quem não é agente. Situação desconhecida recua para o rótulo conservador, e
não quebra a tela.

**`empacotamento-e-verificacao.md`.** Nasceram duas ferramentas de manutenção,
fora do `build` e fora do pacote, no mesmo regime dos `estragar:*`. Uma propõe,
consultando o modelo local; a outra dispõe, lendo as caixas marcadas. A
separação é estrutural e não documental: quem promove não importa o cliente do
motor. O mapa é módulo TypeScript, e não arquivo de dados, porque
`.vscodeignore` readmite apenas `out/**` e `media/**`, e uma aprovação que não
chegasse ao `.vsix` valeria só para quem tem o repositório.

## Preservadas

Vazia. Feature greenfield, sem legado pré-existente e sem regras 🟢 extraídas
de código existente. A compatibilidade que a feature de fato preserva, com o
comportamento da 011 quando o mapa está vazio, é RF-15, verificada por suíte e
registrada em `regression-watch.md` como observação.

## Modificadas

Vazia, pela mesma razão.
