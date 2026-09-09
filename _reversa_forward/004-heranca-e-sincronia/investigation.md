# Investigation: herança e sincronia

> Identificador: `004-heranca-e-sincronia`
> Data: `2026-09-09`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. O que foi investigado

Cinco perguntas, todas com consequência direta no plano: o que a árvore de herança contém hoje, qual
interpretador de YAML usar e a que custo, como outros projetos declaram e reaplicam adaptações sobre
código vendorizado, que forma de resumo criptográfico adotar, e por onde a revisão da origem pode
chegar ao painel sem furar os invariantes já escritos.

O método foi leitura do repositório e das origens no disco, mais consulta ao registro de pacotes
para as versões correntes. Nenhuma decisão desta feature depende de memória sobre versão de
biblioteca.

## 2. O que a árvore de herança contém hoje

Contagem feita no dia do plano. 🟢

| Medida | Valor |
|--------|-------|
| Arquivos sob `src/heranca/` | 38 |
| Arquivos `.ts` carimbados | 34 |
| Fixtures deliberadamente sem carimbo | 3 |
| Documentos de registro | 1, o `PROCEDENCIA.md` |
| Entradas que o manifesto precisa ter | 37 |
| Revisão da origem do modelo, no disco | `420305daa6cdd10858b720a34cb8db67d8e5c5e9` |
| Revisão registrada no carimbo | a mesma |

A defasagem do modelo é, portanto, zero no dia em que o verificador nasce, e o primeiro relatório
dirá alinhado. Isso é bom para a entrega, porque o caso interessante passa a ser provado por
fixture, e não por acidente.

**Achado que muda o manifesto.** 🟢 A segunda origem não está alinhada com a spec. O
`package.json` de `/workspaces/iagoleal/dev/vscode-kanban` declara versão `1.35.2`, e a spec do
componente registra `1.35.8` como versão corrente do kit. Como o kit é origem de padrão e nada dele
foi copiado, a diferença não afeta arquivo algum; ela afeta o que o manifesto deve registrar. A
decisão é registrar o observado, `1.35.2`, e deixar que o bloco do kit no relatório mostre a
diferença sempre que a origem avançar. Registrar `1.35.8` seria escrever no manifesto um número que
ninguém viu.

## 3. Interpretador de YAML: as duas opções reais

O usuário escolheu YAML sabendo que ele custa uma dependência. Restava escolher qual, e as duas
candidatas sérias no ecossistema Node são as de sempre. Versões consultadas no registro no dia do
plano. 🟢

| Candidato | Versão corrente | Licença | Dependências transitivas | O que pesa a favor | O que pesa contra |
|-----------|-----------------|---------|--------------------------|--------------------|-------------------|
| `yaml` | 2.9.0 | ISC | nenhuma | Erros com linha e coluna; documento em árvore que preserva comentários na reescrita; tipos próprios | Interface maior, com dois modos de uso |
| `js-yaml` | 5.4.1 | MIT | nenhuma na série atual | O mais antigo e o mais difundido; interface mínima de duas funções | Não preserva comentário ao reescrever; a posição do erro é menos detalhada |

**Escolhido: `yaml`, em versão exata.** 🟢 Dois motivos, ambos ligados a requisito escrito. RF-12
exige que manifesto inválido falhe nomeando o defeito, e a posição precisa é o que transforma isso
em mensagem útil. O ressincronizador reescreve o manifesto a cada execução, e um interpretador que
descarta comentários apagaria, na primeira ressincronização, o cabeçalho que explica o arquivo a
quem o abre depois de meses. O segundo motivo desaparece se o manifesto nascer sem comentário
algum, e não é assim que ele vai nascer.

O custo é zero em dinheiro e baixo em manutenção: as duas bibliotecas são gratuitas, de licença
permissiva, sem dependência transitiva e com mais de uma década de história. A escolha entra como
dependência de desenvolvimento, de modo que ela não viaja dentro da extensão.

Referências: `https://github.com/eemeli/yaml` e `https://github.com/nodeca/js-yaml`.

## 4. Como outros projetos declaram adaptação sobre código vendorizado

O problema não é novo, e vale registrar o que se faz fora daqui, porque a forma escolhida é uma
redução consciente de um padrão conhecido. 🟡

| Prática | Como declara a adaptação | Por que não foi adotada inteira |
|---------|--------------------------|--------------------------------|
| Série de correções ao estilo do empacotamento Debian | Uma pasta de arquivos de diferença, aplicados em ordem sobre a árvore original | É exatamente a alternativa que o usuário descartou: reaplica sozinho, mas o registro deixa de ser legível sem ferramenta |
| Vendorização do Go, com o inventário do módulo | Não admite adaptação: a cópia é conferida contra o resumo e divergência é erro | Adaptação é justamente o que este repositório precisa declarar, por causa da resolução de importações |
| Ferramentas de sincronização declarativa, ao estilo do `vendir` | Um arquivo declara origem, revisão e recortes, e um bloqueio guarda os resumos | É a forma mais próxima da adotada aqui, e foi a inspiração do par manifesto mais configuração local |
| Subárvore ou submódulo do git | A adaptação vira commit na árvore importada | NG-02 já os descartou na spec: ambos amarram o clone à presença e à forma da origem |

A forma adotada, trecho original e trecho adaptado em bloco literal, é a série de correções reduzida
ao que este repositório de fato tem: três substituições de uma a duas linhas, todas em declarações
de importação. A fragilidade da busca exata, que num projeto com dezenas de correções seria
proibitiva, aqui é a propriedade desejada, porque é ela que produz a parada exigida por RN-09.

## 5. Forma do resumo criptográfico

🟢 A escolha é SHA-256 em hexadecimal, com prefixo `sha256:`, calculado por `node:crypto`, que já
vem com a plataforma e não acrescenta dependência. O prefixo existe para que trocar de função no
futuro seja acréscimo legível, e não reinterpretação silenciosa dos 64 caracteres antigos.

Duas alternativas ficaram pelo caminho. A primeira é a forma usada pelo arquivo de bloqueio do
gerenciador de pacotes, com o resumo em base64 e a função embutida no prefixo. Ela é mais curta,
porém ilegível em revisão de diff, e o manifesto foi feito para ser lido. A segunda é usar o próprio
identificador de objeto do git para cada arquivo, o que dispensaria calcular resumo, mas amarraria o
manifesto ao formato interno de uma ferramenta e não descreveria o recorte que RN-03 exige, que é o
conteúdo sem as sete linhas de carimbo.

O recorte, aliás, é a parte que precisa de cuidado na implementação: o resumo do arquivo carimbado
cobre da linha 8 em diante, e o dos três fixtures cobre o arquivo inteiro. Sem essa distinção, toda
ressincronização faria todo arquivo parecer editado, porque o carimbo muda em todas elas.

## 6. Verificação como passo do build

🟡 A decisão do usuário foi rodar o verificador também no build. A investigação aqui foi de custo e
de escopo, e o resultado é que só a família local de conferências pode entrar.

O custo é baixo: 37 arquivos pequenos, um resumo por arquivo, leitura sequencial. A ordem de
grandeza é de dezenas de milissegundos, contra o teto de 10 s que o requisito não funcional fixa
para o verificador completo. O que não pode entrar é a comparação com as origens, por dois motivos:
ela depende de as origens estarem na máquina, e a máquina que empacota pode não tê-las; e ela
depende do estado de outro repositório, o que faria o resultado do build variar sem que este
repositório mudasse, quebrando o requisito de determinismo.

O precedente interno é a poda de tokens da feature 003, que interrompe a construção quando o fecho
transitivo vem vazio. A regra que dali se aprende é a mesma: o build só falha por coisa que ele
próprio possa observar.

## 7. Por onde a revisão chega ao painel

🟢 Quatro caminhos foram considerados, e três esbarram em invariante já escrito.

| Caminho | Onde esbarra |
|---------|--------------|
| Ler o manifesto da pasta de instalação da extensão | O invariante do PRD diz que a extensão não toca disco fora do workspace observado, e a pasta de instalação está fora dele |
| Ler o manifesto da raiz do workspace aberto | O manifesto pertence a este repositório; com a extensão instalada e outro projeto aberto, não existe manifesto algum lá |
| Gravar a revisão em campo do manifesto de pacote | Manter o campo atualizado caberia ao ressincronizador, e RN-07 lhe permite escrever apenas na pasta de herança, no manifesto e nas adaptações |
| Constante gerada no build a partir do manifesto | Nenhum invariante é tocado: não há leitura em tempo de execução, e quem escreve é o build |

O quarto foi o escolhido pelo usuário e é o único que não exige emendar regra existente. O preço é
um artefato gerado e versionado, e uma suíte que falha quando ele e o manifesto discordarem. Esse
preço é o que se paga para que esquecer de regenerar seja barulhento em vez de silencioso.

## 8. O caso do fixture preso por paridade

🟢 Um arquivo herdado tem restrição que os outros 36 não têm.
`src/heranca/reversa-domain/tests/fixtures/check-legacy-policy.mjs` precisa continuar idêntico ao
gancho que o Reversa instala em `.reversa/hooks/check-legacy-policy.mjs`, e a suíte
`tests/paridade-gancho-instalado.spec.ts` compara os dois byte a byte.

A consequência para esta feature é que ressincronizar esse arquivo não é operação neutra: uma
revisão nova da origem que o altere quebra a paridade com o gancho instalado, que por sua vez vem do
Reversa, e não da origem. O manifesto ganha por isso o campo `paridadeExterna`, o verificador o
relata como preso, e o ressincronizador recusa tocá-lo sem decisão humana explícita. É o único caso
em que a ferramenta sabe que reaplicar a origem pode ser a coisa errada a fazer.

## 9. O que não foi investigado

- **Assinatura das origens.** Nada aqui prova que a origem é a origem; prova-se que o conteúdo
  copiado não mudou. Como as duas origens são repositórios do próprio usuário, na mesma máquina, o
  ganho de assinar não paga a complexidade.
- **Ressincronização parcial por arquivo.** RN-09 exige tudo ou nada, e a investigação parou aí.
- **Detecção de mudança de comportamento sem mudança de conteúdo.** EC-05 já declara o limite, e a
  spec já nomeia as suítes herdadas como a rede que resta.
- **Automação do disparo do ritual.** NG-01 proíbe, e o ritual continua humano.
