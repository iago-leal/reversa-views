# Ideation, reversa-views

> Selo 🟡 PLANEJADO em todos os itens, sujeito a validação.

## Brief original
Criar uma extensão para o VSCode com o intuito de visualizarmos o pipeline do Reversa.
A ideia é que seja similar ao que há em `~/HARNESS/scrum-harness`.

## Problema
🟡 O Reversa não possui runtime próprio: todo o processo observável vive em arquivos deixados
no disco, espalhados por `.reversa/`, `_reversa_sdd/` e `_reversa_forward/`. A única interface
hoje é `reversa status`, que imprime projeto, fase e duas listas, e nada mais.

Quem sente o problema é o mantenedor que conduz o pipeline, em dois momentos definidos. Primeiro,
ao retomar o trabalho depois de uma pausa, quando reconstruir o estado exige abrir meia dúzia de
arquivos. Segundo, a cada troca de agente, quando é preciso saber se o estágio anterior de fato
fechou. Em ambos os casos, a informação existe, mas custa uma leitura manual que pressupõe
conhecer o layout e as regras de derivação, como a que determina o estágio físico pelos artefatos
presentes na pasta da feature em vez do campo `current-stage`, declaradamente informativo.

## Valor entregue
🟡 Ver, sem sair do editor e sem abrir arquivo algum, em que ponto do pipeline o Reversa está
e o que o está bloqueando.

## Alternativas existentes
🟡 Quatro caminhos já disponíveis, e por que nenhum basta:

1. **`reversa status` na linha de comando.** Mostra projeto, fase e duas listas. Ignora
   inteiramente os eixos forward, impacto, regressão, migração e ideação, que é onde mora a
   informação acionável.
2. **Leitura manual dos arquivos.** Funciona e é a prática atual. Cobra o conhecimento do
   layout e das derivações não escritas, além de vários passos por consulta.
3. **Painel Reversa do `scrum-harness`.** Já resolve o problema com competência, em três
   camadas testadas. Exige rodar a GUI web do DeepSeek Harness, portanto viver fora do editor
   onde o trabalho acontece.
4. **Extensões genéricas de Markdown e JSON.** Renderizam texto; não conhecem processo, não
   derivam estágio, não sinalizam bloqueio.

## Público-alvo (bruto)
🟡 O próprio mantenedor do projeto: desenvolvedor intermitente, único responsável, que conduz o
Reversa dentro do VSCode e precisa recuperar contexto depois de semanas ou meses de pausa.

## Métricas de sucesso
🟡 **Retomada após pausa longa.** Retomar um projeto Reversa parado há trinta dias ou mais e
identificar o próximo passo sem reler documentação e sem inspecionar arquivos.
Unidade: proporção de retomadas bem-sucedidas nessas condições. Alvo: todas elas.

## Premissas a validar
🟡 Três premissas, da mais perigosa para a menos:

1. ~~**O VSCode é onde o Reversa é conduzido.**~~ **VALIDADA pelo usuário em 2026-09-09.** A extensão
   abre no VSCode e já mostra onde o pipeline está, lendo os JSON e demais arquivos que o Reversa
   usa. O painel é a superfície de consulta; a condução segue onde já acontece.
2. **Leitura sob demanda basta.** Um botão de atualizar não irrita a ponto de exigir observação
   contínua do disco. Se irritar, o desenho precisa de `FileSystemWatcher` desde o início.
   Parcialmente decidida em 2026-09-09: a leitura na ativação é obrigatória, porque abrir e já ver é o
   requisito; o que segue em aberto é apenas a atualização automática depois disso.
3. **O modelo vendorizado acompanha o Reversa.** A sincronia depende inteiramente de o ritual de
   ressincronização ser cumprido, não de qualquer garantia técnica. Se o Reversa mudar de formato
   e o ritual falhar, o painel passa a mentir em silêncio, que é o pior desfecho possível.

## Notas
🟡 **Sobre a procedência das respostas.** As respostas 1 a 4 e 6 foram inferidas pelo orquestrador
a partir do reconhecimento do código e apresentadas ao usuário para contestação, não colhidas em
entrevista. Apenas a métrica de sucesso foi escolhida diretamente por ele. O selo 🟡 vale para
todas, com atenção redobrada às inferidas.

🟡 **Achado que redefine o escopo.** O `~/HARNESS/scrum-harness` não contém extensão do VSCode.
Contém um painel Reversa dentro da GUI web do DeepSeek Harness, já repartido em três camadas:

| Camada | Pacote | Papel | Portabilidade |
|---|---|---|---|
| Model | `@scrum-harness/reversa-domain`, ~1.674 LOC, 16 suítes | Lê o processo e julga; puro, sem `node:fs` | Total |
| Controller | `@scrum-harness/reversa-probe`, ~450 LOC, 4 suítes | Único ponto que toca o disco, só leitura | Alta, menos a rota HTTP |
| View | `Reversa.tsx` e afins, ~820 LOC | Seção React presa ao host web | Baixa |

Logo, o projeto é uma troca de hospedeiro da View, não uma reconstrução da leitura.

🟡 **Oito eixos já modelados.** Descoberta com cinco fases e checkpoints, ciclo forward com sete
estágios físicos, trilha de execução do `progress.jsonl`, política de escrita no legado, impacto
no legado, regressão vigiada, migração e ideação. Há ainda um log de anomalias transversal e o
relatório do que a sonda recusou ler, ambos exibíveis.

🟡 **Sem servidor HTTP no meio, decidido em 2026-09-09.** O usuário fixou que a extensão lê
diretamente os arquivos do Reversa. O painel do `scrum-harness` busca o processo por
`GET /scrum-api/reversa` porque a View dele roda no navegador e não pode tocar o disco; numa
extensão do VSCode o código roda em Node, então a sonda lê direto e entrega o resultado ao
webview por mensagem. A camada de rota do probe fica fora da vendorização, e com ela saem a
exigência de workspace absoluto na query e o tratamento de falha de transporte.

🟡 **Restrição herdada, não negociável.** Leitura apenas. A segurança do Reversa repousa em as
escritas ficarem confinadas às pastas dele, e `.reversa/reversa-config.json` é ato exclusivo do
usuário. A extensão observa; jamais escreve.

🟡 **Decisão de arquitetura já tomada.** Vendorização carimbada do Model e do Controller, com
cabeçalho de origem, versão e data, mais ritual de ressincronização documentado. Justificativa
completa em `newproject-brief.md`.

🟡 **Alinhamento de versão confirmado.** O `scrum-harness` roda Reversa 1.3.3, a mesma versão
instalada neste projeto, de modo que o modelo vendorizado nasce alinhado ao framework real.

---
Gerado por reversa-ideator em 2026-09-09T10:33:34Z
Fonte: newproject-brief.md
