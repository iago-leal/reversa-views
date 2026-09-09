# Requirements: Leitura do processo do Reversa

> Identificador: `001-leitura-do-processo`
> Data: `2026-09-09`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Esta feature entrega a camada que converte os arquivos deixados no disco pelo Reversa num valor
tipado que descreve o processo inteiro, acompanhado do relatório do que foi lido, recusado ou
truncado. Ela serve ao host da extensão, que precisa do estado sem conhecer o layout dos arquivos,
e por consequência ao mantenedor que retoma um projeto parado. O problema que resolve é a ausência
de runtime do framework: o estado existe só como arquivo, e as regras que lhe dão sentido não estão
escritas em lugar visível. A camada é pré-requisito dos outros quatro componentes do produto.

## 2. Contexto a partir do legado

Este é um projeto novo, sem extração reversa de código legado. O papel dos artefatos de descoberta
é cumprido pelas specs do ciclo greenfield e pela inspeção direta da árvore de origem que será
copiada.

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` | Doze requisitos que definem o contrato da camada, da separação entre ler e julgar até o relatório da sonda | 🟡 |
| `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals` | A camada não escreve, não decide o que a tela mostra, não observa o disco e não saneia arquivo | 🟡 |
| `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases` | Nove cenários de degradação, do estado com conteúdo inválido ao marcador de ação em caixa baixa | 🟡 |
| `_reversa_sdd/sdd/leitura-do-processo.md#15-decisoes-tomadas` | Vendorizar em vez de depender por caminho relativo; descartar a camada de rota; ler os oito eixos ainda que a tela mostre seis | 🟡 |
| `_reversa_sdd/prd.md#4-escopo-in` | O núcleo responde onde o processo está, e o diagnóstico impede o painel de mentir em silêncio | 🟡 |
| `_reversa_sdd/prd.md#5-nao-objetivos-out` | Escrita de arquivo por conta própria e tráfego de rede estão fora, por restrição herdada e não negociável | 🟡 |
| `_reversa_sdd/personas.md` | O Retomador é a persona primária, e a métrica de sucesso do produto se ancora nela | 🟡 |
| Inspeção da origem em `HARNESS/scrum-harness/packages/reversa-domain` | Camada de julgamento com 1.674 linhas de fonte em 14 módulos, e 14 arquivos de teste com 34 blocos de suíte | 🟢 |
| Inspeção da origem em `HARNESS/scrum-harness/packages/reversa-probe` | Camada de disco com 343 linhas em 4 módulos, e 4 arquivos de teste com 14 blocos de suíte | 🟢 |
| Inspeção da origem, invariante de leitura | Nenhum módulo da camada de julgamento importa sistema de arquivos: a única ocorrência do termo é um comentário, e existe suíte que verifica isso lendo o próprio fonte | 🟢 |
| Inspeção da origem, hermetismo das suítes | Os testes carregam apenas fixtures internos à própria pasta, sem depender de instalação do Reversa nem do restante do repositório de origem | 🟢 |
| Inspeção da origem, acoplamento entre pacotes | Três instruções de importação cruzam a fronteira dos dois pacotes: duas no módulo de retrato da sonda e uma na sua suíte. Fora delas, o nome do pacote de origem aparece em 21 linhas de comentário de documentação | 🟢 |
| Inspeção da origem, camada de rota | O módulo de rota tem 88 linhas e sua suíte tem 12 casos, ambos descartáveis por estarem fora do escopo | 🟢 |
| Inspeção deste repositório, `.gitignore` | Ignora apenas `.claude/` e `.agents/`; a pasta `.reversa/`, com o gancho instalado, viaja no clone | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| O host da extensão (consumidor de código) | Obter o processo completo a partir de uma raiz de workspace | Na ativação do painel, informa a raiz e recebe processo e relatório numa única chamada |
| O Retomador (mantenedor após pausa longa) | Descobrir o próximo passo sem abrir arquivo | Depende de a camada dizer a verdade sobre o estágio, inclusive quando o campo autodeclarado está desatualizado |
| O Operador (mantenedor em sessão ativa) | Confirmar que o estágio anterior fechou | Depende de a releitura refletir o disco imediatamente, sem estado guardado entre chamadas |

## 4. Regras de negócio novas ou alteradas

Todas as regras abaixo são **novas** neste repositório. Elas não alteram regra de legado, porque não
há legado: reproduzem o comportamento observável do framework Reversa 1.3.3, e essa reprodução é o
próprio contrato. Não há `_reversa_sdd/domain.md` a referenciar, de modo que a origem citada é a
spec do componente.

1. **RN-01, precedência normativa das fases.** A lista de fases concluídas vence o campo de fase
   corrente, que por sua vez vence a lista de pendentes. 🟡
   - Origem: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` (RF-03)
   - Tipo: nova
2. **RN-02, estágio por artefato físico.** O estágio da feature ativa é classificado pelos arquivos
   presentes na pasta, e o campo autodeclarado de estágio é ignorado, porque o próprio framework o
   declara informativo. 🟡
   - Origem: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` (RF-04)
   - Tipo: nova
3. **RN-03, adendo superado equivale a ausente.** Entrega concluída só conta como convergida quando
   existe adendo vigente; adendo marcado como superado devolve a feature à condição de pendente de
   convergência. 🟡
   - Origem: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` (RF-05)
   - Tipo: nova
4. **RN-04, varredura integral das ações.** A contagem de ações percorre o arquivo inteiro, sem
   filtro de seção, de modo que uma ação aberta dentro da seção de emendas reabre a feature. 🟡
   - Origem: `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` (RF-06)
   - Tipo: nova
5. **RN-05, preservação do valor fora do canônico.** Valor que escape do conjunto previsto é
   preservado e sinalizado como anomalia, nunca normalizado nem descartado em silêncio. 🟡
   - Origem: `_reversa_sdd/sdd/leitura-do-processo.md#15-decisoes-tomadas`
   - Tipo: nova
6. **RN-06, ausência distinta de vazio.** Pasta ausente significa que não há feature ativa; pasta
   existente e vazia significa feature recém-criada. Os dois estados não podem colapsar num só. 🟡
   - Origem: `_reversa_sdd/sdd/leitura-do-processo.md#9-modelo-de-dados`
   - Tipo: nova
7. **RN-07, confinamento à raiz do workspace.** Ponteiro declarado pelo Reversa que aponte para fora
   da raiz é recusado, a leitura daquele ramo é abandonada, os demais eixos seguem, e a recusa é
   relatada. 🟡
   - Origem: `_reversa_sdd/sdd/leitura-do-processo.md#12-seguranca-e-privacidade`
   - Tipo: nova
8. **RN-08, fidelidade ao framework acima da correção aparente.** Onde o comportamento do Reversa
   surpreende, ele é reproduzido e não idealizado. O caso testemunha é o marcador de ação em caixa
   baixa, que não conta como ação e vira anomalia. 🟡
   - Origem: `_reversa_sdd/sdd/leitura-do-processo.md#3-goals` (G-03) e `#11-edge-cases` (EC-09)
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | A leitura é composta por duas partes, uma que toca o disco e outra que julga, e a segunda não importa módulo de sistema de arquivos | Must | Uma busca por importação de sistema de arquivos nos fontes da camada de julgamento retorna zero ocorrências, verificada por suíte que lê o próprio código | 🟢 |
| RF-02 | As pastas de saída e de ciclo forward são resolvidas a partir do estado do Reversa, aplicando os padrões do framework quando os campos faltarem | Must | Um workspace com pasta de saída personalizada é lido corretamente sem configuração adicional | 🟡 |
| RF-03 | As cinco fases da descoberta são derivadas por precedência normativa, conforme RN-01 | Must | Um estado com os três campos em desacordo produz as cinco fases canônicas na ordem do framework, e a contradição vira anomalia | 🟡 |
| RF-04 | O estágio da feature ativa é classificado pelos artefatos fisicamente presentes, conforme RN-02 | Must | Uma pasta com documento de requisitos e sem plano é classificada como estágio de requisitos, qualquer que seja o valor do campo autodeclarado | 🟡 |
| RF-05 | A entrega concluída sem adendo é distinguida da concluída com adendo vigente, conforme RN-03 | Must | Uma feature com todas as ações fechadas e adendo marcado como superado é classificada como pendente de convergência | 🟡 |
| RF-06 | As ações da feature são contadas varrendo o arquivo inteiro, reportando fechadas, abertas e emendas, conforme RN-04 | Must | Uma ação aberta dentro da seção de emendas mantém a feature aberta na contagem | 🟡 |
| RF-07 | Toda degradação encontrada durante a leitura é registrada nomeando arquivo, código do problema e detalhe | Must | Um estado com fase fora do conjunto canônico produz anomalia que nomeia a fase encontrada | 🟡 |
| RF-08 | Caminho declarado pelo Reversa que escape da raiz do workspace é recusado e relatado, conforme RN-07 | Must | Um ponteiro absoluto ou com travessia de diretório é recusado, consta do relatório, e os demais eixos continuam sendo lidos | 🟡 |
| RF-09 | Arquivo acima do teto de bytes não é lido, e o truncamento é relatado | Must | Um arquivo acima do teto não é lido, seu caminho consta da lista de truncados, e o eixo correspondente sai vazio em vez de parcial | 🟡 |
| RF-10 | Campos desconhecidos encontrados nos arquivos são preservados, conforme RN-05 | Should | Uma chave nova num checkpoint sobrevive à leitura e fica disponível ao consumidor | 🟡 |
| RF-11 | Workspace sem o Reversa instalado devolve processo válido, marcado como não instalado | Must | Uma pasta vazia produz processo com a marca de não instalado, eixos vazios e nenhuma exceção ao consumidor | 🟡 |
| RF-12 | O relatório da sonda nomeia o que foi lido, o que foi recusado e o que foi truncado, incluindo as pastas resolvidas | Should | O relatório nomeia a pasta da feature e a da sessão de ideação, ou informa a ausência de cada uma | 🟡 |
| RF-13 | O código de julgamento e o de leitura de disco entram neste repositório por cópia, com as suítes herdadas junto | Must | Com a árvore de origem indisponível, uma instalação limpa deste repositório compila e executa as suítes copiadas até o fim | 🟢 |
| RF-14 | As importações que cruzavam a fronteira dos dois pacotes de origem são remapeadas para o caminho interno deste projeto | Must | Nenhuma instrução de importação ou exportação nos arquivos copiados referencia o nome de pacote do repositório de origem, verificável por busca textual restrita a essas instruções que retorna zero ocorrências; menções em comentários de documentação são preservadas como registro histórico | 🟢 |
| RF-15 | A camada de rota da origem não é copiada, nem seu módulo nem sua suíte | Must | A cópia não contém o módulo de rota nem os seus doze casos de teste, e nada no código restante os referencia | 🟢 |
| RF-16 | A cópia registra, em texto legível junto ao código copiado, a versão do Reversa que a origem acompanhava, a data da cópia, o identificador do commit de origem e a lista do que foi deliberadamente descartado | Should | Um leitor que abra o repositório após meses identifica de qual estado da origem a cópia veio e o que ficou de fora por decisão, sem consultar histórico de versionamento nem comparar árvores | 🟡 |
| RF-17 | A suíte de paridade com o gancho do Reversa verifica a transcrição contra dois alvos, como falhas duras independentes: o fixture interno, cópia byte a byte do gancho da versão 1.3.3, e o gancho instalado em `.reversa/hooks/` do próprio workspace | Must | Alterar a transcrição faz a verificação contra o fixture falhar; alterar o gancho instalado faz a verificação contra ele falhar; na ausência do gancho instalado, essa segunda verificação declara-se pulada, e não passa em silêncio | 🟢 |
| RF-18 | A cópia lê e julga os oito eixos que a origem calcula, sem poda dos eixos de migração e ideação | Must | Os módulos e as suítes de migração e de ideação estão presentes na cópia e passam | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | Leitura completa do workspace de referência abaixo de 200 milissegundos. Workspace de referência: uma feature ativa com os cinco arquivos que a sonda lê, 50 adendos (o teto) e nenhum arquivo individual acima de 64 kilobytes | `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-nao-funcionais` (RNF-01). Definido pelo pior caso realista na sessão de 2026-09-09, verificável com material sintético; qualquer workspace menor fica coberto | 🟡 |
| Limite de recurso | Teto de 256 kilobytes por arquivo lido, mantido como herdado da origem. Gatilho de revisão: a primeira feature cujo arquivo de progresso constar da lista de truncados | `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-nao-funcionais` (RNF-02). Decidido na sessão de esclarecimentos de 2026-09-09: o maior arquivo lido pela sonda num workspace maduro ocupa 6% do teto, e o truncamento é relatado, não silencioso | 🟢 |
| Limite de recurso | Teto de 50 adendos lidos por passada, em ordem de nome | `_reversa_sdd/sdd/leitura-do-processo.md#7-requisitos-nao-funcionais` (RNF-03), herdado da origem | 🟡 |
| Segurança | Nenhuma função exposta é capaz de escrever, criar, remover ou executar | `_reversa_sdd/prd.md#5-nao-objetivos-out`, restrição herdada e não negociável. Na origem, a garantia é estrutural e verificada por suíte própria | 🟢 |
| Segurança | A leitura é confinada à raiz do workspace informada pelo host | `_reversa_sdd/sdd/leitura-do-processo.md#12-seguranca-e-privacidade` | 🟡 |
| Privacidade | Nenhum dado sai do processo: sem rede, sem persistência fora da memória, sem telemetria | `_reversa_sdd/prd.md#5-nao-objetivos-out`, não-objetivo explícito | 🟡 |
| Observabilidade | Toda degradação aparece na lista de anomalias com arquivo, código e detalhe, e nenhuma falha é silenciosa | `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` (RF-07). É o instrumento de monitoramento pós-entrega | 🟡 |
| Testabilidade | As suítes herdadas passam sem reescrita de regra: 17 arquivos de teste, 45 blocos de suíte e 213 casos, depois de descartada a suíte de rota | Medição direta da origem em 2026-09-09. A spec registra 20 arquivos, número que a medição não confirma. Ver a nota de reconciliação | 🟢 |
| Manutenibilidade | A camada de julgamento permanece testável sem tocar em disco, condição que sustenta o número acima | `_reversa_sdd/sdd/leitura-do-processo.md#3-goals` (G-04) | 🟡 |
| Reprodutibilidade | Depois da cópia, o repositório compila e testa sem a árvore de origem presente | Decisão de vendorizar em `_reversa_sdd/sdd/leitura-do-processo.md#15-decisoes-tomadas`, motivada por retomada após meses de pausa | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Leitura completa de um workspace íntegro (RF-02, RF-12)
  Dado um workspace com o Reversa instalado e os arquivos do processo íntegros
  Quando o host informa a raiz do workspace e pede a leitura
  Então recebe o processo com os eixos preenchidos e a lista de anomalias vazia
  E o relatório da sonda nomeia as pastas de saída e de ciclo forward resolvidas

Cenário: Julgamento sem acesso ao disco (RF-01)
  Dado o conjunto de fontes da camada de julgamento
  Quando se procura por importação de módulo de sistema de arquivos nesses fontes
  Então nenhuma ocorrência é encontrada
  E a suíte que verifica essa condição lendo o próprio código passa

Cenário: Fases em desacordo entre si (RF-03)
  Dado um estado que lista a mesma fase como corrente e como concluída
  Quando o processo é lido
  Então as cinco fases canônicas saem na ordem do framework
  E a fase em conflito é resolvida em favor de concluída
  E a contradição aparece como anomalia

Cenário: Estágio contrariando o campo autodeclarado (RF-04)
  Dado uma pasta de feature com documento de requisitos e sem plano
  E um campo autodeclarado de estágio dizendo que a codificação está em progresso
  Quando o processo é lido
  Então o estágio devolvido é o de requisitos
  E o campo autodeclarado não influencia o resultado

Cenário: Entrega concluída com adendo superado (RF-05)
  Dado uma feature com todas as ações fechadas
  E um adendo cuja seção de vigência declara que ele foi superado
  Quando o processo é lido
  Então a feature é classificada como pendente de convergência

Cenário: Ação aberta dentro da seção de emendas (RF-06)
  Dado um arquivo de ações cujas linhas principais estão todas fechadas
  E uma ação aberta na seção de emendas
  Quando as ações são contadas
  Então a contagem reporta pelo menos uma ação aberta
  E a feature não é dada como concluída

Cenário: Fase fora do conjunto canônico (RF-07, RF-10)
  Dado um estado cujo campo de fase traz um nome que o framework não define
  Quando o processo é lido
  Então as cinco fases canônicas são devolvidas
  E uma anomalia nomeia o arquivo, o código do problema e a fase encontrada
  E o valor original não é reescrito nem descartado

Cenário: Ponteiro apontando para fora da raiz (RF-08)
  Dado um ponteiro de feature com caminho absoluto ou com travessia de diretório
  Quando o processo é lido
  Então a leitura daquele ramo é recusada
  E a recusa consta do relatório da sonda
  E os demais eixos continuam sendo lidos normalmente

Cenário: Arquivo acima do teto de bytes (RF-09)
  Dado um arquivo de progresso maior que o teto configurado
  Quando o processo é lido
  Então o arquivo não é lido
  E seu caminho consta da lista de truncados
  E o eixo de progresso sai vazio, e não parcialmente preenchido

Cenário: Campo desconhecido num checkpoint (RF-10)
  Dado um checkpoint que traz uma chave não prevista pelo modelo
  Quando o processo é lido
  Então a chave sobrevive à leitura e fica disponível ao consumidor

Cenário: Workspace sem o Reversa instalado (RF-11)
  Dado uma pasta de workspace sem o diretório de configuração do Reversa
  Quando o host pede a leitura
  Então recebe um processo válido marcado como não instalado
  E os eixos vêm vazios
  E nenhuma exceção chega ao consumidor

Cenário: Pasta de feature existente e vazia (RF-04)
  Dado uma pasta de feature criada e ainda sem documento de requisitos
  Quando o processo é lido
  Então o estágio devolvido é o de pasta criada sem requisitos
  E esse estado é distinguível de não haver feature ativa

Cenário: Marcador de ação em caixa baixa (RF-06, RF-07)
  Dado uma linha de ação cujo marcador de conclusão está em caixa baixa
  Quando as ações são contadas
  Então a linha não é contada como ação concluída
  E uma anomalia nomeia a linha

Cenário: Estado com conteúdo inválido (RF-07)
  Dado um arquivo de estado que não pode ser interpretado
  Quando o processo é lido
  Então o processo sai com os padrões do framework
  E uma anomalia nomeia o arquivo e a falha de interpretação
  E nenhuma exceção chega ao consumidor

Cenário: Falha de permissão de leitura (RF-11)
  Dado um arquivo do processo sem permissão de leitura
  Quando o processo é lido
  Então a falha é tratada como ausência do arquivo
  E o eixo correspondente sai vazio
  E nenhuma exceção chega ao consumidor

Cenário: Cópia independente da árvore de origem (RF-13)
  Dado este repositório recém-clonado, com a árvore de origem indisponível
  Quando as dependências são instaladas e as suítes copiadas são executadas
  Então a compilação conclui
  E os 45 blocos de suíte herdados aplicáveis passam

Cenário: Nenhuma referência residual ao repositório de origem (RF-14)
  Dado o conjunto de arquivos copiados
  Quando se procura pelo nome de pacote usado no repositório de origem nas instruções de importação e exportação
  Então nenhuma ocorrência é encontrada

Cenário: Camada de rota ausente da cópia (RF-15)
  Dado o conjunto de arquivos copiados
  Quando se procura pelo módulo de rota e pela sua suíte
  Então nenhum dos dois está presente
  E nenhum arquivo copiado os referencia

Cenário: Procedência da cópia legível (RF-16)
  Dado um leitor que abre o repositório meses depois
  Quando ele consulta a documentação junto ao código copiado
  Então encontra a versão do Reversa que a origem acompanhava e a data da cópia
  E o identificador do commit de origem
  E a lista do que foi deliberadamente descartado

Cenário: Paridade contra o fixture interno (RF-17)
  Dado a transcrição das funções de casamento de caminho alterada de propósito
  Quando a suíte de paridade é executada
  Então a verificação contra o fixture interno falha

Cenário: Paridade contra o gancho instalado (RF-17)
  Dado o gancho instalado em `.reversa/hooks/` substituído por uma versão com matcher diferente
  Quando a suíte de paridade é executada
  Então a verificação contra o gancho instalado falha
  E a verificação contra o fixture interno continua passando

Cenário: Gancho instalado ausente (RF-17)
  Dado um workspace sem o arquivo do gancho em `.reversa/hooks/`
  Quando a suíte de paridade é executada
  Então a verificação contra o gancho instalado declara-se pulada
  E a verificação contra o fixture interno passa

Cenário: Oito eixos presentes na cópia (RF-18)
  Dado o conjunto de arquivos copiados
  Quando as suítes de migração e de ideação são executadas
  Então ambas estão presentes e passam
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 | Must | A separação entre ler e julgar é o que torna as suítes herdadas executáveis sem tocar em disco |
| RF-02 | Must | Sem resolver as pastas, nenhum outro eixo pode ser lido |
| RF-03 | Must | A fase é um dos dois eixos que respondem onde o processo está |
| RF-04 | Must | O estágio é o outro, e é a regra que o mantenedor erra ao ler o arquivo à mão |
| RF-05 | Must | A entrega concluída e não convergida é o bloqueio humano que nada hoje anuncia |
| RF-06 | Must | A contagem errada de ações inverte o veredito sobre a feature inteira |
| RF-07 | Must | Sem anomalias, o painel mente em silêncio, que é o risco central do produto |
| RF-08 | Must | É a fronteira de segurança da leitura, e a única que depende de código próprio |
| RF-09 | Must | Protege contra arquivo crescido sem limite, e o relato evita conclusão errada por dado ausente |
| RF-10 | Should | Preservar campo desconhecido melhora o diagnóstico, mas nenhum eixo da primeira versão depende disso |
| RF-11 | Must | O estado vazio informativo é requisito de comportamento do produto |
| RF-12 | Should | O relatório é instrumento de diagnóstico, útil e não bloqueante |
| RF-13 | Must | Sem a cópia independente, o repositório não compila sozinho após uma pausa longa |
| RF-14 | Must | A importação residual quebra a compilação da cópia |
| RF-15 | Must | Código morto envelhece e confunde na retomada, conforme decisão já registrada |
| RF-16 | Should | A procedência é o que torna a ressincronização futura possível, mas não bloqueia a entrega |
| RF-17 | Must | É o único teste que distingue transcrição quebrada de framework que mudou, e a fidelidade ao framework é o produto |
| RF-18 | Must | Podar exigiria editar o código copiado e apagar suítes, criando divergência com a origem sem ganho mensurável |
| RNF de desempenho | Should | O alvo de 200 milissegundos é confortável para leitura sob demanda, e o workspace de referência permite medi-lo com material sintético |
| RNF de segurança | Must | Restrição herdada e não negociável do framework |
| RNF de testabilidade | Must | As suítes herdadas são o contrato que sustenta a fidelidade ao framework |

## 9. Esclarecimentos

### Sessão 2026-09-09

- **Q:** Teto de 256 kilobytes por arquivo: manter, elevar, ler as últimas linhas, ou manter e reabrir depois?
  **R:** Manter os 256 kilobytes herdados e reabrir a decisão quando a primeira feature longa aparecer. Motivo: a sonda lê um conjunto pequeno e fechado de arquivos, o maior deles medido num workspace maduro ocupa 6% do teto, o truncamento é relatado e não silencioso, e qualquer alteração forcaria a sonda antes mesmo da cópia. Gatilho registrado no requisito não funcional de limite de recurso.
- **Q:** Contra o que a suíte de paridade com o gancho do Reversa deve comparar?
  **R:** Contra os dois alvos, ambos como falha dura: o fixture interno, que acusa transcrição quebrada, e o gancho instalado em `.reversa/hooks/`, que acusa mudança do framework. Sem aviso brando, porque aviso se ignora; na ausência do gancho instalado, a segunda verificação declara-se pulada. Viável porque o `.gitignore` deste repositório ignora apenas `.claude/` e `.agents/`, de modo que o gancho viaja no clone. Registrado como RF-17.
- **Q:** Ler os oito eixos, como manda o registro de decisões da spec, ou podar migração e ideação junto com a tela?
  **R:** Ler os oito. Podar exigiria editar o código copiado e apagar suítes, criando divergência sem economia mensurável de tempo. Registrado como RF-18, e a pergunta aberta OQ-03 da spec fica respondida.
- **Q:** O que é o workspace típico do alvo de 200 milissegundos?
  **R:** O pior caso realista, para que o alvo seja um limite superior: uma feature ativa com os cinco arquivos que a sonda lê, 50 adendos e nenhum arquivo individual acima de 64 kilobytes. Não havia workspace real com ciclo forward para medir. Registrado no requisito não funcional de desempenho.
- **Q:** Qual o conteúdo mínimo do registro de procedência da cópia?
  **R:** Versão do Reversa que a origem acompanhava, data da cópia, identificador do commit de origem e lista do que foi deliberadamente descartado. A lista do que foi copiado fica de fora, por ser a própria listagem da pasta. Registrado em RF-16.

## 10. Lacunas

Nenhuma lacuna aberta. As lacunas L-01 (teto de bytes) e L-02 (alvo da suíte de paridade) foram
resolvidas na sessão de esclarecimentos de 2026-09-09 e integradas às seções 5 e 6.

### Nota de reconciliação com a spec

A spec do componente afirma, em `#2-contexto-e-motivacao` e em `#7-requisitos-nao-funcionais`
(RNF-05), que a origem tem 16 arquivos de teste na camada de julgamento e 20 no total, todos a serem
mantidos. A medição direta feita em 2026-09-09 encontrou 14 na camada de julgamento e 4 na de disco,
totalizando 18 arquivos, 48 blocos de suíte e 225 casos. Descartada a suíte de rota, que sai por
decisão já tomada, restam 17 arquivos, 45 blocos e 213 casos, números adotados neste documento. A
spec deve ser reconciliada com essa medição, porque alterar o artefato sem atualizar a fonte de
verdade quebra a fonte de verdade.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-09 | Sessão de esclarecimentos por `/reversa-clarify`: cinco pontos resolvidos, lacunas L-01 e L-02 fechadas, RF-17 e RF-18 adicionados | reversa |
| 2026-09-09 | Correção factual durante o `/reversa-plan`: a fronteira entre os pacotes é cruzada por três importações, não uma; critério de RF-14 restrito a instruções de importação e exportação | reversa |

## Pendências de Qualidade

Registradas após a auto-validação contra `quality-template.md`, por decisão consciente e não por
omissão:

- **Q-018, ausência de nome de produto ou biblioteca.** O documento nomeia caminhos da árvore de
  origem na seção 2. São evidência de medição, não escolha de solução, e sem eles as afirmações
  marcadas 🟢 não seriam verificáveis. Nenhuma outra seção nomeia biblioteca, executor de testes ou
  produto comercial.
- **Q-011, citação da regra original do domínio.** Não se aplica: o projeto é novo e não existe
  `_reversa_sdd/domain.md`. A origem citada em cada regra é a spec do componente, conforme declarado
  na abertura da seção 4.
- **Q-019 e Q-020, princípios do projeto.** Não se aplicam nesta passada, porque
  `.reversa/principles.md` não existe. Rodar `/reversa-principles` antes do plano deixaria essa
  verificação disponível.
