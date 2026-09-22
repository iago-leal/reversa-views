# Vigilância de regressão: 017-tela-cheia-do-painel

**Data:** 2026-09-21
**Feature:** `017-tela-cheia-do-painel`
**Cenário:** greenfield.

Este projeto não tem extração de `/reversa`: o contexto vem de `_reversa_sdd/prd.md`, das cinco specs
de `_reversa_sdd/sdd/` e dos adendos 014 e 016. Não há regra 🟢 confirmada sobre código existente, e
por isso o watch principal nasce vazio. O que esta entrega deixou de verdades a manter está em
"Observações", sem peso de regressão. Elas ganham peso quando uma `/reversa` futura, rodando sobre o
código novo, confirmar cada uma como 🟢.

O modo de regredir próprio desta feature é o **apagamento que volta**. Tudo o que ela faz é mudar como
o quadro chega ao terminal, e a tentação futura é a de "limpar a tela" para resolver um resíduo visto
num emulador: um `CSI 2J` que reaparecesse em `terminal.ts`, um `CSI K` escrito depois do texto em
vez de antes, ou um apagamento abaixo do corpo feito da posição corrente, passariam por qualquer suíte
que compare texto e quebrariam justamente onde não há quem veja: no histórico do emulador, no canto da
moldura, e no terminal que não conhece a sincronização.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|

Vazio: cenário greenfield, nenhuma regra 🟢 extraída de código.

## Histórico de re-extrações

Vazio. Será preenchido pelo agente reverso quando `/reversa` rodar sobre este código.

## Arquivadas

Vazio.

## Observações

Sem peso de regressão até que uma extração as confirme.

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| W001 | `requirements.md`, RF-07; `roadmap.md`, D-01 | A sequência de um redesenho não contém o apagamento de tela inteira (`CSI 2J`); o redesenho posiciona no canto e apaga por linha | ausência | `2J` em `src/cli/terminal.ts`; tela em branco entre quadros; cópia de quadro no histórico do emulador ao rolar |
| W002 | `roadmap.md`, D-02; notas de execução do `actions.md` | O apagamento de cada linha vem ANTES do texto dela, e o apagamento abaixo do corpo começa na linha seguinte à última, nunca da posição corrente | presença | `CSI K` ou `CSI J` escrito logo após um texto de largura inteira; canto direito da moldura sumindo na última linha |
| W003 | `requirements.md`, RF-08; `roadmap.md`, D-03 | Cada redesenho abre por `CSI ?2026h` e fecha por `CSI ?2026l`, numa única chamada de escrita | presença | Redesenho em mais de uma escrita; sequência sem abertura ou sem fechamento |
| W004 | `requirements.md`, RN-02; `roadmap.md`, D-03 | A restauração fecha a sincronização antes de mostrar o cursor e deixar a tela alternativa, e continua idempotente em todos os caminhos de saída | presença | Terminal preso após `Ctrl+C` no meio de um desenho; ordem invertida na restauração |
| W005 | `requirements.md`, RF-09; `roadmap.md`, D-04 | A rajada de `resize` produz uma chamada ao ouvinte por giro do laço de eventos, sem relógio, e o cancelamento da assinatura impede chamadas posteriores | presença | Temporizador em `aoRedimensionar`; ouvinte chamado após o cancelamento; um redesenho por evento |
| W006 | `requirements.md`, RF-10; `roadmap.md`, D-12 | `src/cli/laco.ts` não muda por força da tela cheia: a retomada da suspensão e a volta do editor redesenham pelo mesmo `desenhar` | ausência | Estado de desenho ou agrupamento migrando para o laço; redesenho após `SIGCONT` por caminho próprio |
| W007 | `requirements.md`, RF-01; `interfaces/teclado.md`, seção 2 | `Esc [ 5 ~` e `Esc [ 6 ~` são página acima e abaixo; a seleção anda uma janela útil e a janela a acompanha, presas às pontas | presença | Página movendo só a seleção, ou só a janela; `PgDn` no fim mudando algo |
| W008 | `requirements.md`, RF-02; `interfaces/teclado.md`, seção 2 | `0x15` e `0x04` são meia página acima e abaixo; nenhum deles sai da ferramenta nem suspende | presença | `Ctrl+D` encerrando a interface viva; meia página maior que a metade da altura |
| W009 | `roadmap.md`, D-06; `interfaces/teclado.md`, seção 3 | A sequência terminada em til é reconhecida pelo número entre o colchete e o til, e só `5` e `6` são tecla; `Home`, `Insert`, `Delete`, `End` e as de função não fazem nada | ausência | Sequência com til mapeada pelo último byte; `Delete` virando página |
| W010 | `roadmap.md`, D-07; `data-delta.md`, seção 3 | `ContextoDeNavegacao.linhas` é opcional; presente, a linha da seleção corrente no mapa é igual a `indiceDaSelecao()`; ausente, a página anda por posições | presença | Campo tornado obrigatório; mapa divergindo do índice da seleção; item com dado secundário fazendo a página errar |
| W011 | `requirements.md`, RN-03; `roadmap.md`, D-08 | A seleção é o único foco: não existe janela rolada sem seleção, e toda tecla de movimento emite `nenhum` | ausência | Estado de "janela livre"; efeito nomeado novo para movimento |
| W012 | `requirements.md`, RN-04; `interfaces/teclado.md`, seções 1 e 4 | Nenhum modo de mouse é ligado; a roda funciona pela conversão em setas do emulador, e a seleção nativa de texto continua sem modificador | ausência | `?1000`, `?1002`, `?1003` ou `?1006` em `terminal.ts`; tabela de ajuda mencionando mouse |
| W013 | `requirements.md`, RF-06; `roadmap.md`, D-09 | `TABELA_DE_AJUDA` lista `PgUp / PgDn` e `Ctrl+U / Ctrl+D` depois de `g / G`, com a promessa de cada uma; toda tecla de `TECLAS` tem linha; `amostras/painel/ajuda.txt` transcreve a tabela | presença | Tecla nomeada sem linha na ajuda; amostra da ajuda divergindo da tabela |
| W014 | `requirements.md`, RF-16 e RN-01 | Passada, saída de dados, texto de uso e amostras continuam idênticos; a única amostra que esta feature moveu é `ajuda.txt` | presença | Sequência de tela ou de sincronização na passada; amostra de quadro alterada por mudança de desenho |
| W015 | `requirements.md`, RN-05 | A sequência de escape continua só em `src/cli/terminal.ts`, e o reconhecimento de bytes em função pura em `src/cli/teclas.ts` | ausência | Escape em `navegacao.ts` ou no quadro; relógio em `reconhecerTecla` |
| W016 | `requirements.md`, RN-06 | Nenhuma bandeira nem variável de ambiente de tela ou de mouse; a sincronização é emitida sempre, sem consulta ao terminal (`DECRQM`) | ausência | `--tela=`, `--mouse` ou variável nova em `argumentos.ts`; consulta de modo antes do primeiro desenho |
| W017 | `requirements.md`, RN-07 e RN-08 | Nenhuma dependência de tempo de execução, nenhum estado entre execuções, e nenhum nome vigiado em `src/cli/` | ausência | `dependencies` no manifesto; nome do produto de referência ou do emulador em fonte da ferramenta |
| W018 | `requirements.md`, NFR de desempenho | Um redesenho comum é uma única escrita; cada seta reconhecida produz no máximo um redesenho; a composição de 500 linhas continua abaixo de 50 ms | presença | Escrita dividida; redesenho por byte em vez de por bloco; caso de desempenho afrouxado |
