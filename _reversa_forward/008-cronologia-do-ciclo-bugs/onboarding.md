# Onboarding: cronologia do ciclo de bugs

> Identificador: `008-cronologia-do-ciclo-bugs`
> Data: `2026-09-10`
> Roadmap: `_reversa_forward/008-cronologia-do-ciclo-bugs/roadmap.md`

Passo a passo para quem vai conferir esta feature pela primeira vez, sem conhecer o código. Cada
passo diz o comando, o que deve aparecer e o que significa não aparecer. Rode na raiz do
repositório.

## 1. Preparar

```bash
npm install
npm run build
npm test
```

A construção confere a herança, gera as constantes, compila o host e empacota a tela. A suíte não
abre navegador nem rede.

## 2. Ver o que o painel vai ler

Antes de abrir o painel, olhe a matéria-prima, que é o que o bloco desenha:

```bash
ls _reversa_bugs/*/bugs/
head -12 _reversa_bugs/painel-do-processo/bugs/*/bug.md
cat _reversa_bugs/painel-do-processo/bugs/*/DONE.md
```

Hoje o registro tem um contexto e três bugs, todos com `status: resolved` e todos com trava. Guarde
os três títulos e as três datas de `updated`: é contra eles que os próximos passos se conferem.

## 3. Abrir o painel

```bash
npm run preview
```

Abra o endereço impresso. O bloco de bugs deve aparecer logo depois do histórico das entregas, e
deve aparecer **recolhido**, como o histórico. Abra-o.

O que precisa estar na tela:

- No topo, total três, resolvidos três, abertos zero e ativos zero, com os zeros escritos por nome,
  e não omitidos.
- Uma barra cheia, porque três de três estão resolvidos, com a mesma frase em texto ao lado dela.
- Um subtítulo com o nome do contexto, `painel-do-processo`, e a mesma repartição do topo, que aqui
  coincide por haver um contexto só.
- Três linhas, cada uma com identificador, apelido, título, estado, fase, severidade, prioridade,
  data de registro, data da última alteração e data de encerramento.
- Nenhuma linha marcada como próximo a tratar, porque nenhum bug está aberto, e uma frase dizendo
  que nada aguarda tratamento.

Se o bloco aparecer aberto, RF-01 quebrou. Se aparecer antes do histórico, a ordem quebrou.

## 4. Conferir que a data é a do registro, e não a do disco

```bash
touch _reversa_bugs/painel-do-processo/bugs/*/bug.md
```

Releia o processo no painel, pelo botão de reler. As datas exibidas **não** podem mudar: elas vêm de
`created` e `updated`, e a data de modificação do arquivo está recusada por RN-06.

Confira também que nenhuma data recuou um dia em relação ao que você leu no passo 2. Um dia a menos
é o sintoma de conversão indevida de fuso, que D-05 existe para impedir.

## 5. Conferir que a projeção não influencia nada

```bash
mv _reversa_bugs/painel-do-processo/generated /tmp/generated-guardado
```

Releia o processo. O bloco deve desenhar exatamente o mesmo conteúdo. Depois devolva:

```bash
mv /tmp/generated-guardado _reversa_bugs/painel-do-processo/generated
```

Se algo mudou na tela, o painel está lendo projeção, o que RF-11 proíbe.

## 6. Ver o próximo a tratar e a ordem entre grupos

Este passo precisa de um registro maior que o real, então trabalhe numa cópia:

```bash
cp -R . /tmp/reversa-bugs-teste 2>/dev/null; cd /tmp/reversa-bugs-teste
```

Crie dois contextos com bugs abertos, copiando uma pasta de bug existente e editando o front matter
para `status: open`, uma `updated` mais recente num deles, e apagando o `DONE.md` da cópia. Depois:

```bash
node scripts/preview.js --workspace=/tmp/reversa-bugs-teste
```

O que precisa estar na tela:

- O grupo cujo bug se mexeu mais recentemente vem primeiro.
- Dentro de cada grupo, os não encerrados aparecem à frente dos encerrados.
- **Exatamente uma** linha do bloco inteiro carrega a marca de próximo a tratar, e é a do primeiro
  bug não encerrado do primeiro grupo. Duas marcas é defeito de RN-10.
- A faixa de bloqueio, no topo do painel, ganha uma linha por bug em espera por decisão, com
  bloqueio declarado ou de severidade alta ainda aberto, cada uma nomeando a razão. Um bug que reúna
  duas razões ocupa uma linha só.

## 7. Ver o recorte de cada grupo

Ainda na cópia, faça um dos contextos passar de cinco bugs encerrados. Recarregue o painel:

- Cada grupo mostra por padrão os não encerrados dele e os cinco encerrados mais recentes, e diz
  quantos ficaram ocultos.
- Acionar o controle de um grupo revela o resto **daquele** grupo, na mesma ordem em que os cinco
  apareciam, e não mexe nos outros.
- Recolher e reabrir o painel não guarda essa escolha: revelar é estado do momento, não preferência.

## 8. Ver a degradação nomeada

Ainda na cópia, estrague de propósito:

```bash
# 1. front matter truncado
sed -i '' '3,8d' <uma pasta de bug>/bug.md
# 2. estado desconhecido
sed -i '' 's/^status: .*/status: quase-resolvido/' <outra pasta>/bug.md
# 3. trava sem estado resolvido
sed -i '' 's/^status: .*/status: open/' <uma pasta que tenha DONE.md>/bug.md
```

Recarregue. O bloco deve continuar desenhando os demais bugs, e a seção de anomalias deve trazer uma
entrada por estrago, com arquivo, código e detalhe. O bug com trava sobre estado não resolvido deve
aparecer na lista **com a inconsistência declarada**, e o painel não pode escolher entre as duas
leituras.

## 9. Ver os dois estados vazios

```bash
mv _reversa_bugs /tmp/bugs-guardado
```

Recarregue. O bloco deve explicar que não há registro de bugs neste projeto, e isso **não** pode
gerar anomalia: registro ausente é ausência, não perda. Depois devolva a pasta.

Para o outro estado vazio, marque um bug com `visibility: restricted`. Nenhum campo dele pode
aparecer na tela, ele continua contado no total, e o bloco declara que há registro omitido por
restrição.

## 10. Conferir que nada foi escrito

De volta ao repositório de verdade:

```bash
git status --short
```

Nada em `_reversa_bugs/` pode aparecer modificado por ter aberto o painel. A extensão lê e não
escreve, e este é o passo que confirma.

## 11. Medir o pacote

```bash
npm run build
npm run empacotar
```

A saída imprime o tamanho ao lado do teto, para a tela e para a extensão. Os dois precisam estar
abaixo. Se o pacote da tela passar de 400 KiB, o cartão novo cresceu além do orçamento e a saída é
enxugar o cartão, nunca afrouxar o teto.
