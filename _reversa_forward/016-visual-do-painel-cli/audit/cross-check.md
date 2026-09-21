# Auditoria cruzada: visual do painel de linha de comando

> Identificador: `016-visual-do-painel-cli`
> Data: `2026-09-21`
> Artefatos analisados: [`requirements.md`](../requirements.md), [`roadmap.md`](../roadmap.md), [`actions.md`](../actions.md)
> Lidos também, como apoio: `data-delta.md`, `interfaces/contrato-de-linha-de-comando.md`, `investigation.md`, `onboarding.md`
> Esta auditoria só lê. Nenhum dos artefatos foi alterado.

Método: o cruzamento de identificadores, a cobertura de decisões por ações, os alvos das ações `[//]` e
a ausência de ciclo foram conferidos por script sobre os três arquivos; os cenários e a coerência de
conteúdo, por leitura. O projeto não tem `_reversa_sdd/domain.md` nem `architecture.md`, de modo que o
eixo 3 foi conferido contra os adendos 014 e 015 e contra `sdd/painel-do-processo.md`.

## Resumo

| Severidade | Findings |
|------------|----------|
| CRITICAL | 0 |
| HIGH | 4 |
| MEDIUM | 8 |
| LOW | 3 |

## Findings

| ID | Severidade | Eixo | Descrição | Onde está |
|----|------------|------|-----------|-----------|
| A001 | HIGH | Consistência | A RN-04 fixa o acento igual nos dois fundos, e o NFR de acessibilidade exige 4,5 para todo texto de leitura; o acento mede 3,15 sobre branco. O roadmap resolve com dois papéis, `acento` e `destaque`, como premissa 🟡, mas o requirements continua afirmando as duas coisas | `requirements.md` seção 4, RN-04, e seção 6; `roadmap.md` D-04 e seção 4; `actions.md` T002, T009 |
| A002 | HIGH | Cobertura | O critério do RF-09 pede as **quatro** situações de entrada com título dentro de moldura. A D-22 deixa a raiz inexistente sem moldura, por ela terminar antes de existir interface viva. Desvio declarado no roadmap e não refletido no requirements | `requirements.md` RF-09 e cenário "falha de leitura"; `roadmap.md` D-22; `actions.md` T039 |
| A003 | HIGH | Cobertura | O critério do RF-14 diz que, com a localidade em `C`, a tela não apresenta caractere de substituição. O plano só troca glifos e molduras; a prosa em português, acentuada, continua saindo, e o roadmap registra isso como limite conhecido. O critério, como escrito, não é alcançado | `requirements.md` RF-14 e cenário "localidade sem Unicode"; `roadmap.md` seção 9, quinto risco; `onboarding.md` passo 8 |
| A004 | HIGH | Cobertura | A RN-07, a ferramenta não exibe nome, mascote, logotipo nem frase do produto de referência, não tem decisão no roadmap nem ação, e nenhuma suíte a confere. Vale por construção hoje, e nada impede que deixe de valer | `requirements.md` RN-07; ausente em `roadmap.md` e `actions.md` |
| A005 | MEDIUM | Cobertura | O cenário "texto hostil vindo do disco" é coberto em metade: a T011 prova `neutralizar`, e a T022 a liga ao construtor de trecho, mas nenhuma ação pede o caso de ponta a ponta, um quadro composto sobre descrição hostil sem ponto de código de controle. A T026 não o lista | `actions.md` T011, T022, T026 |
| A006 | MEDIUM | Cobertura | O critério do RF-20, nenhum byte escrito no terminal antes do primeiro desenho para descobrir o fundo, não tem asserção em ação alguma. A T010 cobre a precedência e a T032 o desenho, nenhuma a ausência de escrita | `requirements.md` RF-20; `actions.md` T010, T032 |
| A007 | MEDIUM | Consistência | O RF-17 e o cenário "amostras reproduzíveis" pedem uma amostra por situação de entrada, que são quatro; a T042 gera uma por situação "alcançável na interface viva", que são três. Consequência do A002, e a T047 repete a frase do requirements sem a ressalva | `requirements.md` RF-17; `actions.md` T042, T047 |
| A008 | MEDIUM | Consistência | O requirements chama de "linha de estado" o que o roadmap, o `data-delta.md` e o actions chamam ora de "linha de estado", ora de "rodapé": campo `Quadro.rodape`, suíte `cli-rodape`, módulo `estado.ts`. Dois nomes para a mesma coisa, e o módulo leva o que a suíte não leva | `roadmap.md` D-17, D-18, D-24; `actions.md` T013, T015, T025 |
| A009 | MEDIUM | Consistência | "Procedência" passa a nomear três coisas no terminal: o tipo `Procedencia`, a origem da leitura; o módulo `quadro/procedencia.ts`, que a escreve; e a seção nova `procedencia`, em `quadro/secao-de-procedencia.ts`, que guarda versões e carimbo. O requirements usa a palavra nos dois sentidos, RF-08 e RF-18 | `requirements.md` RF-08, RF-18; `roadmap.md` D-15, D-16; `data-delta.md` seção 6 |
| A010 | MEDIUM | Cobertura | Três alvos de ação não constam do delta arquitetural do roadmap: `src/cli/quadro/diagnostico.ts` (T021), `tests/vsix-conteudo.spec.ts` (T049) e `README.md` (T050). O primeiro é necessário ao RF-14 e foi descoberto na decomposição; o roadmap afirma, além disso, que as suítes não listadas "não são tocadas" | `roadmap.md` seção 5; `actions.md` T021, T049, T050 |
| A011 | MEDIUM | Cobertura | O NFR de desempenho, quadro de 500 linhas em menos de 50 ms, aparece só numa nota solta ao pé da fase 5, que o atribui à T026; a descrição da T026 não o menciona, e quem executar a tabela não o encontra | `requirements.md` seção 6; `actions.md` T026 e nota final |
| A012 | MEDIUM | Consistência | Rastreabilidade por identificador incompleta, com a substância coberta: o roadmap não cita RF-04, RF-07, RF-12, RF-15, RF-16, RN-06, RN-07 e RN-08 em decisão alguma, e o actions não cita RF-05 e RF-06, que a T023 cobre sob a forma "RF-04 a RF-07". Exceção de substância: RN-07, que é o A004 | `roadmap.md` seção 3; `actions.md` T023 |
| A013 | LOW | Consistência | O papel de estado positivo chama-se "concluído" no requirements, no roadmap e no tipo `Papel`, e "sucesso" no estudo, na `investigation.md` e em parte da D-05 | `roadmap.md` D-05; `investigation.md` seção 2 |
| A014 | LOW | Sanidade do actions | Duas ações no limite do atômico: a T046 grava o estado fixo **e** gera as amostras versionadas, em vários arquivos; a T036 reúne cinco subpontos sobre o laço | `actions.md` T036, T046 |
| A015 | LOW | Coerência com o legado | O adendo 014 registra vinte e seis scripts no manifesto, e a suíte mede trinta hoje; a T045 parte do número certo, trinta para trinta e dois. O descompasso é do adendo, e fica registrado para o `/reversa-sync` | `_reversa_sdd/addenda/014-cli-do-processo.md`; `actions.md` T045 |

## Impacto dos findings HIGH

**A001.** É o único ponto da feature em que dois requisitos 🟢 não cabem juntos ao pé da letra, e a
escolha entre eles é de quem decide o produto, e não do plano. Enquanto o requirements afirmar as duas
coisas, a T009 prende por suíte uma leitura que o documento de origem não autoriza: "o `acento` como
marca, ao menos 3". Se a leitura desejada for outra, acento único também em texto ou acento próprio por
fundo, mudam a T002, a T009 e as amostras. Direção: `/reversa-clarify`, para registrar na RN-04 ou no NFR
qual das duas cede, ou edição manual do requirements confirmando a D-04.

**A002.** O desvio é defensável e está bem justificado no roadmap, mas um critério de aceite escrito
como "cada uma das quatro" será reprovado por quem conferir a entrega contra o requirements. O A007 é
consequência direta. Direção: `/reversa-clarify` ou edição manual do RF-09, restringindo o critério às
situações que chegam à interface viva, ou, ao contrário, revisão manual da D-22.

**A003.** O critério é inalcançável sem transliterar a prosa, o que nenhum requisito pede e que mudaria
frases, contra a RN-01. Como está, o cenário "localidade sem Unicode" reprova no primeiro texto
acentuado, e o RF-14 é Should com critério de Must. Direção: `/reversa-clarify` ou edição manual,
limitando o critério aos glifos e às molduras que a própria ferramenta escreve.

**A004.** A regra protege contra imitação de identidade, e é a única RN sem vigia. O custo de cobri-la é
baixo, uma guarda por busca nos fontes no molde de `cli-boundaries`, mas ela precisa nascer como decisão
e como ação para existir. Direção: edição manual do `roadmap.md` e do `actions.md`, ou nova passada de
`/reversa-plan` e `/reversa-to-do`.

## O que passou

**Cobertura**
- Todos os 21 RF têm decisão ou componente correspondente no roadmap, com as ressalvas de A002, A003 e A012
- As 24 decisões, D-01 a D-24, são citadas por ao menos uma ação
- Todo arquivo que o roadmap nomeia tem ação que o alcança
- Vinte dos 22 cenários têm ação que os exercita por inteiro; os outros dois são o A005 e o A003
- Os cenários "a saída de dados não muda" e "as duas superfícies continuam de acordo" são cobertos pela **ausência** deliberada de ação sobre `cli-paridade` e as suítes de dados, que o critério de pronto confere

**Consistência**
- Nenhum identificador fantasma: todo RF, RN e D citado no roadmap e no actions existe
- O contrato de `interfaces/contrato-de-linha-de-comando.md` consta da seção 7 do roadmap e é alvo das T033 a T035
- A tabela de glifos, a da paleta e os tipos do `data-delta.md` coincidem com as D-02 a D-06, D-12 e D-13
- A contagem de scripts da T045, trinta para trinta e dois, confere com `tests/host-manifest.spec.ts`

**Coerência com o legado**
- `sectionOrder()` e `SectionName` não são alvo de ação: a RN-04 da 014 fica inteira
- O caractere de escape continua confinado a `terminal.ts`; a T004 e a T030 dizem como, e a T048 só acrescenta à suíte de fronteiras
- Nenhuma ação toca `src/webview/`, `src/host/` nem `dependencies`: o G-04 do painel e a doutrina de zero dependência ficam inteiros
- A escrita das amostras mora em `scripts/`, fora de `src/cli/`, e a RN-02 da 014 continua verificável por busca
- Os componentes citados existem: `src/cli/quadro/{index,cabecalho,secoes,bloqueio,entrada,ajuda,medidas,procedencia,diagnostico}.ts`, `terminal.ts`, `argumentos.ts`, `uso.ts`, `laco.ts`, `passada.ts`, `navegacao.ts` e as onze suítes `cli-*`

**Sanidade do actions**
- 50 ações, IDs de T001 a T050, sem lacuna e sem repetição
- Toda dependência aponta para ID existente e anterior; não há ciclo
- Nenhum par de ações `[//]` independentes compartilha arquivo alvo; onde o arquivo se repete, T005 e T006, T007 e T008, T018 e T019, T030 e T031, a segunda depende da primeira e não é paralela
- Os números do resumo, 27 paralelas e cadeia de 16, conferem com a tabela
- A remoção de `enfase`, T041, depende de todas as ações que ainda a leem
