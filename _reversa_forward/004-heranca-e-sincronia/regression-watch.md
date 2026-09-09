# Regression watch: herança e sincronia

> Identificador da feature: `004-heranca-e-sincronia`
> Data da criação: `2026-09-09`
> Gerado por: `/reversa-coding`

**Feature greenfield.** Segue não havendo extração `/reversa` sobre este repositório, e sem extração
não há regras 🟢 a vigiar: o watch principal nasce vazio por definição, e não por omissão. É o mesmo
estado em que as features 001, 002 e 003 deixaram os seus.

O que esta entrega implementa ganha peso de regressão quando uma extração futura sobre este código o
confirmar como 🟢. Até lá, os requisitos ficam na seção "Observações", como registro do que essa
extração precisará reencontrar.

Os identificadores continuam a numeração: a feature 001 usou `W001` a `W018`, a 002 usou `W019` a
`W041`, a 003 usou `W042` a `W075`, e esta usa `W076` em diante. Nenhum identificador antigo foi
reciclado nem reescrito.

## Watch

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| | | | | |

Vazio. Nenhuma regra 🟢 foi alterada ou removida, porque nenhuma existia.

## Histórico de re-extrações

| Data | Extração | Itens conferidos | Itens violados |
|------|----------|------------------|----------------|
| | | | |

Vazio. Será preenchido pelo agente reverso quando `/reversa` rodar sobre este repositório.

## Arquivadas

| ID | Motivo do arquivamento | Data |
|----|------------------------|------|
| | | |

Vazio.

## Observações

Sem peso de regressão. São os requisitos que esta entrega implementa e o que uma extração futura
precisaria reencontrar para confirmá-los. Os identificadores são estáveis e serão reciclados quando
algum destes virar item de watch.

| ID | RF | O que a entrega implementou | Onde vive |
|----|----|-----------------------------|-----------|
| W076 | RF-01 | Manifesto único em YAML com as duas origens e os 37 arquivos herdados, cada um com origem, caminho na origem, marca de carimbo, resumo e data da cópia | `src/heranca/manifesto.yml`, `scripts/heranca/inventario.js` |
| W077 | RF-02 | As três adaptações migradas da prosa para dado, com trecho original e adaptado literais, aproveitáveis byte a byte na busca exata | `src/heranca/adaptacoes.yml` |
| W078 | RF-03 | Conferência de presença, carimbo, coerência entre carimbo e manifesto e resumo do conteúdo, arquivo a arquivo | `scripts/heranca/verificar.js`, `scripts/heranca/carimbo.js` |
| W079 | RF-04 | Comparação com a origem aplicando as adaptações declaradas ao conteúdo dela antes de confrontar, com relato de origem que avançou | `scripts/heranca/verificar.js`, `scripts/heranca/adaptacoes.js` |
| W080 | RF-05 | Origem ausente relatada como indisponível, com as demais conferências concluídas e código de saída zero | `scripts/heranca/origens.js`, `scripts/heranca/verificar.js` |
| W081 | RF-06 | Arquivo sob a pasta da herança fora do manifesto e arquivo do manifesto ausente do disco, ambos apontados pelo caminho | `scripts/heranca/verificar.js`, `scripts/heranca/leitura.js` |
| W082 | RF-07 | Arquivo novo na origem listado sem ser copiado, porque copiar é decisão humana | `scripts/heranca/verificar.js`, `scripts/heranca/leitura.js` |
| W083 | RF-08 | Saída organizada em bloco por origem, com veredito por bloco e veredito geral, sem defasagem de uma origem aparecer dentro da outra | `scripts/heranca/relatorio.js` |
| W084 | RF-09 | Origens localizadas por arquivo de configuração local ignorado pelo git, com exemplo versionado ao lado e mensagem que nomeia arquivo e chave | `heranca.origens.exemplo.yml`, `scripts/heranca/origens.js` |
| W085 | RF-10 | Ressincronizador em duas fases, com adaptações reaplicadas por busca exata, carimbos e manifesto atualizados, e parada com relatório quando a adaptação não casa | `scripts/heranca/ressincronizar.js`, `scripts/ressincronizar-heranca.js` |
| W086 | RF-11 | Recusa de sobrescrever arquivo com edição local não declarada, oferecendo as duas saídas: declarar a adaptação ou descartar a edição | `scripts/heranca/ressincronizar.js` |
| W087 | RF-12 | Manifesto inválido interrompe antes de qualquer relatório, nomeando defeito e linha, com código de saída próprio | `scripts/heranca/manifesto.js`, `scripts/verificar-heranca.js` |
| W088 | RF-13 | Suítes herdadas rodando pelo comando único de teste, e manifestadas, de modo que sumiço vira achado | `src/heranca/reversa-domain/tests/`, `src/heranca/manifesto.yml` |
| W089 | RF-14 | Revisão do modelo exposta ao host como constante gerada do manifesto, sem leitura de disco em tempo de execução, e sétimo campo em `SetProcessData` | `src/host/inheritance.ts`, `src/host/protocol.ts`, `src/host/provider.ts` |
| W090 | RF-15 | Sexto item do cabeçalho com a revisão abreviada em sete caracteres, dizendo não declarado quando ela faltar | `src/webview/domain/labels.ts`, `src/webview/ui/Header.tsx` |
| W091 | RF-16 | Seção do ritual no README, com os três sinais de disparo, os dois comandos e o que fazer quando o ressincronizador para | `README.md` |
| W092 | RF-17 | Seção 8 do registro em prosa substituída pelo estado entregue, apontando manifesto, adaptações e README | `src/heranca/PROCEDENCIA.md` |
| W093 | RF-18 | Limite conhecido declarado no README: resumo igual não é comportamento igual, dependência transitiva como o caso não coberto, suítes herdadas como a rede que resta | `README.md` |
| W094 | RF-19 | Conferência local encadeada no build, antes da compilação, com a comparação contra as origens deliberadamente fora dele | `package.json`, `scripts/verificar-heranca.js` |
