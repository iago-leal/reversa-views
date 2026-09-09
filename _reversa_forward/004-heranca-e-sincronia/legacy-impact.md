# Legacy impact: herança e sincronia

> Identificador da feature: `004-heranca-e-sincronia`
> Data da execução: `2026-09-09`
> Gerado por: `/reversa-coding`

**Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.**

Segue não havendo extração `/reversa` sobre este repositório: não existem `architecture.md` nem
`domain.md` em `_reversa_sdd/`. O impacto abaixo mede-se contra `_reversa_sdd/sdd/heranca-e-sincronia.md`
e contra os três adendos vigentes, das features 001, 002 e 003, que são a fonte sobre o que existia
em código antes desta entrega.

Quase tudo aqui é componente novo, porque a camada de ferramentas de herança não existia. Fogem à
regra dez arquivos que as features anteriores criaram e esta alterou, todos classificados como
`regra-alterada`. Nenhum arquivo foi apagado nesta rodada.

Há uma diferença de natureza em relação às três entregas anteriores: doze dos arquivos novos não
entram no produto. São ferramentas de manutenção, escritas em CommonJS e em português, que rodam por
`npm run` e não por `import`. O que delas chega ao bundle é uma única constante gerada,
`src/host/inheritance.ts`, e é por isso que a fronteira do host não mudou.

## Política de edição do legado no momento da execução

| Campo | Valor lido em `.reversa/reversa-config.json` |
|---|---|
| `allowLegacyEdits` | `true` |
| `allowedPaths` | vazio |
| Efeito | Liberação irrestrita: todo caminho do projeto estava gravável |

A liberação foi avisada uma vez na sessão, como a política manda. Nenhum caminho foi recusado nesta
rodada, e nenhum arquivo pré-existente foi apagado.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/heranca/manifesto.yml` | Manifesto da herança (`heranca-e-sincronia.md#9`, RF-01) | componente-novo | HIGH | Fonte de verdade da procedência: duas origens e 37 arquivos com resumo criptográfico; manifesto errado transforma o verificador em ruído, para os dois lados |
| `src/heranca/adaptacoes.yml` | Adaptações declaradas (`#9`, RF-02) | componente-novo | HIGH | Traz A1, A2 e A3 com trecho original e adaptado literais; é o que o ressincronizador reaplica, e por isso o texto precisa casar byte a byte com a origem |
| `heranca.origens.exemplo.yml` | Configuração local das origens (`#10`, RF-09) | componente-novo | MEDIUM | Exemplo versionado do arquivo de máquina; sem ele o ritual não tem de onde partir numa clonagem nova |
| `scripts/heranca/carimbo.js` | Leitura do carimbo (`#6`, RF-01, RN-03) | componente-novo | HIGH | Define o que é conteúdo herdado: linha 8 em diante nos carimbados, arquivo inteiro nos isentos; mudar esse recorte invalida os 37 resumos de uma vez |
| `scripts/heranca/manifesto.js` | Validação das declarações (`#6`, RF-12) | componente-novo | HIGH | Recusa manifesto inválido antes de qualquer relatório, nomeando defeito e linha; relatório parcial que pareça íntegro é pior que ausência de relatório |
| `scripts/heranca/adaptacoes.js` | Reaplicação das adaptações (`#6`, RF-10, RN-09) | componente-novo | HIGH | Busca exata com exigência de ocorrência única; zero e duas ocorrências param a ferramenta, porque escolher entre elas não é decisão de script |
| `scripts/heranca/origens.js` | Resolução das origens (`#6`, RF-09, RF-05) | componente-novo | MEDIUM | Traduz configuração de máquina em origem disponível ou indisponível, e nenhuma falta dela é fatal |
| `scripts/heranca/verificar.js` | Julgamento (`#6`, RF-03 a RF-08) | componente-novo | HIGH | Função pura sobre o estado já lido; é onde os dez tipos de achado nascem e onde se decide o que impede de prosseguir e o que apenas informa |
| `scripts/heranca/relatorio.js` | Relatório (`#8`, RF-08) | componente-novo | MEDIUM | Única interface do ritual: blocos por origem, ação seguinte por achado e código de saída |
| `scripts/heranca/leitura.js` | Camada de disco (`#6`) | componente-novo | MEDIUM | O único módulo que abre arquivo; é ele que mantém o julgamento testável sem clone de origem à mão |
| `scripts/heranca/inventario.js` | Inventário (`#6`, RF-01) | componente-novo | HIGH | Constrói as entradas do manifesto a partir do disco; é o que dispensa alguém de escrever à mão 37 resumos de 64 caracteres |
| `scripts/heranca/ressincronizar.js` | Ressincronizador (`#6`, RF-10, RF-11) | componente-novo | HIGH | Duas fases separadas de propósito: planejar em memória e aplicar plano aprovado, para que o repositório nunca fique com metade de uma revisão |
| `scripts/verificar-heranca.js` | Comando do verificador (`#6`, RF-03, RF-19) | componente-novo | HIGH | Casca dos dois modos sobre o mesmo julgamento, com três códigos de saída; é o que o build chama |
| `scripts/ressincronizar-heranca.js` | Comando do ressincronizador (`#6`, RF-10) | componente-novo | MEDIUM | Imprime o plano antes de escrever e nomeia o motivo da recusa; sem `--aplicar` não grava nada |
| `scripts/gerar-revisao-heranca.js` | Gerador da constante (`#6`, RF-14) | componente-novo | MEDIUM | Mantém a revisão do painel em dia a partir do manifesto, num passo à parte do ressincronizador |
| `src/host/inheritance.ts` | Revisão do modelo (`ponte-e-host.md#6`, RF-14) | componente-novo | MEDIUM | Artefato gerado: leva a revisão ao bundle sem que o host leia arquivo em tempo de execução |
| `README.md` | Ritual e limite (`#8`, RF-16, RF-18) | componente-novo | HIGH | O repositório não tinha README; ele nasce aqui já sendo o lugar por onde se retoma a herança depois de meses |
| `tests/helpers/heranca-fixtures.ts` | Verificação local (`empacotamento-e-verificacao.md#6`) | componente-novo | MEDIUM | Declara o formato do carimbo por template próprio, e não pelo código comparado, que é o que impede a suíte de provar apenas que o código concorda consigo mesmo |
| `tests/heranca-carimbo.spec.ts`, `tests/heranca-manifesto.spec.ts`, `tests/heranca-adaptacoes.spec.ts`, `tests/heranca-origens.spec.ts` | Verificação local (`#6`) | componente-novo | MEDIUM | Prendem o contrato dos quatro módulos de base, incluindo as invalidezes que precisam falhar |
| `tests/heranca-verificador-local.spec.ts`, `tests/heranca-verificador-origem.spec.ts` | Verificação local (`#6`) | componente-novo | HIGH | Exercem os dez tipos de achado, incluindo os quatro que só existem com origem, sem que a origem precise estar na máquina |
| `tests/heranca-relatorio.spec.ts`, `tests/heranca-ressincronizador.spec.ts` | Verificação local (`#6`) | componente-novo | MEDIUM | Prendem a separação por origem no relatório e as três recusas do ressincronizador |
| `tests/heranca-revisao-gerada.spec.ts` | Verificação local (`#6`, RF-14) | componente-novo | MEDIUM | É o preço do artefato gerado: quem ressincronizar e esquecer de regenerar descobre aqui, e não pelo painel mostrando número velho |
| `tests/heranca-ritual.spec.ts` | Verificação local (`#6`, RF-16, RF-18) | componente-novo | MEDIUM | Impede que a seção do ritual suma numa reescrita futura do README |
| `src/host/protocol.ts` | Contrato do fio (`ponte-e-host.md#6`, RF-14) | regra-alterada | MEDIUM | Ganhou `inheritedRevision` em `SetProcessData`; o protocolo cresce por acréscimo, e `SetEntryData` ficou intacto |
| `src/host/provider.ts` | Provedor de visão (`ponte-e-host.md#6`, RF-14) | regra-alterada | LOW | Preenche o campo novo pela constante importada, sem transformação e sem conhecer caminho de origem |
| `src/webview/domain/labels.ts` | Decisões puras (`painel-do-processo.md#6`, RF-15) | regra-alterada | LOW | Ganhou a abreviação da revisão em sete caracteres, total como as demais funções do módulo |
| `src/webview/ui/Header.tsx` | Cabeçalho (`painel-do-processo.md#8`, RF-15) | regra-alterada | LOW | Sexto item, ao lado da versão do Reversa, com o mesmo texto de ausência dos outros cinco |
| `package.json` | Manifesto e dependências (`empacotamento-e-verificacao.md#6`, RF-19) | regra-alterada | MEDIUM | Quatro scripts novos, o interpretador de YAML em igualdade exata e o build encadeando conferência local e geração antes da compilação |
| `package-lock.json` | Reprodutibilidade da instalação | regra-alterada | LOW | Consequência de `yaml@2.9.0`, instalado com igualdade exata e sem dependência transitiva |
| `.gitignore` | Configuração do repositório (`#10`, RF-09) | regra-alterada | LOW | Passou a ignorar `heranca.origens.yml`, que é caminho de máquina e não pertence ao versionamento |
| `src/heranca/PROCEDENCIA.md` | Procedência da herança (`#6`, RF-17) | regra-alterada | LOW | A seção 8 deixou de anunciar esta feature e passou a registrar o entregue, apontando manifesto, adaptações e README |
| `tests/host-protocol.spec.ts`, `tests/host-provider.spec.ts` | Verificação local (`empacotamento-e-verificacao.md#6`) | regra-alterada | LOW | Acompanharam o sétimo campo da carga e a ausência dele nos estados sem processo |
| `tests/host-manifest.spec.ts` | Verificação local (`empacotamento-e-verificacao.md#6`, RF-19) | regra-alterada | LOW | Passou de seis para dez scripts e ganhou a ordem do build e a igualdade exata do YAML |
| `tests/webview-labels.spec.ts`, `tests/webview-render.spec.tsx` | Verificação local (`empacotamento-e-verificacao.md#6`, RF-15) | regra-alterada | LOW | Ganharam a abreviação da revisão e os dois casos do sexto item do cabeçalho |
| `tests/helpers/reversa-fixtures.ts` | Verificação local (`empacotamento-e-verificacao.md#6`) | regra-alterada | LOW | A carga de leitura passou a trazer a revisão herdada, como o protocolo agora exige |

Resumo: 34 entradas, contando como uma cada grupo de suítes irmãs. Vinte e três de tipo
`componente-novo` e onze de `regra-alterada`. Nenhuma `componente-extinto` e nenhuma em CRITICAL.
Dez em HIGH, treze em MEDIUM, onze em LOW.

## Diff conceitual por componente

**A procedência deixa de ser prosa.** Até aqui `PROCEDENCIA.md` era a fonte única: quem quisesse
saber de onde veio um arquivo lia um texto e acreditava. Agora existe dado conferível ao lado do
texto, e a divisão é explícita: o manifesto e o arquivo de adaptações guardam o **que**, em forma
que uma ferramenta lê; a nota em prosa guarda o **porquê**, que nenhuma ferramenta reconstrói.

**O que o resumo cobre, e por que isso importa.** O resumo é do conteúdo herdado, não do arquivo:
linha 8 em diante nos 34 carimbados, arquivo inteiro nos três fixtures isentos. A consequência
prática é que ressincronizar, que reescreve o carimbo por definição, não aparece como edição local.
Se o recorte fosse o arquivo inteiro, toda ressincronização acusaria os 34 arquivos ao mesmo tempo,
e um relatório que sempre acusa deixa de ser lido.

**Julgar e ler, separados.** O verificador tem três camadas: uma abre arquivos, uma julga e uma
formata. O julgamento é função pura sobre o estado já lido, e é isso que permite exercer os quatro
tipos de achado que só existem com origem sem que a origem esteja na máquina. As duas suítes do
verificador rodam em milissegundos e cobrem, entre outras, a situação de origem indisponível, que é
o estado normal desta máquina.

**Duas fases no ressincronizador.** `planejar` monta tudo em memória e não abre um arquivo para
escrita; `aplicar` grava um plano já aprovado. A separação é o que garante que ou a revisão nova
entra inteira, ou não entra nada. Três situações param o planejamento, e nenhuma é resolvível por
script: edição local não declarada, adaptação que deixou de casar e arquivo preso por paridade
externa. Todas as três terminam dizendo as saídas possíveis, porque parar sem dizer o que fazer
apenas transfere o problema.

**A origem sai do código.** Onde cada origem está clonada é assunto de máquina, e vive num arquivo
que o git ignora, com exemplo versionado ao lado. A ausência desse arquivo é situação normal, não
defeito: o verificador cai para o modo local e conclui as seis conferências que não dependem de
origem. Foi essa escolha que permitiu pôr a conferência local dentro do build.

**O build ganhou uma guarda.** `npm run build` agora confere a herança localmente e gera a constante
da revisão antes de compilar. A comparação com as origens ficou fora, de propósito: build que
depende de outra pasta existir no disco falha por motivo que não é do código.

**O painel diz de onde veio.** O protocolo cresceu por acréscimo, com um sétimo campo em
`SetProcessData`, e o cabeçalho ganhou um sexto item com a revisão abreviada em sete caracteres. O
host não passou a ler nada: a revisão entra no bundle como constante gerada, e uma suíte falha
quando a constante e o manifesto discordarem.

**O README nasce aqui.** O repositório não tinha um. Ele começa já com o que o projeto é, como se
constrói, o ritual da herança e o limite conhecido do regime, que é a parte mais fácil de omitir e a
mais cara de descobrir sozinho: resumo igual não é comportamento igual, a dependência transitiva é o
caso que ele não pega, e as suítes herdadas são a rede que resta.

**A verificação.** A suíte passou de 487 casos em 42 arquivos para 597 casos em 52 arquivos, sem
falha e sem pulo. O verificador completo, com as duas origens ao alcance e os 37 arquivos lidos da
origem, levou de 80 a 98 ms, contra o teto de 10 s do requisito não funcional.

## Preservadas

Vazia, e por definição: sem extração `/reversa` sobre este repositório não há regras 🟢 a preservar.
O que esta entrega respeita são os três adendos vigentes. A camada herdada em `src/heranca/`
continua byte a byte como estava, e agora isso é afirmação verificável, e não confiança: o modo
local do verificador termina alinhado sobre os 37 arquivos.

## Modificadas

Vazia, pela mesma razão. Nenhuma regra 🟢 foi alterada ou removida, porque nenhuma foi extraída
ainda. As três alterações de contrato desta entrega, o campo novo no protocolo, o item novo no
cabeçalho e os quatro scripts novos, são acréscimos: nada que existia deixou de valer.
