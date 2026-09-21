# Adendo: visual do painel de linha de comando

> Identificador da feature: `016-visual-do-painel-cli`
> Data: `2026-09-21`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Até a 015, quem lesse o adendo 014 encontraria um painel de terminal em texto corrido: uma linha do
quadro era um texto com uma ênfase, de quatro possíveis, e o cabeçalho trazia todos os fatos da leitura.
Desde a 016 a linha é uma **lista de trechos com papel**, o quadro da interface viva tem molduras,
glifos de estado, dado secundário em linha própria e uma **linha de estado fixa** na última linha da
janela, e o terminal ganhou uma **décima segunda seção**, que só ele tem.

A entrega é de apresentação, e o que o adendo precisa deixar registrado é a fronteira dela: nenhum fato,
frase, ordem ou contagem mudou; a saída de dados, os códigos de saída e a paridade com a webview ficaram
parados. O que mudou de contrato é pouco e está nomeado abaixo: uma bandeira, uma variável de ambiente, e
a garantia da passada, que passou de identidade de bytes a identidade de texto.

## Vigência

Vigente desde 2026-09-21.

## Resumo da entrega

O painel do processo no terminal, entregue pela 014, dizia tudo o que o painel do editor diz, mas em
texto corrido, sem hierarquia visual. A 016 lhe dá uma linguagem visual própria: acento quente sobre
texto neutro, molduras de cantos arredondados, glifos de estado, dado secundário atenuado e linha de
estado fixa. Serve ao Operador que mantém a ferramenta aberta ao lado do agente e precisa achar o que
mudou num relance.

A resposta tem três eixos. O primeiro é o **modelo de linha**: o desenho nomeia papel, e não cor; só
`src/cli/terminal.ts` transforma papel em sequência de escape, e só `src/cli/paleta.ts` sabe que cor um
papel tem. As duas fronteiras são conferidas por busca nos fontes. O segundo é a **apresentação decidida
pelo ambiente**, em três eixos independentes e sem perguntar nada ao terminal: degrau de cor (24 bits,
256, 16, nenhuma), fundo (escuro ou claro) e jogo de glifos (Unicode ou sete bits). O terceiro é a
**conferência sem pessoa diante do terminal**: onze quadros de amostra, gerados de um estado fixo por
função pura, gravados por uma casca em `scripts/` e versionados, com suíte que compara o gerado com o
gravado.

Todo texto vindo do disco passa, no construtor único de trecho, por uma higiene que troca caractere de
controle por representação visível: um `actions.md` hostil não comanda o terminal de quem o lê.

Ações: **57 de 57 concluídas**, nenhuma falha. Suíte inteira com 145 arquivos e 2625 testes passando;
`tsc` das três unidades e `check:webview` limpos. Doze desvios do plano estão em "Notas de execução" do
`actions.md`; nenhum muda requisito.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `_reversa_sdd/addenda/014-cli-do-processo.md` | modelo do quadro, `LinhaDoQuadro` | `componente-novo` | Onde o adendo diz ênfase por linha, leia trechos com papel: `Enfase` e `LinhaDoQuadro.enfase` foram removidos; `texto` continua existindo e é a soma dos trechos (RF-01, RN-01) |
| `_reversa_sdd/addenda/014-cli-do-processo.md` | D-05, escape confinado a `terminal.ts` | `componente-novo` | A regra vale inteira e ganhou gêmea: valor de cor só em `src/cli/paleta.ts`. `vestir` e `cor` deram lugar a `vestirLinha` (RF-01, RF-16) |
| `_reversa_sdd/addenda/014-cli-do-processo.md` | cabeçalho do quadro | `componente-novo` | O cabeçalho é um núcleo emoldurado de quatro fatos mais a integridade; versões, carimbo, desfecho da conferência e procedência foram para a seção "Versões e construção" e para a linha de estado (RF-02, RF-08, RF-18) |
| `_reversa_sdd/addenda/014-cli-do-processo.md` | RN-04, as onze seções na ordem de `sectionOrder()` | `componente-novo` | Continua verdadeira para as seções compartilhadas. O terminal tem uma décima segunda, `versoes`, fora de `sectionOrder()` e de `SectionName`, recolhível e presente também sem carga (RF-18) |
| `_reversa_sdd/addenda/014-cli-do-processo.md` | navegação e rolagem | `componente-novo` | A seleção é um bloco de linhas, item mais dado secundário, e a rolagem o mantém inteiro; a janela útil desconta a linha de estado, num lugar só, `alturaUtil()` (RF-06, RF-07, RF-08) |
| `_reversa_sdd/addenda/014-cli-do-processo.md` | a passada, RN-06 | `delta-de-contrato-externo` | A garantia é de texto, e não de bytes: mesmas frases na mesma ordem, sem moldura, cursor nem linha de estado; redirecionada, sem sequência alguma; diante de terminal, vestida (RF-15, RF-19) |
| `_reversa_sdd/addenda/014-cli-do-processo.md` | argumentos e ambiente | `delta-de-contrato-externo` | Entram `--tema=escuro\|claro` e `REVERSA_VIEWS_TEMA`; `COLORFGBG`, `COLORTERM`, `TERM` e a localidade passam a ser lidos; `--sem-cor` e `NO_COLOR` tiram a cor e só ela. Tema inválido na bandeira é código 2; na variável, aviso no canal de erro (RF-11, RF-12, RF-20, RF-21) |
| `_reversa_sdd/addenda/014-cli-do-processo.md` | RN-02, a ferramenta não escreve | `componente-novo` | Intacta: a função das amostras é pura e mora em `src/cli/amostras.ts`; quem grava é `scripts/amostras-do-painel.js`, fora da unidade (RF-17) |
| `_reversa_sdd/addenda/014-cli-do-processo.md` | contagem de scripts do manifesto | `componente-novo` | O adendo registra vinte e seis; a suíte mede **trinta e dois** desde a 016, com `preamostras:painel` e `amostras:painel` (finding A015 da auditoria) |
| `_reversa_sdd/sdd/painel-do-processo.md` | superfícies do painel | `componente-novo` | O terminal segue terceiro consumidor da mesma leitura, agora com linguagem visual própria: molduras no cabeçalho, no bloqueio, na ajuda e nas três situações de entrada da interface viva; abaixo de 60 colunas as molduras somem e só elas (RF-02, RF-03, RF-04, RF-05, RF-09, RF-10, RF-13, RF-14) |
| `_reversa_sdd/sdd/painel-do-processo.md` | paridade entre superfícies | `componente-novo` | Sem delta de regra: `tests/cli-paridade.spec.tsx` passa sem linha alterada, que é o critério do RF-16 |
| `_reversa_sdd/sdd/ponte-e-host.md` | protocolo e leitura | `componente-novo` | Sem delta: nenhuma mensagem nova, `src/host/` e `src/webview/` intocados; a saída de dados segue idêntica byte a byte (RF-15) |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | conteúdo do pacote | `componente-novo` | `amostras/` fica fora do `.vsix`, e `tests/vsix-conteudo.spec.ts` nomeia a recusa, ao lado de `out-cli/` e `src/cli/` (RF-17) |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | suítes de fronteira | `componente-novo` | `tests/cli-boundaries.spec.ts` ganhou, só por acréscimo, a guarda do valor de cor e a dos nomes vigiados da referência; seis suítes novas em `tests/cli-*` (RF-16, RF-22, RN-07) |
| `_reversa_sdd/prd.md` | requisitos não funcionais | `componente-novo` | Dois pisos medidos por suíte: contraste de 4,5 para texto de leitura e de 3 para o acento, que só veste marca; quadro de 500 linhas composto em menos de 50 ms |

## O que o texto deliberadamente não diz

- **A raiz inexistente não tem moldura nem amostra.** Ela termina com o código de uso incorreto antes de
  existir quadro; as situações de entrada com aparência são três, e não quatro.
- **A localidade sem UTF-8 não translitera a prosa.** Trocam-se glifos e molduras; as frases, em
  português, continuam acentuadas, porque mudá-las violaria a RN-01.
- **O acento não veste texto de leitura.** Onde o foco precisa de texto colorido, o papel é `destaque`.
  No fundo claro, o acento de 256 cores é o índice 167, e não o 173, que reprovou o piso de contraste; o
  tom de 24 bits é único nos dois fundos.
- **A fumaça em terminal real é passo humano**, descrito em `onboarding.md`. As amostras mostram o texto
  vestido, e não o que cada emulador faz com ele.
- **Pendência de uso registrada, sem ação:** a cerca de 100 colunas a procedência na linha de estado é
  truncada na parte informativa, por força da ordem de sacrifício da D-18; a seção de versões repete a
  frase inteira.

## Regras sob vigilância

O watch principal está vazio, por ser cenário greenfield. As observações, sem peso de regressão até que
uma extração as confirme, são **W001 a W023**, em
[`_reversa_forward/016-visual-do-painel-cli/regression-watch.md`](../../_reversa_forward/016-visual-do-painel-cli/regression-watch.md):

W001, W002, W003, W004, W005, W006, W007, W008, W009, W010, W011, W012, W013, W014, W015, W016, W017,
W018, W019, W020, W021, W022, W023.

## Fontes

- `_reversa_forward/016-visual-do-painel-cli/legacy-impact.md`
- `_reversa_forward/016-visual-do-painel-cli/regression-watch.md`
- `_reversa_forward/016-visual-do-painel-cli/requirements.md`
- `_reversa_forward/016-visual-do-painel-cli/roadmap.md`
- `_reversa_forward/016-visual-do-painel-cli/actions.md`, com as "Notas de execução"
- `_reversa_forward/016-visual-do-painel-cli/progress.jsonl`
- `_reversa_forward/016-visual-do-painel-cli/audit/cross-check.md`
- `_reversa_forward/016-visual-do-painel-cli/interfaces/contrato-de-linha-de-comando.md`
