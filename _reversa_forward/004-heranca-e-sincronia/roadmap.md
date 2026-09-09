# Roadmap: herança e sincronia

> Identificador: `004-heranca-e-sincronia`
> Data: `2026-09-09`
> Requirements: `_reversa_forward/004-heranca-e-sincronia/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

O regime de herança já existe em prosa, e o que falta é a parte verificável dele. A abordagem
transforma `src/heranca/PROCEDENCIA.md` de fonte única em registro narrativo, e move o dado para
dois arquivos YAML ao lado do código copiado: um manifesto com as duas origens e os 37 arquivos
herdados, cada um com resumo criptográfico, e um arquivo de adaptações com os trechos literais de
A1, A2 e A3. Sobre esses dois dados operam duas ferramentas de linha de comando escritas em
`scripts/`, no mesmo formato de `scripts/theme-tokens.js`, com a lógica separada da casca e presa
por suíte: um verificador que não escreve nada e um ressincronizador que planeja tudo antes de
escrever qualquer coisa. O caminho local de cada origem sai do código e passa a viver num arquivo
ignorado pelo git, com exemplo versionado ao lado. Um terceiro script, menor, lê a revisão do
manifesto e gera o módulo que o host importa, de modo que o painel mostre a revisão do modelo sem
ler arquivo em tempo de execução e sem que a extensão saiba onde a origem está. O ritual, hoje
inexistente, nasce no README que esta feature cria, porque o repositório ainda não tem nenhum.

## 2. Princípios aplicados

O projeto não tem `.reversa/principles.md`, de modo que não há princípio formal a confrontar. Ficam
registrados os invariantes herdados do PRD e das features anteriores, que operam como princípio de
fato nesta feature.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| A extensão nunca escreve arquivo | Nenhuma das duas ferramentas roda dentro da extensão, e o único acréscimo ao host é a importação de uma constante gerada | respeita |
| A extensão não toca disco fora do workspace observado | A revisão chega ao painel por módulo gerado em tempo de compilação, e não por leitura do manifesto instalado | respeita |
| Nenhum tráfego de rede em tempo de execução | Verificador e ressincronizador leem disco local e nada mais; nem sequer consultam o remoto da origem | respeita |
| Erros barulhentos antes de desempenho | Manifesto inválido interrompe sem relatório parcial, adaptação que não casa interrompe a ressincronização inteira, e a conferência local entra no build para falhar cedo | respeita |
| O que se automatiza é a medição, nunca a escolha | O verificador mede e relata; herdar arquivo novo, descartar edição local e decidir ressincronizar seguem sendo atos humanos | respeita |
| Uma verdade só para cada dado | O manifesto passa a ser a fonte do resumo e da revisão, e `PROCEDENCIA.md` deixa de repeti-los, apontando para ele | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | As duas ferramentas vivem em `scripts/`, em JavaScript de módulo comum, e não em `src/` | `scripts/theme-tokens.js` já provou o formato: o executor de testes o importa direto, e a suíte `webview-theme-tokens.spec.ts` o cobre como qualquer módulo. Código sob `src/` é compilado para `out/` e viajaria dentro da extensão, que não tem uso algum para ferramenta de manutenção | TypeScript sob `src/` com a compilação do host; unidade de compilação nova só para as ferramentas; script de shell | 🟢 |
| D-02 | Três camadas dentro de `scripts/heranca/`: leitura de dado e de disco, julgamento em funções puras e formatação do relatório, com as cascas de linha de comando reduzidas a `scripts/verificar-heranca.js` e `scripts/ressincronizar-heranca.js` | É o mesmo corte que o host adota, e é o que permite exercer os oito estados do verificador e os três de recusa do ressincronizador sem montar árvore de arquivos a cada caso | Um arquivo por comando, com leitura e decisão misturadas | 🟢 |
| D-03 | Manifesto em `src/heranca/manifesto.yml` e adaptações em `src/heranca/adaptacoes.yml`, lidos por `yaml` em versão exata, única dependência de desenvolvimento nova | Decisão do usuário na sessão de esclarecimentos. O interpretador escolhido não tem dependência transitiva, informa linha e coluna do defeito, que é o que RF-12 pede, e mantém comentários em reescrita, que é o que o ressincronizador precisa para não apagar o cabeçalho do manifesto a cada execução | JSON, que dispensaria a dependência; Markdown com tabela; leitor próprio de subconjunto de YAML | 🟢 |
| D-04 | O resumo é SHA-256 do conteúdo herdado, tomado byte a byte: da linha 8 em diante nos arquivos carimbados, e do arquivo inteiro nos três fixtures isentos | É RN-03 em forma executável, e é o que impede que atualizar carimbo depois de ressincronizar seja indistinguível de editar código copiado. Sem normalização de fim de linha, porque normalizar esconderia mudança real, e o repositório é de fim de linha único | Resumo do arquivo inteiro, que faria todo carimbo novo parecer edição; resumo por linha; comparação textual sem resumo | 🟢 |
| D-05 | A conferência contra a origem aplica as adaptações declaradas ao conteúdo lido da origem e compara o resultado com o conteúdo herdado | Comparar cru acusaria os três arquivos adaptados como divergentes em toda execução, e o relatório que sempre acusa deixa de ser lido. Como efeito secundário, o verificador passa a detectar adaptação que deixou de casar antes de a ressincronização ser tentada | Ignorar da conferência os arquivos com adaptação declarada; reverter a adaptação na cópia em vez de aplicá-la na origem | 🟡 |
| D-06 | A revisão do modelo chega ao painel por `src/host/inheritance.ts`, módulo gerado a partir do manifesto, versionado, regenerado pelo build e preso por suíte de coerência | Decisão do usuário na sessão de esclarecimentos. Versionar o gerado é o que mantém a verificação de tipos funcionando em clone limpo, e a suíte é o que denuncia quem ressincronizar sem regenerar | Ler o manifesto empacotado pelo caminho de instalação, que exigiria emendar o invariante de não tocar disco fora do workspace; gravar a revisão em campo do `package.json`, que exigiria ao ressincronizador escrever fora das três áreas que RN-07 lhe permite | 🟢 |
| D-07 | O campo novo do protocolo é `inheritedRevision`, dentro de `SetProcessData`, e a abreviação para sete caracteres é função pura do domínio da webview | O protocolo evolui por acréscimo, conforme a regra de `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, e a apresentação continua sendo decisão de função pura, nunca do componente | Abreviar no host, que misturaria apresentação com transporte; enviar também em `SetEntryData`, que duplicaria o campo sem cenário que o exija | 🟢 |
| D-08 | O verificador tem dois modos sobre o mesmo código: local, que confere carimbo, manifesto e resumo, e completo, que acrescenta as origens | O modo local não depende de máquina alguma e por isso pode entrar no build, conforme RF-19; o completo depende das origens e por isso fica sob demanda. Um código só evita que os dois julgamentos divirjam | Dois verificadores; um só verificador sempre completo, que quebraria o build em máquina sem as origens | 🟢 |
| D-09 | O caminho local das origens vive em `heranca.origens.yml`, na raiz e ignorado pelo git, com `heranca.origens.exemplo.yml` versionado ao lado | RN-11 exige caminho fora do código e fora do manifesto versionado, e o exemplo ao lado é o que faz a mensagem de origem indisponível ter para onde apontar. As duas origens desta máquina não estão sob a pasta pessoal, o que já prova a necessidade | Caminho no `package.json`; variável de ambiente; caminho relativo presumido acima da raiz | 🟢 |
| D-10 | O ressincronizador executa em duas fases: monta em memória o plano inteiro, com cópia, adaptações reaplicadas e carimbos reescritos, e só escreve depois que todo o plano é viável | É a forma executável de RN-08 e RN-09: uma adaptação que não casa ou uma edição local não declarada interrompem antes da primeira escrita, e o repositório nunca fica com metade de uma revisão aplicada | Escrever arquivo a arquivo e parar no primeiro erro; escrever numa pasta paralela e trocar ao final | 🟢 |
| D-11 | A origem do kit é conferida pela versão declarada no manifesto de pacote da origem, e o bloco dela relata release nova sem listar arquivo algum | RN-10 fixa lista de arquivos vazia por definição, mas o ritual precisa do sinal de release nova. Ler a versão da origem é barato e é o que torna o bloco útil em vez de decorativo. A proximidade de `scripts/theme-tokens.js` com o podador do kit entra como nota fixa do bloco, declarada e não conferível por resumo | Bloco puramente informativo; conferir o podador contra o arquivo da origem, que compararia reescrita com original | 🟡 |
| D-12 | O README nasce nesta feature, com o mínimo que o ritual exige: o que o repositório é, como se constrói, o ritual da herança e o limite conhecido | O repositório não tem README, e RF-16 e RF-18 pedem que o ritual esteja onde o retomador olha. Um README que nasce por causa do ritual e só contém ele seria estranho de ler, então entram também as três linhas de orientação geral | Documentar o ritual em `PROCEDENCIA.md`, que é o registro da cópia e não o lugar por onde se retoma o projeto; adiar o README para a feature 005 | 🟢 |
| D-13 | Quatro scripts novos no manifesto de pacote, e a suíte `host-manifest.spec.ts` passa a esperar dez em vez de seis | A suíte fixa a lista exata de scripts, de propósito, e mexer nela é declarar a mudança em vez de sofrê-la. Os quatro são o verificador completo, o verificador local, o ressincronizador e o gerador da constante | Um script único com subcomandos, que esconderia o modo local dentro de argumento; encadear o gerador dentro de `compile`, que o tornaria invisível | 🟢 |
| D-14 | O ressincronizador não escreve a constante gerada, e quem a regenera é o build | RN-07 lhe permite escrever apenas na pasta de herança, no manifesto e nas adaptações. A cadeia fica explícita: ressincronizar altera o manifesto, o build regenera a constante, e a suíte de coerência falha em voz alta se alguém pular o meio | Deixar o ressincronizador atualizar a constante, ao custo de furar RN-07 na primeira semana de vida dela | 🟢 |

## 4. Premissas

Nenhuma. As três dúvidas do `requirements.md` foram resolvidas na sessão de esclarecimentos de
2026-09-09, e as duas decisões de desenho que faltavam foram fixadas na mesma sessão, de modo que
esta feature entra no plano sem premissa pendente.

## 5. Delta arquitetural

Não houve extração `/reversa` sobre este repositório, e por isso não existe `architecture.md`. As
citações apontam para as specs SDD e para os adendos vigentes, que ocupam o lugar dele.

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Manifesto da herança | `_reversa_sdd/sdd/heranca-e-sincronia.md#9-modelo-de-dados` | componente-novo | `src/heranca/manifesto.yml` passa a ser a fonte do dado de procedência, com as duas origens e os 37 arquivos |
| Adaptações declaradas | `_reversa_sdd/sdd/heranca-e-sincronia.md#9-modelo-de-dados` | componente-novo | `src/heranca/adaptacoes.yml` recebe A1, A2 e A3 com trecho original e adaptado literais |
| Verificador de defasagem | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais`, RF-03 | componente-novo | `scripts/verificar-heranca.js` sobre a lógica de `scripts/heranca/`, em dois modos, sem escrever nada |
| Ressincronizador | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais`, RF-05 | componente-novo | `scripts/ressincronizar-heranca.js`, planejamento completo antes da primeira escrita |
| Configuração local das origens | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais`, RF-10 | componente-novo | `heranca.origens.yml` ignorado pelo git, com exemplo versionado |
| Constante da revisão herdada | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais`, RF-08 | componente-novo | `src/host/inheritance.ts` gerado por `scripts/gerar-revisao-heranca.js` a partir do manifesto |
| Protocolo do canal | `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md` | contrato-alterado | `SetProcessData` ganha `inheritedRevision`, por acréscimo, sem renomear nem remover |
| Provedor da visão | `src/host/provider.ts` | regra-alterada | Passa a preencher o campo novo a partir da constante importada |
| Cabeçalho do painel | `_reversa_sdd/sdd/painel-do-processo.md#8-design-e-interface` | regra-alterada | Sexto item no cabeçalho, com a revisão abreviada, e `não declarado` quando faltar |
| Manifesto de pacote | `tests/host-manifest.spec.ts` | contrato-alterado | Quatro scripts novos, uma dependência de desenvolvimento nova e o encadeamento da conferência local no build |
| Registro de procedência | `src/heranca/PROCEDENCIA.md#8-o-que-fica-para-a-feature-004` | regra-alterada | A seção 8 sai e dá lugar ao estado entregue, apontando o manifesto como fonte do dado |
| README | inexistente | componente-novo | Nasce com o ritual, os três sinais de disparo, os dois comandos e o limite conhecido |

## 6. Delta no modelo de dados

- Resumo das mudanças: entram duas estruturas persistidas e versionadas, o manifesto e as
  adaptações, mais uma estrutura de configuração local ignorada pelo git e uma constante derivada
  do manifesto em tempo de compilação. O protocolo do canal ganha um campo de texto. Nada é migrado,
  porque nada disso existia.
- Detalhe completo em: `_reversa_forward/004-heranca-e-sincronia/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Canal de mensagens entre host e webview | mensagem entre processos | `_reversa_forward/004-heranca-e-sincronia/interfaces/protocolo-webview.md` |

## 8. Plano de migração

Não há dado a migrar. Há uma ordem a respeitar, para que cada peça nasça verificável antes de a
seguinte depender dela.

1. Escrever a leitura e a validação do manifesto e das adaptações, com a dependência de YAML
   declarada em versão exata, e provar os defeitos de RF-12 antes de existir manifesto real
2. Gerar o manifesto inicial a partir da árvore de hoje, conferindo os 37 arquivos e as duas
   origens, e migrar A1, A2 e A3 para o arquivo de adaptações com os trechos que `PROCEDENCIA.md`
   registra
3. Escrever o julgamento local do verificador, com as conferências de carimbo, manifesto e resumo,
   e a formatação do relatório por origem
4. Acrescentar o modo completo, com a leitura das origens, a aplicação das adaptações sobre o
   conteúdo lido e o bloco próprio do kit
5. Acrescentar a configuração local das origens, o exemplo versionado e a entrada no `.gitignore`
6. Escrever o gerador da constante, gerar `src/host/inheritance.ts` e prender a coerência por suíte
7. Acrescentar o campo ao protocolo, preenchê-lo no provedor e desenhar o sexto item do cabeçalho
8. Escrever o ressincronizador, primeiro o planejamento e as três recusas, depois a escrita
9. Encadear a conferência local e o gerador no build, e atualizar a suíte do manifesto de pacote
10. Escrever o README com o ritual e o limite, e substituir a seção 8 de `PROCEDENCIA.md` pelo
    estado entregue

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A dependência nova de YAML envelhecer ou trazer transitivas | baixo | baixo | Versão exata, sem faixa, e escolha de um interpretador sem dependência transitiva; ele é de desenvolvimento e não entra no pacote da extensão |
| A conferência local no build virar atrito e ser desligada | médio | baixo | O modo local não lê origem alguma e custa o resumo de 37 arquivos pequenos, na ordem de dezenas de milissegundos; o modo caro fica sob demanda |
| O fixture `check-legacy-policy.mjs` ser ressincronizado e quebrar a paridade com o gancho instalado | alto | baixo | O manifesto marca o arquivo como preso por paridade externa, o verificador o relata como tal, e o ressincronizador recusa tocá-lo sem decisão humana |
| A versão do kit no disco divergir da que a spec registra, e o primeiro relatório parecer defeito | baixo | alto | Já acontece: o disco traz 1.35.2 e a spec cita 1.35.8. O manifesto registra o que foi observado, e o relatório inicial explica a diferença em vez de escondê-la |
| Alguém ressincronizar e esquecer de regenerar a constante, deixando o painel mostrar revisão velha | médio | médio | A suíte de coerência entre constante e manifesto falha, e o passo do build regenera; a cadeia está escrita no ritual do README |
| O resumo conferir e o comportamento ter mudado, por dependência transitiva da origem | médio | médio | Fora do alcance do resumo por construção, conforme EC-05; as suítes herdadas são a rede que resta, e RF-18 obriga o README a declarar o limite |
| A comparação byte a byte acusar diferença por fim de linha em outra máquina | baixo | baixo | O repositório é de fim de linha único e o relatório nomeia o arquivo; se o caso aparecer, a decisão de normalizar volta como mudança declarada, e não como ajuste silencioso |
| A suíte do manifesto de pacote quebrar por causa dos scripts novos | baixo | alto | É esperado e está em D-13: a lista exata é atualizada na mesma ação que acrescenta os scripts |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)
- [ ] O manifesto lista as duas origens e os 37 arquivos herdados, e o verificador termina com
      veredito alinhado nas duas
- [ ] Os oito estados do relatório têm caso de teste: alinhado, editado localmente, sem carimbo,
      carimbo inconsistente, não manifestado, ausente do disco, origem avançou e origem indisponível
- [ ] As três recusas do ressincronizador têm caso de teste, e nenhuma delas deixa arquivo escrito
- [ ] A suíte de coerência entre `src/host/inheritance.ts` e o manifesto está verde
- [ ] O cabeçalho do painel mostra a revisão abreviada, e `não declarado` quando ela faltar
- [ ] `npm run build` falha quando um arquivo herdado é editado à mão, nomeando o arquivo
- [ ] As 19 suítes herdadas continuam rodando pelo comando único de teste
- [ ] O README nomeia os três sinais de disparo, os dois comandos e o limite conhecido
- [ ] A seção 8 de `PROCEDENCIA.md` foi substituída pelo estado entregue

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-plan` | reversa |
