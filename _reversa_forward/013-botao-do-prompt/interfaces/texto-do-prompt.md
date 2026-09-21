# Contrato: o texto do prompt de correção

> Identificador: `013-botao-do-prompt`
> Data: `2026-09-20`
> Partes: `src/webview/domain/prompt.ts` (painel) e `scripts/prompt-harness.js` (manutenção)
> Verificado por: a suíte de paridade da decisão D-09 do roadmap

Este não é contrato de rede: é contrato entre **duas implementações do mesmo texto**, que existem
apartadas porque uma é compilada no pacote da extensão e a outra é carregada por `node` sem construir.
Enquanto as duas produzirem o mesmo texto sobre a mesma entrada, a duplicação é custo de fronteira;
no dia em que divergirem, o prompt do comando deixa de ser o prompt do painel sem que ninguém perceba.
O contrato existe para que esse dia falhe na suíte.

## 1. Entrada

| Parte | O que recebe |
|---|---|
| Painel | A carga da leitura, `SetProcessData`, de onde tira a raiz observada e os checkpoints do eixo |
| Manutenção | Uma lista de `{projeto, raiz, agente, situacao, formaElidida, camposComLista}`, apurada pela varredura |

A forma canônica da unidade, que as duas partes precisam produzir internamente antes de escrever o
texto, é o **caso**:

```
Caso = {
  projeto: string | null,   // nulo quando o state.json não declara `project`
  raiz: string,             // caminho absoluto da raiz onde o state.json foi lido
  agente: string,           // a chave do mapa de checkpoints
  fase: string | null,      // `phase` como o arquivo a traz, para a leitura humana
  camposComLista: string[],
  formaElidida: Record<string, string | number | boolean | null> | null,
}
```

## 2. Saída: a ordem das partes

O texto tem cinco partes, nesta ordem, e a ordem é parte do contrato porque um leitor que comparou o
texto de ontem deve reencontrar as linhas nos seus lugares.

1. **Título e onde colar.** Uma linha de título e uma frase dizendo que o texto deve ser colado numa
   sessão aberta na raiz que grava o `state.json`, com a raiz nomeada. Havendo mais de uma raiz, como
   só acontece no comando de manutenção, a frase passa a dizer que cada bloco nomeia a sua.
2. **A norma.** Que `completed_at` e `files` são o par que declara conclusão no esquema do Reversa, e
   que o guia de checkpoint é quem o manda. Aqui vale a restrição da RN-17: o texto diz onde o guia
   costuma morar nas instalações e **não** afirma que o arquivo existe naquela raiz. Nenhum número de
   medição externa entra, pela RN-03.
3. **Os casos**, um bloco por caso, na ordem em que a entrada os trouxe. Cada bloco traz o projeto e o
   agente no cabeçalho, a fase quando houver, a situação lida em palavras, os campos com lista de
   textos nomeados sem serem chamados de saídas, e a forma elidida num bloco cercado. Falta a forma,
   por host anterior ao campo, e o bloco cercado simplesmente não aparece.
4. **Os quatro pedidos**, numerados e nesta ordem: confirmar se o agente concluiu, olhando as saídas
   que lista e o que existe em disco; gravar `completed_at` e `files` com o instante real, preservando
   os campos que já estão lá; dizer qual `SKILL.md` ou instrução mandou gravar o checkpoint sem nomear
   `completed_at`; propor a correção na fonte sem aplicá-la.
5. **O que não fazer**, quatro proibições: não renomear campo existente, não normalizar valor, não
   reescrever o `state.json` inteiro, não mexer em checkpoint de outro agente.

## 3. O que o texto nunca contém

- Conteúdo de campo elidido: lista, texto longo, caminho de sistema e objeto aparecem como marcador
  de forma, nunca como valor.
- Número de medição que o painel não leu, como a quantidade de projetos desviantes ou de vocabulários.
- Afirmação de que um arquivo não lido existe, o guia de checkpoint incluído.
- Instante de conclusão apresentado como conclusão: um campo de data que apareça na forma elidida é
  dado do caso, e o texto não o promove a prova de que o trabalho terminou.
- Menção a checkpoint reconhecido por par aprovado, ou a chave aprovada como registro que não é
  agente. Quem já foi decidido por gente não volta à fila.

## 4. Determinismo

O texto é função pura da entrada, nos dois lados. Nada consulta relógio, ambiente, variável de
processo ou aleatoriedade. Duas montagens sobre a mesma entrada produzem o mesmo texto byte a byte, e
é isso que permite ao painel oferecer cópia e documento sem que os dois discordem na mesma sessão.

No comando de manutenção vale a mesma exigência com uma consequência a mais: a ordem dos casos segue a
ordem estável da varredura, projeto a projeto e, dentro do projeto, a ordem em que o arquivo escreve
os checkpoints. Ordenação por conveniência de leitura seria ordenação a decidir, e duas execuções
sobre o mesmo disco têm de produzir o mesmo arquivo.

## 5. O que a paridade compara

A suíte monta a mesma lista de casos, entrega-a às duas implementações e compara o texto inteiro.
Compara o texto, e não um resumo dele: comparar tamanho, ou as primeiras linhas, deixaria passar
exatamente a divergência que interessa. A fixtura é a dos três casos medidos, mais um caso sem forma
elidida, que é o host anterior, e um caso sem projeto declarado.

Alterar uma das implementações sem alterar a outra faz a suíte falhar nomeando a linha divergente. É
o mesmo desenho de `tests/limites.spec.ts`, que já importa um módulo de `scripts/` de dentro da suíte,
e de `hook-parity.spec.ts`, que confronta a transcrição com a origem em vez de acreditar nela.

## 6. Limites

| Limite | Valor | Onde é aplicado |
|---|---|---|
| Bytes por texto enviado ao host | `SUMMARY_TEXT_CAP`, 65.536 | `src/host/router.ts`, que recusa acima disso nomeando o tamanho recebido |
| Tamanho observado do texto manual de referência, com três casos | 4.492 bytes | `perguntas/prompt-harness.md`, o modelo escrito à mão em 2026-09-20 |
| Caracteres de texto preservados pela elisão | 40 | `src/domain/elisao.ts` e a origem em `scripts/equivalencias/elidir.js` |

A folga entre o texto de referência e o teto é de mais de dez vezes, e por isso o teto é guarda e não
limite que alguém esteja encostando. No comando de manutenção não há teto de canal, porque não há
canal: o texto vai para arquivo.

## 7. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-plan` | reversa |
