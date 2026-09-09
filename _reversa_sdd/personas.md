# Personas e Jornadas

> Selo 🟡 PLANEJADO em todos os itens.

As duas personas são a mesma pessoa em dois modos de uso. O recorte foge da ortodoxia, que
reserva persona para pessoas distintas, e foi escolhido deliberadamente: em produto de usuário
único, o que gera desenho útil é separar o que a tela deve dizer quando o contexto se perdeu
do que ela deve dizer quando o contexto está quente.

O Retomador é a persona primária, confirmado pelo usuário em 2026-09-09: abrir a extensão e já
visualizar onde o pipeline está é o requisito que ordena o desenho. O painel se situa sozinho,
lendo os arquivos que o Reversa deixa no disco, sem comando prévio nem configuração.

## Persona 1: O Retomador

- **Perfil:** 🟡 Mantenedor único que volta a um projeto Reversa parado há semanas ou meses e
  precisa recuperar o estado antes de fazer qualquer coisa.
- **Contexto:** 🟡 Abre o VSCode num repositório que não toca há tempo, tipicamente numa janela
  curta espremida entre outros compromissos. Não lembra qual feature estava ativa, se a última
  entrega convergiu na extração, nem que decisão ficou pendente.
- **Nível técnico:** 🟡 Avançado, em arquitetura de software, processo e TypeScript. Iniciante
  circunstancial na memória do próprio projeto, porque a pausa apagou o contexto e não a
  competência.
- **Dor principal:** 🟡 Reconstruir o estado exige abrir meia dúzia de arquivos e conhecer regras
  de derivação que não estão escritas em lugar visível, como a que decide o estágio físico pelos
  artefatos presentes em vez do campo `current-stage`.
- **Objetivo final:** 🟡 Retomar o trabalho sem repagar o custo de reconstrução do contexto, para
  que a pausa não cobre juros.

### Jornada principal
1. 🟡 Abrir o repositório no VSCode depois da pausa longa
2. 🟡 Abrir o painel do Reversa na barra lateral e encontrá-lo já preenchido, sem rodar comando
   nem configurar caminho
3. 🟡 Ler a identidade do projeto, a versão do framework e a fase corrente da descoberta
4. 🟡 Identificar a feature ativa e o estágio físico em que ela parou
5. 🟡 Ver o que aguarda decisão humana, como entrega não convergida ou migração pausada
6. 🟡 Abrir o arquivo que o painel aponta e retomar o trabalho

---

## Persona 2: O Operador

- **Perfil:** 🟡 Mantenedor em sessão ativa, conduzindo os agentes do Reversa um após o outro
  e verificando cada passo antes de chamar o seguinte.
- **Contexto:** 🟡 Acabou de rodar um agente no terminal, ao lado do editor. Quer confirmar que o
  artefato saiu, que o estágio avançou e que nada degradou na leitura, tudo isso sem quebrar o
  ritmo da sessão.
- **Nível técnico:** 🟡 Avançado. Conhece o pipeline de cor, sabe o nome dos artefatos e o que
  cada agente deveria ter escrito.
- **Dor principal:** 🟡 A confirmação hoje custa abrir arquivo ou rodar `reversa status`, que
  imprime projeto, fase e duas listas, ignorando os eixos onde a informação acionável mora.
- **Objetivo final:** 🟡 Manter o ritmo do pipeline sem interromper o raciocínio para inspecionar
  disco a cada troca de agente.

### Jornada principal
1. 🟡 Rodar um agente do Reversa no terminal, ao lado do editor
2. 🟡 Voltar ao painel e atualizar a leitura do processo
3. 🟡 Conferir se o estágio físico avançou como esperado
4. 🟡 Verificar a contagem de ações fechadas, abertas e emendas da feature
5. 🟡 Checar anomalias registradas e o que a sonda recusou ler
6. 🟡 Chamar o próximo agente, ou corrigir o desvio que o painel revelou

---
Gerado por reversa-researcher em 2026-09-09T10:36:17Z
Fonte: ideation.md
