# Adendo: herança e sincronia

> Identificador da feature: `004-heranca-e-sincronia`
> Data: `2026-09-09`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Este adendo é uma ponte. A extração em `_reversa_sdd/` descreve o produto como ele foi
especificado, e a entrega da feature 004 converteu em dado conferível aquilo que a spec previa como
regime documentado: a procedência dos arquivos herdados deixou de ser prosa em que se acredita e
passou a ser manifesto que uma ferramenta lê. Em oito pontos o código foi além do que a spec do
componente previa, e em um ele acrescentou custo que a spec havia proibido, declarado abaixo. O que
segue diz como ler cada artefato da extração enquanto a re-extração não vem.

## Vigência

Vigente desde 2026-09-09.

## Resumo da entrega

A feature fecha o regime pelo qual código de fora vive dentro deste repositório. As features 001 a
003 deixaram o registro em prosa, com carimbo em cada arquivo copiado e as três adaptações
descritas; faltava o que torna esse registro verificável e reaplicável. A entrega acrescenta quatro
peças: um manifesto com resumo criptográfico de cada arquivo herdado, um verificador que mede a
defasagem contra as duas origens, um arquivo de adaptações que o ressincronizador reaplica por
busca exata, e o ritual escrito que diz quando rodar cada coisa. A persona servida é o Retomador,
que volta depois de meses e precisa saber, sem comparar código à mão, se a cópia ainda corresponde
à origem.

Duas decisões de forma ordenam o resto. A primeira é que o resumo cobre o conteúdo herdado, e não o
arquivo: da linha 8 em diante nos 34 carimbados, e o arquivo inteiro nos três fixtures isentos. É o
que impede que ressincronizar, ato que reescreve o carimbo por definição, apareça como edição
local. A segunda é que a camada nova quase não entra no produto: doze dos arquivos criados são
ferramentas de manutenção que rodam por comando de pacote, e o que delas chega ao empacotado é uma
única constante gerada, de modo que a fronteira do host não mudou.

**44 ações concluídas de 44 previstas**, conforme `actions.md` e as 45 linhas de `progress.jsonl`,
das quais uma é a medição de tempo registrada sobre a última ação. Nenhuma ação ficou aberta, e por
isso **esta é uma sincronização total**. A suíte passou de 487 casos em 42 arquivos para 597 casos
em 52 arquivos, sem falha e sem pulo. O verificador completo, com as duas origens ao alcance e os
37 arquivos lidos da origem, levou de 80 a 98 ms contra o teto de 10 s do requisito não funcional.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `#6-restricoes` | componente-novo | A restrição de que todo arquivo herdado carrega origem, versão e data, com ritual de ressincronização documentado, deixou de depender de disciplina. Leia-a como cumprida e conferível: o manifesto guarda as duas origens e os 37 arquivos com resumo criptográfico, e o modo local do verificador termina alinhado sobre eles. |
| `_reversa_sdd/prd.md` | `#7-dependencias-externas` | regra-alterada | As duas origens de construção deixaram de ser caminho presumido e passaram a ser caminho declarado em arquivo de máquina que o git ignora, com exemplo versionado ao lado. A lista ganhou uma entrada que a seção não previa: o interpretador de YAML, em igualdade exata e sem dependência transitiva, exigido pelo manifesto e pelas adaptações. |
| `_reversa_sdd/prd.md` | `#8-riscos` | componente-novo | O risco de maior impacto do produto, o modelo vendorizado divergir do Reversa e o painel mentir sem avisar, passou a ter medida e não apenas mitigação declarada. A defasagem é mensurável por comando, e a revisão herdada aparece no cabeçalho do painel. O risco vizinho, de a ressincronização depender de disciplina humana, permanece por escolha: o que se automatizou foi a medição, não a decisão. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | componente-novo | Os dez requisitos da seção estão implementados. Leia-os como contrato cumprido, não como plano. O `requirements.md` da feature acrescentou nove: RF-11 a RF-14 vieram do manifesto inválido, da recusa por edição local e da revisão exposta por constante gerada, RF-15 trouxe o sexto item do cabeçalho, RF-16 a RF-18 fixaram o ritual e o limite declarado no README, e RF-19 pôs a conferência local dentro do build. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#7-requisitos-nao-funcionais` | regra-alterada | **RNF-02 foi flexibilizado de propósito e é o único ponto em que a entrega contraria a spec.** A seção pedia apenas Node e o que já estava no repositório, e a entrega acrescentou o interpretador de YAML como dependência de desenvolvimento, por decisão do usuário registrada em D-03: o formato precisa preservar comentários na reescrita e informar linha do defeito. Os demais estão atendidos com folga: o verificador completo levou de 80 a 98 ms contra 10 s, o carimbo ocupa sete linhas contra o teto de dez, e o ressincronizador não cria commit. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#8-design-e-interface` | componente-novo | Os cinco estados de saída previstos viraram dez tipos de achado, e a diferença importa para quem for reextrair. Aos cinco somam-se carimbo inconsistente com o manifesto, arquivo não manifestado, arquivo ausente do disco, arquivo novo na origem e adaptação que deixou de casar. O relatório ganhou forma que a seção não fixava: bloco por origem, veredito por bloco, veredito geral e três códigos de saída que separam o que impede de prosseguir do que apenas informa. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#9-modelo-de-dados` | delta-de-dados | **Leia esta seção com o `data-delta.md` da feature ao lado.** As duas estruturas continuam sendo o manifesto e as adaptações, ambas legíveis por pessoa, mas as formas concretas trazem campos que o esboço não nomeava: a marca de carimbo por arquivo, que distingue os 34 carimbados dos três fixtures isentos, e a paridade externa, que prende um fixture ao gancho instalado. Um terceiro arquivo entrou no modelo e não é versionado, o das origens locais, e um quarto é derivado, a constante gerada da revisão. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#10-integracoes-e-dependencias` | componente-novo | O comportamento previsto para origem indisponível está implementado e é o estado normal desta máquina: o verificador cai para o modo local, conclui as seis conferências que não dependem de origem e sai com código zero. Nenhum comando toca a rede. A dependência do git para reverter continua verdadeira, e o ressincronizador reforça-a por não criar commit. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#11-edge-cases-e-tratamento-de-erros` | componente-novo | Os oito casos de EC-01 a EC-08 têm tratamento, e sete têm cobertura por suíte. EC-05, o caso em que o resumo confere e o comportamento mudou, continua fora do alcance do verificador por construção, e passou a estar declarado por escrito no README, com a dependência transitiva nomeada como o caso não coberto e as suítes herdadas como a rede que resta. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#12-seguranca-e-privacidade` | componente-novo | A seção continua verdadeira e deixou de depender de revisão humana. Que o verificador nunca escreva e que o ressincronizador escreva apenas na pasta de herança, no manifesto e nas adaptações são hoje RN-06 e RN-07, ambas verificadas por suíte, incluindo a prova de que nenhuma das três recusas do ressincronizador escreveu byte algum. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#13-plano-de-rollout` | componente-novo | O rollout previa que o ressincronizador pudesse entrar na feature seguinte, e ele entrou nesta, completo e em duas fases. A estratégia mudou noutro ponto: a conferência local passou a rodar dentro do build, antes da compilação, enquanto a comparação com as origens ficou fora dele de propósito, porque build que depende de outra pasta existir no disco falha por motivo que não é do código. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#14-open-questions` | componente-novo | As três questões foram fechadas pela entrega. OQ-01 resolveu-se pelo commit do git para o modelo e pela versão do manifesto de pacote para o kit, que têm ritmos distintos; OQ-02 pelos trechos textuais com exigência de ocorrência única, em vez de arquivos de diferença; OQ-03 pelos dois modos do verificador, com o local no build e o completo sob demanda. |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#15-decisoes-tomadas-decision-log` | componente-novo | As seis decisões foram exercidas, e não apenas registradas. A elas somam-se as catorze decisões técnicas do `roadmap.md` da feature, das quais quatro mudam como a spec deve ser lida: o recorte do resumo a partir da linha 8, a aplicação das adaptações ao conteúdo da origem antes de comparar, a revisão que chega ao painel por módulo gerado e versionado, e os dois modos do verificador sobre um julgamento único. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#6-requisitos-funcionais` | componente-novo | O host ganhou um módulo que a seção não previa, `src/host/inheritance.ts`, gerado a partir do manifesto e versionado. Ele existe para que a revisão da origem chegue ao painel sem que o host leia arquivo em tempo de execução, o que preserva intacto o invariante de a extensão nunca escrever e não acrescenta leitura fora do workspace. Uma suíte de coerência falha quando a constante e o manifesto discordarem. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-contrato-externo | O protocolo cresceu por acréscimo, como a regra de `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md` exige: `SetProcessData` ganhou o sétimo campo, `inheritedRevision`, e `SetEntryData` ficou intacto, porque não há cenário de entrada que precise da revisão. As duas declarações do contrato, uma de cada lado da fronteira de compilação, acompanharam o campo novo. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | regra-alterada | RF-02 deve ser lido com um item a mais: o cabeçalho passou de cinco elementos para seis, com a revisão do modelo herdado ao lado da versão do Reversa lida. É o fechamento da dívida que o adendo da feature 003 registrou em aberto, e é também RF-08 da spec de herança. |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#8-design-e-interface` | regra-alterada | O sexto item segue as regras que os outros cinco já seguiam: a abreviação da revisão em sete caracteres é função pura do domínio da webview, e a ausência do dado produz o mesmo texto de não declarado que os demais itens usam. Nenhum estado visível foi acrescentado nem removido. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | regra-alterada | RF-03 deixou de descrever o build inteiro: antes de limpar a saída e compilar, o comando agora confere a herança localmente e regenera a constante da revisão, e falha se a conferência falhar. O manifesto de pacote passou de seis para dez scripts, com o verificador em dois modos, o ressincronizador e o gerador da constante, e a suíte que fixa a lista exata acompanhou a mudança em vez de sofrê-la. |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#7-requisitos-nao-funcionais` | regra-alterada | RNF-04 e RNF-05 continuam atendidos com a dependência nova: o interpretador de YAML entra como dependência de desenvolvimento, sem instalação global e sem dependência transitiva, declarado em igualdade exata para que o clone de daqui a um ano instale a mesma versão. O tempo do build cresceu pelos dois passos acrescentados, e a medida ainda não foi tomada contra o teto de 30 s. |

Resumo: 19 impactos registrados. Onze de tipo `componente-novo`, seis de `regra-alterada`, um de
`delta-de-dados` e um de `delta-de-contrato-externo`. Nenhum `componente-extinto`, `regra-nova` ou
`regra-removida`.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001,
002 e 003: sem extração `/reversa` sobre este repositório não há regras 🟢, e sem regras 🟢 não há o
que vigiar.

Os identificadores **W076 a W094** existem, reservados e estáveis, na seção "Observações" daquele
arquivo, cobrindo os dezenove requisitos funcionais desta feature. Eles seguem a numeração da
feature 003, que usou W042 a W075. Nenhum identificador antigo foi reciclado nem reescrito.

Conteúdo integral em `_reversa_forward/004-heranca-e-sincronia/regression-watch.md`. Três
observações registradas ali merecem atenção de quem rodar a próxima extração: o resumo criptográfico
cobre o conteúdo herdado e não o arquivo, de modo que qualquer mudança nesse recorte invalida os 37
resumos de uma vez; a origem do código não está clonada nesta máquina, e por isso o modo completo do
verificador foi exercido contra um espelho montado em pasta temporária; e a verificação visual
dentro do editor segue pendente, herdada das features 002 e 003.

## Fontes

- `_reversa_forward/004-heranca-e-sincronia/legacy-impact.md`
- `_reversa_forward/004-heranca-e-sincronia/regression-watch.md`
- `_reversa_forward/004-heranca-e-sincronia/requirements.md`
- `_reversa_forward/004-heranca-e-sincronia/roadmap.md`
- `_reversa_forward/004-heranca-e-sincronia/actions.md`
- `_reversa_forward/004-heranca-e-sincronia/progress.jsonl`
