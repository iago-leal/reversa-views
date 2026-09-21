# Interface: comando de contagem das anomalias da raiz

> Identificador: `015-fases-fora-do-canone`
> Data: `2026-09-21`
> Tipo: linha de comando, só de leitura
> Consumido por: quem mantém o painel, e por `aprender-equivalencias.js` e `promover-equivalencias.js` ao fim de cada rodada

## 1. Invocação

```bash
npm run contar:anomalias -- <raiz>            # tabela em texto
npm run contar:anomalias -- <raiz> --json     # saída estruturada
```

`<raiz>` é obrigatória. Projeto é toda subpasta direta da raiz que tenha `.reversa/state.json`. A
casca é `scripts/contar-anomalias.js`; a lógica é `src/cli/contagem.ts`, compilada em `out-cli/`, e
`precontar:anomalias` a constrói.

## 2. O que é contado

Para cada projeto, a lista que o painel **exibe**: `readWorkspace` seguido de `composeAnomalies`, as
mesmas duas funções da tela e do terminal. Anomalia descontada não conta; anomalia do eixo conta.
Nada é relido por outro caminho, e é isso que sustenta a afirmação de que a soma bate com a das
leituras individuais.

## 3. Saída em texto

```text
Anomalias exibidas em /Users/.../dev: 64 projetos lidos, 1 sem leitura

código                               ocorrências  projetos  mapa
config-ausente                                56        56
fase-desconhecida                             43         6  alcança
...
total                                        184
```

Ordenada por ocorrências, depois por código. A coluna `mapa` marca os códigos ao alcance do mapa de
equivalências, que são `checkpoint-sem-conclusao-declarada` e `fase-desconhecida`. Projeto cuja
leitura falhou é contado à parte e nomeado abaixo da tabela, e não some da conta.

Os números do exemplo são os da medição manual de 2026-09-21, anterior à feature, que subestimava
as anomalias de linha longa.

## 4. Saída em `--json`

```json
{
  "raiz": "/Users/.../dev",
  "projetos": 64,
  "semLeitura": ["nome-do-projeto"],
  "total": 184,
  "codigos": [
    {"codigo": "config-ausente", "ocorrencias": 56, "projetos": 56, "aoAlcanceDoMapa": false}
  ],
  "porProjeto": {"afla": {"fase-desconhecida": 15}}
}
```

`porProjeto` existe para que a suíte confira a soma sem interpretar texto. Só vai para a saída
padrão o documento; o progresso vai para a saída de erro.

## 5. Erros e códigos de saída

| Situação | Código | Mensagem |
|---|---|---|
| Contagem feita, com ou sem anomalias | 0 | a tabela ou o documento |
| Raiz ausente, inexistente ou que não é pasta | 2 | nomeia o caminho |
| `out-cli/` não construído | 2 | nomeia `npm run compile:cli`, como o painel |
| Leitura de um projeto falhou | 0 | o projeto entra em `semLeitura`; a contagem segue |

Ter anomalias não é falha: o comando mede, não julga.

## 6. Uso pelos dois scripts

O aprendizado chama a contagem com o mapa vigente. A promoção chama com o mapa **que acabou de
fundir**, passado por parâmetro, de modo que o número impresso já reflete a aprovação sem que nada
precise ser recompilado. Sem `out-cli/`, os dois nomeiam o comando de construção e terminam com o
código que teriam sem a contagem.

## 7. Promessas negativas

Não escreve arquivo algum, não fala com o motor, não abre rede e não lê nada fora da raiz dada.
`git status` depois de rodar é o de antes.
