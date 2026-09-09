# Brief inicial, /reversa-new

> Selo 🟡 PLANEJADO. Documento de entrada do time Code New Project Agents.

**Data:** 2026-09-09T10:29:38Z
**Usuário:** iago

## Ideia original
Criar uma extensão para o VSCode com o intuito de visualizarmos o pipeline do Reversa.
A ideia é que seja similar ao que há em `~/HARNESS/scrum-harness`.

## Reconhecimento prévio do orquestrador

O `~/HARNESS/scrum-harness` **não** contém uma extensão do VSCode. O que ele contém é um
painel Reversa completo dentro da GUI web do DeepSeek Harness, repartido em três camadas:

| Camada | Pacote | Papel | Portabilidade |
|---|---|---|---|
| Model | `@scrum-harness/reversa-domain` (~1.674 LOC + 16 suítes) | Lê o processo observável do Reversa e julga; puro, sem `node:fs` | Total, é TypeScript puro |
| Controller | `@scrum-harness/reversa-probe` (4 módulos + 4 suítes) | Único ponto que toca o disco, só leitura; monta o `ReversaSnapshot` e responde `GET /scrum-api/reversa` | Alta, menos a rota HTTP |
| View | `@scrum-harness/ui` → `Reversa.tsx`, `reversa-view.ts`, `reversa-api.ts` (~820 LOC) | Seção React do quadro, com pipeline, política, impacto e diagnóstico | Baixa, presa ao host DeepSeek Harness |

Logo, a demanda não é reconstruir a leitura do Reversa, e sim **trocar o hospedeiro da View**:
o que hoje é uma aba de conversa num servidor web passaria a ser um webview do VSCode.

### Eixos que o modelo já cobre
Descoberta (5 fases e checkpoints), ciclo forward (7 estágios físicos, ações, dúvidas,
features pausadas, adendos), trilha de execução (`progress.jsonl`), política de escrita no
legado, impacto no legado, regressão vigiada, migração e ideação. Há ainda um log de
anomalias transversal e um relatório do que a sonda recusou ler.

### Restrição herdada, não negociável
Leitura apenas. A segurança do Reversa repousa em as escritas ficarem confinadas às pastas
dele, e `.reversa/reversa-config.json` é ato exclusivo do usuário. A extensão observa; nunca
escreve.

---
Gerado por /reversa-new em 2026-09-09T10:29:38Z

## Decisões tomadas na abertura do pipeline

**Reuso do `scrum-harness`: vendorização carimbada.** O `reversa-domain` e o `reversa-probe`
são copiados para dentro deste projeto com cabeçalho de origem, versão e data, mais um ritual
de ressincronização documentado. O critério foi a longevidade sob manutenção intermitente:
dependência por caminho relativo cruzaria `~/dev` até `~/HARNESS` e arrastaria as dependências
`file:` do `deepseek-harness`, deixando o clone não-buildável; a extração para pacote comum
resolveria melhor, mas exige mexer nos dois repositórios agora. O preço aceito é a divergência
silenciosa, paga com o ritual de ressincronização.

**Modo do pipeline: guiado.** Um agente por vez, com aprovação entre eles, terminando nas
specs SDD.
