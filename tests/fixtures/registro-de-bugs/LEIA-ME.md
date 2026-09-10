# Fixtures do registro de bugs

Uma fixture por linha da tabela de desvios do contrato, em
`_reversa_forward/008-cronologia-do-ciclo-bugs/interfaces/registro-de-bugs.md`, seção 5. Cada arquivo
é um bloco de front matter isolado, e não um `bug.md` inteiro: o que a suíte de T008 exercita é o
interpretador restrito de D-02, que só lê o bloco entre as marcas.

Os três `real-*.md` são **transcrições literais** dos `bug.md` que o registro deste projeto tinha em
2026-09-10, copiados por script e não redigitados. Eles são a única forma de provar que o leitor
atravessa a matéria-prima de verdade, com os blocos aninhados, as listas de objetos em forma de fluxo
e a armadilha que a apuração de T001 encontrou: as linhas `- id: CHG-001` sob `change_set:`, que um
leitor descuidado leria como o identificador do bug.

Os demais são sintéticos, e cada um isola **um** desvio:

| Arquivo | O desvio que isola |
|---|---|
| `sem-front-matter.md` | Arquivo que não abre com a marca; não há bloco a ler |
| `bloco-truncado.md` | O bloco abre e o arquivo acaba sem a marca de fechamento |
| `estado-desconhecido.md` | `status` fora dos três do vocabulário |
| `data-malformada.md` | `created` e `updated` fora da forma de data |
| `bloqueio-declarado.md` | `blocking` com item, em vez da lista vazia dos reais |
| `visibilidade-restrita.md` | `visibility: restricted`, que RN-02 mantém fora das views |
| `titulo-com-dois-pontos.md` | Título com `: ` no meio, forma legítima que os reais ainda não têm |
| `sem-identificador.md` | Bloco legível e sem `id` |
| `campo-em-bloco-aninhado.md` | Campo consumido escrito em forma que o leitor declaradamente não lê |

Nenhum deles é `bug.md` de bug algum. Estão aqui para a suíte, e o registro de verdade não os
conhece.
