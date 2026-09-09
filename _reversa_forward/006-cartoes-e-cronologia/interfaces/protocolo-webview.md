# Contrato: canal de mensagens entre a webview e o host

> Identificador: `006-cartoes-e-cronologia`
> Data: `2026-09-09`
> Tipo: mensagem entre processos, mediada pelo editor
> Contrato anterior: `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, emendado por `_reversa_forward/004-heranca-e-sincronia/interfaces/protocolo-webview.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. O que este documento é

🟢 O delta desta feature sobre o contrato que a feature 002 fixou. O transporte, o envelope e a
ausência de correlação continuam como estão, e nada aqui os revisa. A regra do contrato também
continua a mesma, e é o que autoriza tudo o que segue: **acrescentar é permitido, renomear e remover
não são**.

🟢 Há duas declarações do mesmo contrato, uma de cada lado da fronteira de compilação, e mantê-las em
sincronia é obrigação prendida por teste desde a feature 003. Todo acréscimo abaixo vale para as
duas.

## 2. Campos novos em `setProcess`

🟢 O comando continua com o mesmo nome, a mesma direção e a mesma semântica: substitui inteiramente
o payload anterior e não espera resposta. Ganha dois campos.

| Campo | Forma | Significado | Confidência |
|---|---|---|---|
| `decomposition` | objeto | As ações da feature ativa, uma a uma, com fase, descrição e situação. Forma completa em `data-delta.md`, seção 4.1 | 🟢 |
| `history` | objeto | As pastas de feature do projeto, com contagem, situação, marca e resumo. Forma completa em `data-delta.md`, seção 4.2 | 🟢 |

🟢 Uma webview construída antes desta feature ignora os dois campos e desenha o que sempre desenhou.
Um host anterior a esta feature não os envia, e a webview nova precisa tratar a ausência de cada um
como leitura não realizada, e não como ausência de dado, o que é a diferença entre dizer "não há
ações" e dizer "não li as ações".

🟢 `setEntry` e `setNotice` ficam intocados, inclusive nos casos de erro e de pasta ausente.

## 3. Comandos novos da webview para o host

🟢 A lista de comandos que a webview pode enviar passa de cinco para sete. O comando reservado de
despacho continua reservado, sem tratador, e nada nesta feature o ativa.

| Comando | Carga | Quando é enviado | Idempotente |
|---|---|---|---|
| `openDraft` | `text`, `title` | Quando o usuário aciona o resumo no cabeçalho | não, cada acionamento abre um documento |
| `copyText` | `text` | Quando o usuário aciona a cópia no cabeçalho | sim, substitui o conteúdo da área de transferência |

🟢 O texto viaja pronto. Ele é montado por função pura na tela, e não no host, porque a suíte de
fronteiras proíbe o host de conter caminho de arquivo do Reversa ou nome de estágio, e porque os
rótulos legíveis já vivem do lado da tela.

### 3.1 Validação na fronteira de confiança

🟢 O roteador do host não presume forma, e para os dois comandos novos exige:

| Regra | Comportamento em caso de violação | Confidência |
|---|---|---|
| `text` presente e do tipo texto | Recusa com linha de log nomeando o comando, sem efeito algum | 🟢 |
| `text` não vazio | Recusa com linha de log | 🟢 |
| `text` até 65.536 bytes | Recusa com linha de log que informa o tamanho recebido e o teto | 🟡 |
| `title` ausente ou não textual, em `openDraft` | Aceita, e o host usa um título próprio | 🟡 |

🟢 Nenhuma violação chega a tocar o editor, e nenhuma delas lança de volta para quem chamou, porque o
roteador roda dentro do ouvinte do editor, onde exceção que escapa é engolida em vez de lida.

## 4. O que o host faz com cada comando novo

| Comando | Efeito | O que NÃO acontece |
|---|---|---|
| `openDraft` | Abre no editor um documento novo, sem caminho, com o texto recebido, e sem roubar o foco | Nenhum arquivo é criado, nenhum caminho é escrito, nada é salvo. Salvar é gesto do usuário |
| `copyText` | Escreve o texto na área de transferência do editor | Nenhum arquivo é tocado, nenhuma notificação modal é aberta |

🟢 As duas capacidades entram por portas próprias, separadas da porta que abre arquivo, para que a
leitura do arquivo de portas continue dizendo com clareza o que cada capacidade alcança. A porta que
abre arquivo permanece exatamente como está.

🟢 O painel confirma a cópia por texto no próprio cabeçalho, e não por caixa de diálogo, mantendo a
regra de que a extensão não interrompe o usuário.

## 5. Erros e casos de borda

| Caso | Comportamento esperado | Confidência |
|---|---|---|
| A webview envia `openDraft` antes de o processo chegar | O texto vem vazio e o comando é recusado na validação, sem efeito | 🟢 |
| O editor falha ao abrir o documento novo | A falha é capturada, registrada no canal de log e comunicada ao painel como aviso, ao lado do conteúdo, nunca no lugar dele | 🟡 |
| A área de transferência não está disponível | Mesmo tratamento do caso anterior | 🟡 |
| O painel está oculto quando o host tenta enviar `setProcess` | Comportamento de hoje, inalterado: a releitura fica pendente e é enviada quando o painel volta a aparecer | 🟢 |
| Duas leituras chegam em sequência rápida | Comportamento de hoje, inalterado: a última vence | 🟢 |

## 6. Compatibilidade

| Combinação | Resultado | Confidência |
|---|---|---|
| Host novo, webview nova | Tudo funciona | 🟢 |
| Host novo, webview antiga | A webview ignora os dois campos novos e nunca envia os dois comandos novos. O painel antigo continua correto | 🟢 |
| Host antigo, webview nova | Os campos novos chegam ausentes, e a tela declara que a cronologia não foi lida. Os dois comandos novos são recusados como desconhecidos, com linha de log | 🟢 |

🟢 Nenhuma dessas combinações acontece em uso normal, porque host e tela viajam no mesmo pacote. Elas
importam durante o desenvolvimento, quando uma das metades é reconstruída sem a outra.

## 7. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Delta da feature 006: dois campos em `setProcess`, dois comandos novos da webview e a validação de ambos | reversa |
