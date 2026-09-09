# Onboarding: herança e sincronia

> Identificador: `004-heranca-e-sincronia`
> Data: `2026-09-09`
> Público: quem vai exercer a feature pela primeira vez, incluindo você mesmo daqui a meses

Este roteiro é executável de cima para baixo, do terminal, na raiz do repositório. A primeira parte
não precisa de interface gráfica e prova quase tudo. A segunda precisa do editor aberto e prova
apenas o sexto item do cabeçalho.

## Antes de começar

Você precisa de Node instalado, das dependências do projeto e, para os passos que comparam com as
origens, das duas origens no disco. Nesta máquina elas estão em
`/workspaces/iagoleal/HARNESS/scrum-harness` e `/workspaces/iagoleal/dev/vscode-kanban`.

```bash
npm install
```

## Parte 1, sem interface gráfica

### 1. Declarar onde as origens estão

O repositório versiona apenas o exemplo. O arquivo real é seu, e o git o ignora.

```bash
cp heranca.origens.exemplo.yml heranca.origens.yml
$EDITOR heranca.origens.yml
```

Ajuste os dois caminhos para os desta máquina. Se você pular este passo, o verificador ainda roda:
ele relata as duas origens como indisponíveis e diz exatamente qual arquivo criar.

### 2. Rodar o verificador completo

```bash
npm run check:heranca
```

O relatório sai em dois blocos, um por origem, cada um com veredito próprio, e termina com um
veredito geral. Numa árvore intacta, os dois dizem alinhado e o comando sai com código zero. O
bloco do kit não lista arquivo algum, por definição, e compara apenas a versão declarada com a que
a origem tem hoje.

### 3. Ver o que acontece quando a origem não está

```bash
sed -i 's|scrum-harness: .*|scrum-harness: /pasta/que/nao/existe|' heranca.origens.yml
npm run check:heranca
git checkout heranca.origens.yml 2>/dev/null || cp heranca.origens.exemplo.yml heranca.origens.yml
```

O bloco daquela origem sai marcado indisponível, com o caminho declarado ecoado, e as conferências
de carimbo, manifesto e resumo aparecem concluídas assim mesmo. O comando termina com sucesso,
porque origem ausente é estado relatado e não erro.

### 4. Ver o que acontece com uma edição local

```bash
echo '// mexida à mão' >> src/heranca/reversa-domain/src/state.ts
npm run check:heranca
git checkout src/heranca/reversa-domain/src/state.ts
```

O arquivo aparece como editado localmente, nomeado pelo caminho e atribuído à origem a que pertence.
Não confunda com origem avançou: aquele é o caso em que a cópia confere com o manifesto e a origem
é que mudou.

### 5. Ver um arquivo que ninguém manifestou

```bash
touch src/heranca/reversa-domain/src/intruso.ts
npm run check:heranca
rm src/heranca/reversa-domain/src/intruso.ts
```

Ele é relatado como não manifestado. O caminho inverso, uma entrada do manifesto sem arquivo no
disco, é relatado como ausente do disco.

### 6. Ver o manifesto inválido falhar como deve

```bash
cp src/heranca/manifesto.yml /tmp/manifesto.bak
printf '\n  isto: [não fecha\n' >> src/heranca/manifesto.yml
npm run check:heranca; echo "código de saída: $?"
cp /tmp/manifesto.bak src/heranca/manifesto.yml
```

A mensagem nomeia o defeito e a linha, o código de saída é diferente de zero, e nenhuma linha de
relatório de conferência é impressa. Relatório parcial que pareça íntegro é o que esse
comportamento existe para evitar.

### 7. Rodar a suíte inteira

```bash
npm test
```

As suítes herdadas do modelo e da sonda rodam junto com as locais, pelo mesmo comando. As suítes
novas desta feature cobrem os oito estados do relatório, as três recusas do ressincronizador e a
coerência entre a constante gerada e o manifesto.

### 8. Ver a conferência local dentro do build

```bash
npm run build
echo '// mexida à mão' >> src/heranca/reversa-probe/src/files.ts
npm run build; echo "código de saída: $?"
git checkout src/heranca/reversa-probe/src/files.ts
```

O primeiro build passa. O segundo falha antes de compilar, nomeando o arquivo. Só a família local de
conferências roda aqui: a comparação com as origens continua sob demanda, para que o build não
dependa de repositório vizinho.

### 9. Conferir a constante que o painel usa

```bash
cat src/host/inheritance.ts
grep -n 'revisao:' src/heranca/manifesto.yml
```

Os dois precisam dizer a mesma revisão. Se discordarem, a suíte de coerência falha, e o conserto é
rodar `npm run gen:heranca`. Quem regenera a constante é o build, nunca o ressincronizador.

### 10. Ensaiar uma ressincronização de verdade

Como a origem está hoje exatamente na revisão copiada, o caminho honesto de exercitar o comando é
apontar a configuração para uma cópia da origem e adiantá-la à mão.

```bash
cp -r /workspaces/iagoleal/HARNESS/scrum-harness /tmp/origem-ensaio
echo '// linha nova na origem' >> /tmp/origem-ensaio/packages/reversa-domain/src/state.ts
sed -i 's|scrum-harness: .*|scrum-harness: /tmp/origem-ensaio|' heranca.origens.yml
npm run check:heranca
npm run sync:heranca
git diff --stat
```

O verificador relata que a origem avançou e nomeia o arquivo. O ressincronizador copia, reaplica as
três adaptações, reescreve os carimbos e atualiza o manifesto, sem criar commit. O diff do git é a
revisão humana, e descartá-lo é como se desfaz tudo.

```bash
git checkout src/heranca && rm -rf /tmp/origem-ensaio
cp heranca.origens.exemplo.yml heranca.origens.yml
```

### 11. Ver as duas recusas do ressincronizador

Com o ensaio ainda montado, faça o mesmo caminho duas vezes mais. Primeiro edite um arquivo herdado
à mão antes de ressincronizar: a execução para antes de escrever qualquer coisa e oferece as duas
saídas, declarar a adaptação ou descartar a edição. Depois altere, na cópia da origem, a linha de
importação que a adaptação A1 substitui: a execução para nomeando o arquivo e o trecho, e nenhum
outro arquivo é tocado.

### 12. Ler o ritual onde ele mora

```bash
grep -n -A 20 'Ritual' README.md
```

A seção nomeia os três sinais de disparo, o comando do verificador, o comando do ressincronizador, o
que fazer quando ele para, e o limite conhecido: resumo que confere não garante comportamento igual.

## Parte 2, dentro do editor

### 13. Abrir a janela de desenvolvimento

```bash
npm run build
```

Depois, no editor, inicie a extensão em modo de desenvolvimento e abra o painel do Reversa na barra
lateral.

### 14. Conferir o sexto item do cabeçalho

O cabeçalho deve trazer, ao lado da versão do Reversa lida, a revisão do modelo herdado em forma
abreviada, com sete caracteres. Abra o painel numa pasta sem Reversa instalado para ver o outro
caso: o item mostra `não declarado`, e nenhum dos outros itens é afetado.

## Onde olhar quando algo der errado

| Sintoma | Onde olhar |
|---------|------------|
| O verificador diz que não encontra a origem | `heranca.origens.yml`, a chave que a mensagem nomeia |
| O verificador falha sem imprimir relatório | O manifesto está inválido; a mensagem traz a linha |
| Um arquivo aparece como editado localmente e você não o editou | Provavelmente uma ressincronização foi interrompida no meio; descarte o diff com o git e rode de novo |
| O painel mostra revisão diferente do manifesto | A constante ficou velha; rode `npm run gen:heranca` |
| O build falha nomeando arquivo herdado | É a conferência local de RF-19; ou reverta a edição, ou declare a adaptação |
| A suíte de paridade do gancho falha depois de ressincronizar | O fixture preso por paridade externa foi tocado; esse caso exige decisão humana, e o relatório o marca |
