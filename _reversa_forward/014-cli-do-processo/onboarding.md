# Onboarding: conferir o painel do processo no terminal

> Identificador: `014-cli-do-processo`
> Data: `2026-09-20`

Passo a passo para quem vai exercitar a feature pela primeira vez. A ordem tem uma razão: esta é a
primeira entrega deste repositório cuja promessa central, a de devolver o terminal inteiro, só se
conhece quebrando a ferramenta de propósito. Por isso os passos destrutivos vêm cedo, e não no fim.

Nenhum passo precisa de rede, exceto os dois que conferem a conferência de atualização, e ambos
estão nomeados.

## 0. Antes de tudo

```bash
cd ~/dev/reversa-views
npm install
npm run build
npm test
```

A suíte inteira passa antes de qualquer conferência manual. Anote a contagem de casos, para comparar
com a do fim.

Confira também que o pacote instalável não mudou, que é a promessa da D-03:

```bash
npm run empacotar
npx vitest run tests/vsix-conteudo.spec.ts
```

Nenhum caminho de `out-cli/` nem de `src/cli/` pode aparecer dentro do pacote. Se aparecer, a
unidade de compilação está errada e o resto da conferência pode esperar.

## 1. A primeira impressão

```bash
npm run painel
```

Confira, sem tocar em tecla alguma:

- [ ] A primeira coisa legível é o bloqueio humano, se houver, e não o histórico
- [ ] O cabeçalho traz projeto, raiz observada, instante da leitura, versão da construção e revisão
      do modelo herdado
- [ ] As seções aparecem na mesma ordem do painel do editor
- [ ] As seções que nascem fechadas são as mesmas que nascem fechadas no painel

Abra o painel no editor, lado a lado, e compare. Divergência aqui é defeito, não preferência.

## 2. Navegar, abrir e voltar

- [ ] As setas movem a seleção, e o item selecionado é reconhecível sem cor
- [ ] `←` e `→` fecham e abrem a seção sob a seleção
- [ ] `Tab` salta de seção em seção
- [ ] `?` mostra a ajuda, e `?` de novo a esconde
- [ ] Com `VISUAL` ou `EDITOR` declarado, `Enter` sobre um artefato o abre naquele editor
- [ ] Ao fechar o editor, a interface volta com a **mesma** seleção e as **mesmas** seções fechadas
- [ ] A tela volta limpa, sem resíduo do que o editor escreveu

Depois, sem nenhuma das duas variáveis:

```bash
env -u VISUAL -u EDITOR npm run painel
```

- [ ] `Enter` não quebra nada, e a interface diz qual variável definir

## 3. Quebrar de propósito, que é o passo que mais importa

Com a interface aberta, em três execuções separadas:

- [ ] Saia com `q`. Em seguida digite qualquer coisa no terminal: o que você digita aparece, e o
      cursor está visível
- [ ] Saia com `Ctrl+C`. Mesma conferência
- [ ] Suspenda com `Ctrl+Z`. O terminal volta ao normal na hora, e `fg` devolve a interface inteira,
      com a mesma seleção e as mesmas seções fechadas
- [ ] Mate o processo de outra janela, com `kill` sobre o identificador dele. Mesma conferência

Se algum dos três deixar o terminal mudo ou sem cursor, a feature não está pronta, por mais verde
que a suíte esteja. O conserto do usuário seria `reset`, e precisar dele é o defeito.

## 4. Redimensionar

Com a interface aberta:

- [ ] Estreite a janela até bem menos que oitenta colunas: nada é cortado no meio de uma palavra
- [ ] Encolha a altura: o quadro rola, e `g` e `G` levam ao topo e ao fim
- [ ] Depois de redimensionar, a seleção continua onde estava, e nenhuma seção reabriu sozinha

## 5. A tela que muda sozinha

Numa janela, deixe a interface aberta. Noutra, mexa num artefato do próprio projeto:

```bash
cd ~/dev/reversa-views
touch _reversa_forward/014-cli-do-processo/requirements.md
```

- [ ] A interface relê sem que você peça
- [ ] Ela **declara** que a mudança veio da observação, e quando
- [ ] Uma rajada de escritas produz uma releitura só, e não uma por escrita:

```bash
for i in $(seq 1 20); do touch _reversa_forward/014-cli-do-processo/requirements.md; done
```

- [ ] A tela não pisca vinte vezes, e a releitura vem uma vez só, cerca de oitocentos
      milissegundos depois da última escrita

Se a observação não tiver instalado no seu sistema, a interface precisa dizer isso e informar que
caiu para releitura por intervalo. Silêncio aqui é defeito.

## 6. Os estados que projeto saudável não produz

Os auxiliares que já existem escrevem cópias adoecidas fora do repositório. Eles escrevem; a
ferramenta, não.

```bash
npm run painel -- --workspace=$(node ./scripts/estragar-workspace.js)
```

- [ ] A interface declara que a leitura degradou
- [ ] A contagem de anomalias aparece, e a seção de anomalias abre sozinha
- [ ] Cada anomalia traz arquivo, código e detalhe

```bash
npm run painel -- --workspace=$(node ./scripts/estragar-registro.js --caso=teto)
```

- [ ] O relatório da sonda nomeia o que foi truncado, com o caminho

E os dois casos de ausência:

```bash
npm run painel -- --workspace=$(mktemp -d)
npm run painel -- --workspace=/caminho/que/nao/existe
```

- [ ] O primeiro explica que não há Reversa instalado, e termina com código `0`
- [ ] O segundo nomeia o caminho recusado, escreve no canal de erro, e termina com código `2`

## 7. O outro modo

```bash
npm run painel -- --passada | head -40
npm run painel -- --passada > /tmp/painel.txt
npm run painel -- --dados > /tmp/painel.json
```

- [ ] A saída redirecionada não contém nenhuma sequência de escape: `grep -c $'\e' /tmp/painel.txt`
      devolve zero
- [ ] Sem bandeira alguma, redirecionar a saída já escolhe a passada: `npm run painel > /tmp/x.txt`
      termina sozinho, sem esperar tecla
- [ ] O JSON é válido: `python3 -m json.tool /tmp/painel.json > /dev/null`
- [ ] `NO_COLOR=1 npm run painel -- --passada` sai sem cor

E o encadeamento, que é a razão de existir do código de saída:

```bash
npm run painel -- --passada > /dev/null && echo "segue o baile"
```

## 8. A conferência de atualização

Com rede:

- [ ] A interface informa se esta instalação está atrás da origem, como o painel informa

Sem rede, ou com ela desligada:

```bash
npm run painel -- --sem-conferir
REVERSA_VIEWS_SEM_CONFERIR=1 npm run painel
```

- [ ] Nenhuma conexão é aberta, e a interface **declara** que a conferência está desligada
- [ ] Numa máquina sem rede, o desfecho aparece nomeado e a leitura do disco continua inteira

## 9. As promessas negativas

São as que ninguém vê funcionando, e por isso se conferem no código e no disco.

```bash
git status --porcelain
```

- [ ] Depois de tudo acima, o repositório está limpo. A ferramenta não escreveu byte algum

```bash
npx vitest run tests/cli-boundaries.spec.ts
```

- [ ] A suíte de fronteiras passa: nenhuma escrita de arquivo em módulo algum da ferramenta, a
      criação de processo num módulo só, a assinatura do disco num módulo só, e o desenho sem
      sequência de escape fora do módulo de terminal

```bash
npx vitest run tests/cli-paridade.spec.tsx tests/cli-terminal.spec.ts
```

- [ ] Painel e terminal afirmam os mesmos fatos sobre a mesma carga, e o terminal devolve o
      que tomou nos dois caminhos da devolução

<!-- A paridade é `.tsx` porque renderiza o painel para comparar; a suíte do terminal nasceu
     da fumaça do passo 6, onde a saída por `q` devolvia a tela sem encerrar o processo. -->

## 10. Ao fim

- [ ] `npm test` passa inteiro, com a contagem maior que a do passo 0
- [ ] `npm run build` continua passando, e o pacote gerado segue sem a ferramenta dentro
- [ ] O terminal em que você conferiu tudo isso está são
