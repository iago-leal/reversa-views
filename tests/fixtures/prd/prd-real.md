# PRD: reversa-views

> Selo 🟡 PLANEJADO. Documento gerado a partir de ideation + personas.

**Versão:** 1.0
**Data:** 2026-09-09T10:41:16Z
**Autor:** reversa-drafter
**Status:** rascunho

---

## 1. Problema

🟡 O Reversa não possui runtime próprio. Todo o processo que ele executa vive em arquivos deixados
no disco, distribuídos por `.reversa/`, `_reversa_sdd/` e `_reversa_forward/`, e a única interface
disponível é `reversa status`, que imprime projeto, fase e duas listas. A informação existe e está
íntegra; o que falta é uma superfície que a mostre.

O custo dessa ausência não é uniforme. Ele se concentra em dois momentos, e é agudo no primeiro:
quando o contexto se perdeu por causa de uma pausa longa, reconstruir o estado exige abrir vários
arquivos e conhecer regras de derivação que não estão escritas em lugar visível. A mais traiçoeira
delas decide o estágio da feature ativa pelos artefatos fisicamente presentes na pasta, ignorando
de propósito o campo `current-stage`, que o próprio framework declara meramente informativo. Quem
não souber disso lerá o campo e concluirá errado.

### Quem sente
🟡 Duas situações do mesmo mantenedor, detalhadas em `personas.md`:

- **O Retomador**, ao abrir depois de semanas ou meses um repositório cujo estado esqueceu. Sente
  a dor antes de conseguir trabalhar, e é ele que a métrica de sucesso mede.
- **O Operador**, a cada troca de agente durante uma sessão ativa, quando confirmar que o estágio
  anterior fechou custa abrir arquivo ou rodar um comando que mostra pouco.

---

## 2. Personas-alvo

🟡 Referência completa em [`personas.md`](./personas.md). Resumo:

- **O Retomador** (primária): 🟡 mantenedor único que volta a um projeto parado há semanas e
  precisa recuperar o estado antes de agir. Dor: reconstruir o contexto exige leitura manual de
  vários arquivos e conhecimento de derivações não escritas.
- **O Operador**: 🟡 mantenedor em sessão ativa, conduzindo os agentes um após o outro. Dor: a
  confirmação de que o estágio avançou quebra o ritmo da sessão.

---

## 3. Métricas de sucesso

🟡 Uma métrica única, escolhida pelo usuário entre quatro candidatas, deliberadamente ancorada na
persona primária. As demais candidatas foram descartadas por medirem conforto e não a dor que
justifica o projeto.

| Métrica | Unidade | Alvo | Prazo |
|---|---|---|---|
| 🟡 Retomada de projeto parado há 30 dias ou mais, identificando o próximo passo sem reler documentação e sem inspecionar arquivos | 🟡 Proporção de retomadas bem-sucedidas nessas condições | 🟡 Todas elas | 🟡 3 meses após a primeira instalação |

---

## 4. Escopo (in)

🟡 Uma extensão do VS Code que, ao ser aberta, já mostra onde o pipeline do Reversa está, lendo os
arquivos que o framework deixa no disco. Seis eixos na primeira versão, agrupados em núcleo e
diagnóstico:

**Núcleo, o que responde "onde estou e o que faço agora":**

- 🟡 Identidade da instalação: projeto, versão do framework, pastas de saída e forward resolvidas.
- 🟡 Descoberta: as cinco fases canônicas com status derivado, e os checkpoints por agente,
  distinguindo o que terminou do que ainda corre.
- 🟡 Ciclo forward: o estágio físico da feature ativa entre os sete possíveis, a contagem de ações
  fechadas, abertas e emendas, as dúvidas remanescentes, a fila de features pausadas e o adendo.
- 🟡 Bloqueio humano: destaque do que aguarda decisão sua, incluindo a entrega concluída que ainda
  não convergiu na extração, estado que nada hoje anuncia.

**Diagnóstico, o que impede o painel de mentir em silêncio:**

- 🟡 Anomalias: toda degradação que o modelo encontrou ao ler, com arquivo, código e detalhe.
- 🟡 Relatório da sonda: o que ela leu de fato, o que recusou por escapar da raiz e o que truncou
  por exceder o teto de bytes.
- 🟡 Política de escrita no legado: o veredito vigente de `.reversa/reversa-config.json` e as
  pastas em que o Reversa pode escrever.

**Comportamento:**

- 🟡 Leitura automática na ativação, sem comando prévio nem configuração de caminho.
- 🟡 Releitura sob demanda por ação explícita no painel.
- 🟡 Navegação: abrir no editor o arquivo que o painel aponta.
- 🟡 Estado vazio informativo quando o Reversa não está instalado no workspace.

---

## 5. Não-objetivos (out)

🟡 O que fica explicitamente de fora, e por quê:

- 🟡 **Escrita de arquivo por conta própria.** Restrição herdada e não negociável. A segurança do
  Reversa repousa em as escritas ficarem confinadas às pastas dele, e `.reversa/reversa-config.json`
  é ato exclusivo do usuário. A extensão nunca abre um arquivo para escrever, em camada alguma.
- 🟡 **Disparar agentes na primeira versão.** Fora do escopo por agora, e não por princípio. O
  usuário declarou em 2026-09-09 que quer o botão no futuro, de modo que o desenho deve prever o ponto
  de extensão desde já. Ver a seção 10.
- 🟡 **Os eixos de impacto no legado, regressão vigiada, migração, ideação e trilha de execução.**
  O modelo os calcula de graça, mas cada um custa tela, e tela densa contraria a persona primária.
  Ficam para depois da primeira versão, sem reabrir o modelo.
- 🟡 **Servidor HTTP intermediário.** A View do `scrum-harness` busca o processo por rota porque
  roda no navegador; aqui o código roda em Node e lê direto.
- 🟡 **Publicação no VS Code Marketplace.** Distribuição por VSIX local, sem publisher, changelog
  público nem compromisso de suporte a terceiros.
- 🟡 **Suporte a outros editores.** Nada de portar para JetBrains, Neovim ou a GUI web.
- 🟡 **Telemetria e qualquer tráfego de rede em tempo de execução.**

---

## 6. Restrições

| Tipo | Descrição |
|---|---|
| 🟡 Técnica | 🟡 TypeScript sobre a Extension API do VS Code. Host em Node, View em webview, comunicação por mensagem. Sem rede em tempo de execução. |
| 🟡 Técnica | 🟡 Duas origens de herança, com ritmos de sincronia distintos. Do `scrum-harness` vêm o modelo e a sonda, que seguem o Reversa. Do `vscode-kanban`, repositório do próprio usuário, vem o kit de extensão: ponte de mensagens, tema, política de segurança do webview, build de duas unidades e preview fora do editor. Este segundo segue o editor. Reconhecido em 2026-09-09. |
| 🟡 Técnica | 🟡 Todo arquivo herdado carrega cabeçalho com origem, versão e data, mais ritual de ressincronização documentado. Decisão registrada em `newproject-brief.md`. |
| 🟡 Técnica | 🟡 A camada de leitura é read-only por construção: `node:fs` aparece num só módulo, apenas nas funções de leitura, e nada que escreva, crie, remova ou execute é exposto por ela. |
| 🟡 Técnica | 🟡 O invariante que sobrevive à evolução é **a extensão nunca escreve arquivo**. Uma ação futura que dispare agente o faz despachando comando ao terminal, jamais editando disco. As duas capacidades ficam em camadas separadas, e a de leitura nunca ganha a de despacho. |
| 🟡 Técnica | 🟡 A camada de rota do probe fica fora da vendorização, e com ela a exigência de workspace absoluto na query e o tratamento de falha de transporte. |
| 🟡 Prazo | 🟡 Sem prazo externo. O limite real é a atenção intermitente de um mantenedor único, o que empurra o desenho para o menor número de peças que resolve o problema. |
| 🟡 Compliance | 🟡 Nenhuma exigência regulatória. A extensão não coleta, transmite nem armazena dado pessoal; lê arquivos locais do próprio workspace e nada mais. |
| 🟡 Orçamento | 🟡 Zero custo monetário. Toda a stack é gratuita e a distribuição é local. |

---

## 7. Dependências externas

🟡 Nenhuma em tempo de execução. A extensão não fala com serviço, API ou dado remoto.

Em tempo de construção:

- 🟡 `@types/vscode` e a Extension API, para tipagem e contrato do host.
- 🟡 TypeScript, e um empacotador para produzir o bundle da extensão e do webview.
- 🟡 O `scrum-harness` como origem do modelo e da sonda, consultado na cópia inicial e a cada
  ressincronização. Não é dependência de build depois da cópia.
- 🟡 O `vscode-kanban` como origem do kit de extensão, pelo mesmo regime. O que dele se aproveita
  é padrão e decisão, não binário: a ponte de mensagens, o corte de tokens do tema, a política de
  segurança com nonce por script, a separação entre compilador da extensão e empacotador da
  webview, e o preview que serve a interface num navegador fora do editor.
- 🟡 `@primer/primitives` para os tokens de tema, com o corte que o `vscode-kanban` já provou
  necessário, de catorze conjuntos de cor para os que a interface de fato oferece.
- 🟡 O próprio Reversa, versão 1.3.3, como contrato de formato dos arquivos lidos. Confirmado que
  o `scrum-harness` roda a mesma versão instalada aqui, de modo que o modelo nasce alinhado.

---

## 8. Riscos

| Risco | Impacto | Probabilidade | Mitigação proposta |
|---|---|---|---|
| 🟡 O modelo vendorizado diverge do Reversa quando o framework mudar de formato, e o painel passa a mentir sem avisar | 🟡 Alto | 🟡 Média | 🟡 Eixo de diagnóstico no escopo desde a primeira versão; carimbo de versão visível no painel; ritual de ressincronização documentado no README |
| 🟡 Leitura só na ativação deixa a tela obsoleta durante uma sessão longa do Operador | 🟡 Médio | 🟡 Alta | 🟡 Releitura sob demanda na primeira versão; observação do disco reavaliada depois do uso real, conforme a premissa 2 do `ideation.md` |
| 🟡 Workspace com múltiplas raízes torna ambígua a instalação do Reversa a exibir | 🟡 Médio | 🟡 Média | 🟡 Resolver e declarar a raiz escolhida no painel; tratar a ambiguidade como caso explícito, não como acidente |
| 🟡 Arquivo do Reversa acima do teto de bytes é ignorado, e o painel mostra menos do que existe | 🟡 Médio | 🟡 Baixa | 🟡 O relatório da sonda já lista o que foi truncado; exibi-lo é obrigatório, não opcional |
| 🟡 A ressincronização depende de disciplina humana e não de garantia técnica | 🟡 Alto | 🟡 Média | 🟡 Registrar origem, versão e data no cabeçalho de cada arquivo vendorizado, de modo que a defasagem seja legível sem comparar código |
| 🟡 Defeito visual passa por suíte verde e só aparece na tela, como ocorreu três vezes no `vscode-kanban` | 🟡 Médio | 🟡 Alta | 🟡 Herdar o preview fora do editor desde a primeira versão, e tratar verificação visual como evidência de teste, nunca de conclusão |
| 🟡 O recorte de duas personas sobre uma pessoa só pode produzir tela que não serve bem a nenhum dos dois modos | 🟡 Médio | 🟡 Baixa | 🟡 Ordenar a tela pela persona primária; o Operador recebe o mesmo painel com releitura rápida, não uma segunda tela |
| 🟡 O ponto de extensão para ações erode o invariante de não escrever, quando o botão de disparar agente for construído | 🟡 Alto | 🟡 Média | 🟡 Separar em camadas desde a primeira versão: a de leitura nunca ganha capacidade de despacho, e o despacho nunca ganha acesso a escrita de arquivo |

---

## 9. Critérios de aceite (alto nível)

- 🟡 **Dado** um repositório com Reversa instalado e nenhuma configuração prévia da extensão,
  **Quando** o painel é aberto pela primeira vez, **Então** ele já exibe projeto, fase corrente,
  feature ativa e estágio, sem que nenhum comando tenha sido executado.
- 🟡 **Dado** um projeto parado há mais de trinta dias, **Quando** o Retomador abre o painel,
  **Então** ele identifica o próximo passo sem abrir arquivo algum e sem reler documentação.
- 🟡 **Dado** uma feature com todas as ações fechadas e sem adendo correspondente, **Quando** o
  painel é lido, **Então** o estado aparece destacado como pendente de decisão humana, nomeando a
  convergência que falta.
- 🟡 **Dado** um `state.json` corrompido, truncado ou editado à mão, **Quando** o painel é lido,
  **Então** ele degrada em vez de falhar, exibe o que conseguiu ler e lista as anomalias
  encontradas com arquivo e motivo.
- 🟡 **Dado** um workspace sem Reversa instalado, **Quando** o painel é aberto, **Então** ele
  explica o que o Reversa é e como instalá-lo, em vez de mostrar erro ou tela vazia.
- 🟡 **Dado** o Operador que acabou de rodar um agente no terminal, **Quando** ele aciona a
  releitura, **Então** o painel reflete o novo estágio físico e a nova contagem de ações.
- 🟡 **Dado** o código completo da extensão, **Quando** ele é auditado, **Então** nenhuma abertura
  de arquivo para escrita é encontrada em camada alguma, e o módulo de leitura não expõe nenhuma
  função capaz de escrever, criar, remover ou executar.

---

## 10. Evolução prevista: disparar agentes pelo painel

🟡 Declarado pelo usuário em 2026-09-09 como intenção futura, e portanto tratado como requisito de
desenho hoje, ainda que não de implementação.

O que muda quando o botão existir:

- 🟡 O painel deixa de ser apenas observador e passa a ter uma superfície de ação, que sugere qual
  agente do Reversa cabe no estágio corrente e o dispara.
- 🟡 O disparo acontece por despacho de comando ao terminal integrado, nunca por edição de disco.
  Quem escreve continua sendo o Reversa, sob as próprias regras e sob a política que o usuário
  controla em `.reversa/reversa-config.json`.
- 🟡 A leitura e o despacho ficam em camadas distintas, sem que nenhuma das duas alcance a
  capacidade da outra.

O que o desenho da primeira versão deve garantir para que isso seja acréscimo e não refatoração:

- 🟡 A View não pode presumir que só recebe dados. A comunicação com o host precisa ser um canal de
  mensagens de mão dupla desde já, ainda que a primeira versão só use a releitura.
- 🟡 O estágio corrente já precisa ser um valor de domínio nomeado, e não texto renderizado, porque
  é dele que a sugestão de próximo agente será derivada.
- 🟡 A camada de leitura permanece pura e sem conhecimento do host, exatamente como o modelo
  vendorizado a entrega, para que ganhar uma vizinha que despacha comandos não a contamine.

---

## Pendências de cobertura

🟡 Nenhuma seção ficou marcada `[INDEFINIDO]`. Três pontos, porém, seguem como decisão adiada e
não como lacuna, e devem ser reabertos no momento indicado:

1. 🟡 **Observação automática do disco.** Adiada para depois do uso real, conforme a premissa 2 do
   `ideation.md`. Reabrir se a releitura manual incomodar o Operador.
2. 🟡 **Os cinco eixos fora do escopo.** Adiados por custo de tela, não por custo de leitura.
   Reabrir quando um deles for necessário numa retomada concreta.
3. 🟡 **Publicação no Marketplace.** Adiada. O desenho não deve criar impedimento a ela.
4. 🟡 **Botão de disparar agentes.** Adiado para depois da primeira versão, com o desenho já
   preparado conforme a seção 10. Reabrir quando o painel estiver em uso corrente e o próximo
   agente for previsível a partir do estágio.

---

Gerado por reversa-drafter em 2026-09-09T10:41:16Z
Fontes: ideation.md, personas.md
