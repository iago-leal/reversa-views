# Legacy impact: ponte e host da extensão

> Identificador da feature: `002-ponte-e-host`
> Data da execução: `2026-09-09`
> Gerado por: `/reversa-coding`

**Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.**

Não houve extração `/reversa` sobre este repositório: não existem `architecture.md` nem `domain.md`
em `_reversa_sdd/`, e o impacto abaixo mede-se contra as specs em `_reversa_sdd/sdd/` e contra o
adendo da feature 001, que é a fonte vigente sobre o que já existia em código.

Quase tudo é componente novo, e a coluna de tipo reflete isso. A exceção são três arquivos que a
feature 001 criou e esta alterou: o manifesto de pacote, o arquivo de trava e a configuração do
compilador. Eles vão classificados como `regra-alterada`, e não como `componente-novo`, porque é o
que descreve o que de fato aconteceu com eles.

## Política de edição do legado no momento da execução

| Campo | Valor lido em `.reversa/reversa-config.json` |
|---|---|
| `allowLegacyEdits` | `true` |
| `allowedPaths` | vazio |
| Efeito | Liberação irrestrita: todo caminho do projeto estava gravável |

O `actions.md` previa que a liberação cobriria as três ações que tocam `package.json`,
`package-lock.json` e `tsconfig.json`, e previa também o caminho alternativo caso a política tivesse
fechado antes da execução. Ela não fechou: nenhum caminho foi recusado nesta rodada, e nenhuma ação
precisou terminar apenas registrando o trecho pronto.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/host/bridge.ts` | Ponte do host (`_reversa_sdd/sdd/ponte-e-host.md#6`, RF-05, RF-17) | componente-novo | HIGH | Único ponto de envio e de escuta do host; se ele calar, o painel não recebe nada e o silêncio é indistinguível de painel vazio |
| `src/host/provider.ts` | Provedor de visão (`#6`, RF-01, RF-05, RF-10) | componente-novo | HIGH | Ordena a sequência que RN-03 exige e é o único lugar onde os dois caminhos de releitura de RF-07 se encontram |
| `src/host/reading.ts` | Leitura e composição (`#6`, RF-13, RF-14, RF-16) | componente-novo | HIGH | É por aqui que a camada da feature 001 entra no host, e é aqui que toda exceção morre; uma captura frouxa aqui derruba o painel inteiro |
| `src/host/open-file.ts` | Contenção e abertura (`#6`, RF-08, e `#12`) | componente-novo | HIGH | Superfície de segurança: a recusa de caminho precede qualquer chamada ao editor, e reusa `resolveInside` da sonda em vez de escrever regra própria |
| `src/host/document.ts` | Documento do webview (`#6`, RF-09, e `#7`, RNF-03) | componente-novo | HIGH | A política de segurança do documento é a outra superfície de ataque do componente; a cláusula de avaliação dinâmica foi deliberadamente omitida |
| `src/host/router.ts` | Roteador de comandos (`#6`, RF-06, RF-07, RF-11, RF-12) | componente-novo | HIGH | Fronteira de confiança: tudo o que a webview pede passa por aqui, e nada que ele não reconheça pode produzir efeito |
| `src/host/protocol.ts` | Protocolo do canal (`#9-modelo-de-dados`) | componente-novo | MEDIUM | Contrato entre esta feature e a 003; mudar um nome aqui quebra código que ainda será escrito |
| `src/host/ports.ts` | Portas (`requirements.md#5`, RF-20) | componente-novo | MEDIUM | As cinco fatias da interface do editor e o formato único da linha de log; é o que torna todo o host exercitável sem o editor |
| `src/host/root.ts` | Escolha da raiz (`#6`, RF-03, RF-04, e `#11`, EC-02) | componente-novo | MEDIUM | Resolve a ambiguidade de várias raízes pela ordem do editor, sem duplicar regra de layout |
| `src/host/adapters.ts` | Adaptadores (`requirements.md#5`, RF-20) | componente-novo | MEDIUM | Um dos dois arquivos que conhecem o editor; nenhuma decisão vive aqui, e é isso que precisa continuar verdadeiro |
| `src/extension.ts` | Ativação (`#6`, RF-02, RF-07, RF-11) | componente-novo | MEDIUM | Registra provedor, comando e canal; nenhuma leitura acontece nela, e é isso que mantém a ativação de custo nulo |
| `src/host/provisional.ts` | Corpo provisório (`requirements.md#5`, RF-19) | componente-novo | LOW | Descartado inteiro pela feature 003; existe para provar o canal e nada mais |
| `tests/host-*.spec.ts` | Verificação local (`_reversa_sdd/sdd/empacotamento-e-verificacao.md#6`, RF-09) | componente-novo | MEDIUM | Dez suítes e 93 casos que cobrem dezesseis dos dezoito cenários de aceitação; sem elas o host só é verificável abrindo o editor |
| `media/reversa.svg` | Ícone do contêiner (`requirements.md#5`, RF-01) | componente-novo | LOW | Sem ele o item da barra de atividades não aparece, e RF-01 fica sem prova |
| `package.json` | Manifesto da extensão (`requirements.md#5`, RF-18) | regra-alterada | MEDIUM | Ganhou as seis chaves de extensão e a tipagem do editor; a versão mínima declarada aqui propaga para o alvo do empacotador da feature 005 |
| `tsconfig.json` | Configuração do compilador (`_reversa_sdd/sdd/empacotamento-e-verificacao.md#6`, RF-01, parcial) | regra-alterada | LOW | Um campo alterado, `types`, que passou a incluir `vscode`; sem ele a verificação de tipos não encontra a interface do editor |
| `package-lock.json` | Reprodutibilidade da instalação | regra-alterada | LOW | Consequência da instalação da tipagem, em igualdade exata |

Resumo: 17 entradas. Catorze de tipo `componente-novo` e três de `regra-alterada`. Seis em HIGH, sete
em MEDIUM, quatro em LOW. Nenhuma em CRITICAL, o que é esperado numa feature sem legado a quebrar.

## Diff conceitual por componente

**A primeira camada que conhece o editor.** O repositório deixa de ser uma biblioteca de leitura e
passa a ser uma extensão: há um contêiner na barra de atividades, uma visão de webview dentro dele,
um evento de ativação restrito a essa visão e um comando de paleta. O que sustenta isso são doze
módulos, e a decisão que ordena todos eles é que apenas dois conhecem o editor. Nos outros dez, a
interface do editor entra por parâmetro, o que os torna exercitáveis em Node puro e é o que permitiu
escrever as dez suítes antes dos módulos.

**O canal.** Nasce inteiro nesta entrega, com envelope de nome e carga, três comandos do host e
cinco da webview, um deles reservado. A travessia concentra-se num módulo de cada lado: no host, a
ponte é a única que chama a interface de mensagens, e do lado da webview a interface é tomada uma
única vez. Três regras de ordem vivem na ponte e em nenhum outro lugar: nada sai antes do pronto,
nada sai para visão oculta, e o pedido feito com a visão oculta vira pendência em vez de se perder.

**A leitura.** O host não sabe onde o Reversa guarda arquivo nem como calcula estágio. Ele chama a
sonda e depois o julgamento, ambos da feature 001, e o único juízo que emite é derivar o estado de
entrada do campo `installed`. A escolha da raiz observada segue a mesma disciplina: descobre se há
instalação perguntando à camada de leitura, e não procurando um arquivo. A suíte de fronteiras
converte essa disciplina em teste, buscando no próprio fonte por caminho de arquivo do Reversa e por
cálculo de fase.

**A segurança.** Duas superfícies, e as duas fechadas por reúso e não por código novo. A contenção
de caminho é `resolveInside`, herdada da sonda, que já recusa caminho absoluto, unidade de disco do
Windows e qualquer resolução que escape da raiz; o host não escreve comparação própria, e a suíte
confere isso lendo o fonte. A política do documento declara origem padrão nenhuma, conexão nenhuma e
script apenas por nonce de dezesseis bytes, sem a cláusula de avaliação dinâmica que a origem do kit
trazia por causa de uma dependência que aqui não existe.

**A observabilidade.** Toda rejeição, toda falha capturada e todo caminho recusado saem numa linha de
formato único, com origem, ato e motivo, prefixada pelo instante no canal de saída. Os oito casos da
tabela de erros do contrato foram exercitados sobre a saída compilada, e nenhum produziu linha vazia,
mensagem genérica ou captura silenciosa.

**O manifesto.** Cresceu seis chaves e nada mais. Empacotador, script de empacotamento e lista de
exclusão de VSIX continuam fora, e a suíte do manifesto verifica tanto o que entrou quanto o que não
entrou, para que a fronteira com a feature 005 não se apague por descuido.

## Preservadas

Vazia, e por definição: sem extração `/reversa` sobre este repositório não há regras 🟢 a preservar.
O que esta entrega respeita é o adendo da feature 001, que continua válido: nenhum arquivo herdado em
`src/heranca/` foi tocado, e as dezenove suítes daquela feature seguem verdes, sem regressão.

## Modificadas

Vazia, pelo mesmo motivo: não havia regra 🟢 a alterar ou remover. As três alterações em arquivos
pré-existentes são de configuração, não de regra de domínio, e estão na tabela acima.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-coding` | reversa |
