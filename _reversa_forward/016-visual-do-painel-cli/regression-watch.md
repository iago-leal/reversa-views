# Vigilância de regressão: 016-visual-do-painel-cli

**Data:** 2026-09-21
**Feature:** `016-visual-do-painel-cli`
**Cenário:** greenfield.

Este projeto não tem extração de `/reversa`: o contexto vem de `_reversa_sdd/prd.md`, das cinco specs
de `_reversa_sdd/sdd/` e do adendo 014. Não há regra 🟢 confirmada sobre código existente, e por isso o
watch principal nasce vazio. O que esta entrega deixou de verdades a manter está em "Observações", sem
peso de regressão. Elas ganham peso quando uma `/reversa` futura, rodando sobre o código novo,
confirmar cada uma como 🟢.

O modo de regredir próprio desta feature é a **aparência que escorrega para o conteúdo**. Tudo o que
ela faz é vestir um texto que já existia, e nada do que ela faz pode mudar frase, ordem, número ou
contrato. Uma mudança futura que reescrevesse uma frase para caber na moldura, que fizesse um estado
depender da cor para ser lido, ou que deixasse uma sequência de escape nascer fora do módulo de
terminal, passaria despercebida num terminal colorido e quebraria justamente onde não há quem veja: na
saída redirecionada, no terminal sem cor e na paridade com a webview.

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
| W001 | `requirements.md`, RF-01 e RF-16 | Valor de cor só em `src/cli/paleta.ts`; o desenho nomeia papel, e não cor | ausência | Tripla, hexadecimal, índice de 256 ou código de cor em outro fonte de `src/cli/` |
| W002 | adendo 014, D-05; `requirements.md`, RF-16 | O caractere de escape só aparece em `src/cli/terminal.ts` | ausência | Sequência de escape em módulo do quadro, em `amostras.ts` ou em `ambiente.ts` |
| W003 | `requirements.md`, RN-01 | A aparência veste o texto e não o reescreve: `LinhaDoQuadro.texto` é a soma dos trechos, e as frases são as de antes | redação | Frase encurtada ou trocada para caber em moldura; `texto` divergindo da soma dos trechos |
| W004 | `requirements.md`, RF-16 | `tests/cli-paridade.spec.tsx` passa sem linha alterada; as onze seções compartilhadas seguem a ordem de `sectionOrder()` | presença | Suíte de paridade editada, ou a seção de versões entrando em `sectionOrder()` |
| W005 | `requirements.md`, RF-15 | A saída de dados é idêntica byte a byte, e os três códigos de saída são os da 014 | presença | Suíte de dados ou de códigos de saída com linha reescrita |
| W006 | `requirements.md`, RF-19 e RN-06 | A passada redirecionada não contém sequência alguma, moldura, cursor nem linha de estado; diante de terminal, retirada a cor, o texto é o mesmo | ausência | Byte de escape em saída redirecionada; moldura na passada |
| W007 | `requirements.md`, RF-12 | `--sem-cor` e `NO_COLOR` tiram a cor e só ela: molduras, glifos e linha de estado continuam | presença | Glifo ou moldura sumindo com a cor desligada |
| W008 | `requirements.md`, RF-05 e RF-07, NFR de acessibilidade | Todo estado que a cor distingue tem glifo próprio; o item selecionado é o único com o glifo de seleção | presença | Dois estados com o mesmo glifo e cores diferentes |
| W009 | `requirements.md`, RN-04 e NFR de acessibilidade; `roadmap.md`, D-04 | Texto de leitura mede ao menos 4,5 sobre o fundo, e o acento, que só veste marca, ao menos 3; o tom de 24 bits do acento é único nos dois fundos | presença | Acento vestindo texto de leitura; tom abaixo do piso; o índice 167 da paleta clara voltando a 173 |
| W010 | `requirements.md`, RF-11 | O degrau de cor cai para o inferior na dúvida: 24 bits só com `COLORTERM` declarado, 256 só com o `TERM` dizendo | presença | Degrau superior assumido por omissão |
| W011 | `requirements.md`, RF-20 | O fundo vem de bandeira, variável, `COLORFGBG` e padrão escuro, nessa ordem, e nenhum byte é escrito no terminal antes do primeiro desenho para descobri-lo | ausência | Consulta ao terminal por sequência; escrita antes do primeiro quadro |
| W012 | `requirements.md`, RF-21 | Tema inválido na bandeira é uso incorreto, código 2, nomeando o valor; na variável, aviso único no canal de erro e a precedência segue | presença | Variável inválida encerrando a ferramenta, ou bandeira inválida sendo ignorada |
| W013 | `requirements.md`, RF-13 | Abaixo de 60 colunas somem as molduras e só elas; nenhuma linha estoura a largura | presença | Linha mais larga que a janela a 59 colunas; glifo ou cor sumindo junto |
| W014 | `requirements.md`, RF-14 | Sem localidade UTF-8, glifos e molduras saem em sete bits; a prosa continua acentuada | presença | Glifo fora do ASCII no jogo de sete bits; prosa transliterada |
| W015 | `requirements.md`, RN-05; `roadmap.md`, D-09 | Todo texto que entra num trecho passa pela higiene; nenhum caractere de controle do disco chega ao terminal | ausência | Trecho construído fora de `trechos.ts`; ponto de código de controle numa linha do quadro |
| W016 | `requirements.md`, RF-08 | A linha de estado ocupa a última linha da janela, não rola, e a janela útil desconta essa linha num lugar só | presença | Última linha do corpo encoberta; seleção parando atrás da linha de estado |
| W017 | `requirements.md`, RF-18 | Os fatos que deixaram o cabeçalho estão todos na seção "Versões e construção", que aparece também sem carga | presença | Versão, revisão, carimbo ou desfecho da conferência sem lugar na tela |
| W018 | `requirements.md`, RF-02, RF-03 e RF-09 | Cabeçalho, bloqueio, ajuda e as três situações de entrada da interface viva saem em moldura; a do bloqueio se distingue sem cor pelo glifo de atenção no título; a raiz inexistente não tem quadro | presença | Moldura de bloqueio sem o glifo; moldura na raiz inexistente |
| W019 | `requirements.md`, RF-06 | O caminho do artefato e o instante ocupam linha própria sob o item, atrás do glifo de continuação, e a seleção trata o item como bloco | presença | Caminho de volta à linha da descrição; bloco selecionado cortado pela rolagem |
| W020 | `requirements.md`, RF-17; `roadmap.md`, D-23 | As amostras são geradas por função pura em `src/cli/`, gravadas por casca em `scripts/`, versionadas, e a suíte compara o gerado com o gravado; ficam fora do pacote | presença | Escrita de arquivo dentro de `src/cli/`; `amostras/` no `.vsix`; amostra gravada divergindo sem a suíte reprovar |
| W021 | `requirements.md`, RN-07 e RF-22; `roadmap.md`, D-25 | Nenhum fonte de `src/cli/` contém o nome do produto de referência, do fabricante ou do mascote; a lista mora só em `tests/cli-boundaries.spec.ts` | ausência | Nome vigiado em fonte da ferramenta, ainda que em comentário |
| W022 | adendo 014, RN-02 | A ferramenta continua sem escrever arquivo e sem dependência nova | ausência | `dependencies` no manifesto; função de escrita alcançada de `src/cli/` |
| W023 | `requirements.md`, NFR de desempenho | Um quadro de 500 linhas é composto em menos de 50 ms | presença | Caso de desempenho de `cli-quadro` reprovando ou sendo afrouxado |
