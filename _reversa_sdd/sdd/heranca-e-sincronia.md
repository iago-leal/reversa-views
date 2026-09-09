# Spec: heranca-e-sincronia

> Selo 🟡 PLANEJADO em todos os itens. Componente 4 de 5 do `reversa-views`.

**Versão:** 1.0
**Status:** Rascunho
**Autor:** reversa-spec-sdd
**Data:** 2026-09-09
**Reviewers:** N/A

---

## 1. Resumo

🟡 O regime pelo qual código de fora entra neste repositório e se mantém alinhado à origem. Há
duas origens com ritmos distintos: o `scrum-harness`, de onde vêm o modelo e a sonda, que seguem o
Reversa; e o `vscode-kanban`, de onde vem o kit de extensão, que segue o editor. Cada arquivo
herdado carrega um carimbo de procedência, um manifesto único lista todos eles, um verificador mede
a defasagem, e um ritual documentado diz quando e como ressincronizar. Nada disso é automático: é
disciplina tornada barata e legível.

---

## 2. Contexto e Motivação

**Problema:**
🟡 Vendorizar compra autonomia e cobra divergência. O dia em que o Reversa mudar o formato de um
arquivo, o modelo copiado passa a julgar errado, e o painel, que existe para dizer a verdade, mente
sem avisar. Esse é o risco de maior impacto e maior chance da tabela do PRD, e o que o torna
perigoso é ser silencioso: nada quebra, nada falha, a tela apenas fica errada.

O segundo problema é a retomada. O mantenedor volta depois de meses e encontra arquivos que não
escreveu, sem saber de onde vieram, o que foi adaptado nem se a origem já mudou. Sem procedência
legível, a única saída é comparar código à mão.

**Evidências:**
🟡 As duas origens estão na mesma máquina, em `~/HARNESS/scrum-harness` e `~/dev/vscode-kanban`,
e ambas evoluem: a primeira acompanha o Reversa, hoje na versão 1.3.3, e a segunda acumula releases
próprios, hoje na 1.35.8. O `.vscodeignore` do `vscode-kanban` registra um incidente de distribuição
indevida que só foi percebido na versão 1.34.5, prova de que o que não é verificado escapa.

**Por que agora:**
🟡 O carimbo e o manifesto só são baratos na cópia inicial. Acrescentá-los depois exige reconstruir
a procedência de memória, que é exatamente o que o mantenedor intermitente não tem.

---

## 3. Goals (Objetivos)

- [ ] G-01: 🟡 Tornar a procedência de todo arquivo herdado legível no próprio arquivo, sem consulta
  a documentação nem a histórico do git.
- [ ] G-02: 🟡 Medir a defasagem entre a cópia e a origem com um comando, em menos de 10 s, quando a
  origem estiver na máquina.
- [ ] G-03: 🟡 Registrar toda adaptação local como delta declarado, para que a ressincronização
  saiba o que reaplicar.
- [ ] G-04: 🟡 Manter as suítes de teste herdadas rodando como parte da suíte deste repositório,
  como contrato vivo do que foi copiado.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---|---|---|---|
| 🟡 Arquivos herdados sem carimbo de procedência | 🟡 Não existe | 🟡 0 | 🟡 Permanente |
| 🟡 Tempo do verificador de defasagem | 🟡 Não existe | 🟡 Abaixo de 10 s | 🟡 30 dias |
| 🟡 Suítes herdadas rodando na suíte local | 🟡 0 de 20 | 🟡 20 de 20 | 🟡 30 dias |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: 🟡 Automatizar a ressincronização. Ela é ritual humano, disparado por sinal, porque
  mudança na origem pode exigir decisão que script nenhum toma.
- NG-02: 🟡 Submódulo ou subárvore do git. Ambos amarram o clone à presença e à forma da origem, que
  é o que a vendorização evita.
- NG-03: 🟡 Extrair pacote comum publicado. Decisão adiada e registrada no brief; reabrir quando
  houver um terceiro consumidor.
- NG-04: 🟡 Manter fork das origens. As origens são do próprio usuário; o que se herda é padrão e
  código, não repositório.
- NG-05: 🟡 Sincronizar de volta. Melhoria feita aqui não flui para a origem por este componente.

---

## 5. Usuários e Personas

**Usuário primário:** 🟡 O Retomador, que abre um arquivo herdado meses depois e precisa saber, no
cabeçalho, de onde veio, de que versão e o que mudou.

**Usuário secundário:** 🟡 O Operador, que rodou o Reversa numa versão nova, viu anomalia de campo
desconhecido no painel e precisa saber se é hora de ressincronizar.

**Jornada atual (sem a feature):**
1. 🟡 O usuário encontra um arquivo que não escreveu e não sabe de onde veio.
2. 🟡 Compara com a origem à mão, se lembrar qual é.

**Jornada futura (com a feature):**
1. 🟡 O usuário lê o carimbo no topo do arquivo.
2. 🟡 Roda o verificador e vê o que mudou na origem.
3. 🟡 Segue o ritual do README para ressincronizar, reaplicando as adaptações declaradas.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | 🟡 O sistema deve carregar, em todo arquivo herdado, um cabeçalho com repositório de origem, caminho na origem, identificador de revisão da origem e data da cópia | Must | 🟡 Todo arquivo sob a pasta de herança começa com o cabeçalho, e o verificador falha se algum não começar |
| RF-02 | 🟡 O sistema deve manter um manifesto único que lista todo arquivo herdado com origem, revisão, data e resumo criptográfico do conteúdo copiado | Must | 🟡 O manifesto existe, e cada arquivo herdado tem uma entrada nele |
| RF-03 | 🟡 O sistema deve oferecer um verificador que compara cada arquivo herdado com o manifesto e com a origem, quando esta estiver na máquina, e relata edição local não declarada, divergência da origem e origem indisponível | Must | 🟡 Um arquivo editado localmente sem registro é apontado; uma origem ausente é relatada como indisponível, não como erro |
| RF-04 | 🟡 O sistema deve registrar toda adaptação local como delta declarado, com o arquivo, o motivo e o trecho, num arquivo de adaptações ao lado do manifesto | Must | 🟡 A remoção da camada de rota do probe consta como adaptação declarada |
| RF-05 | 🟡 O sistema deve oferecer um ressincronizador que copia da origem, reaplica as adaptações declaradas, atualiza carimbos e manifesto, e para com relatório se uma adaptação não puder ser reaplicada | Must | 🟡 Uma adaptação em conflito com a origem nova interrompe a ressincronização com o nome do arquivo e do trecho |
| RF-06 | 🟡 O sistema deve copiar as suítes de teste da origem junto com o código, e executá-las como parte da suíte local | Must | 🟡 As suítes herdadas rodam pelo mesmo comando de teste do repositório |
| RF-07 | 🟡 O sistema deve documentar no README o ritual: os sinais que o disparam, o comando do verificador, o comando do ressincronizador e o que fazer quando ele para | Must | 🟡 O README tem a seção, e ela nomeia os três sinais: anomalia de campo desconhecido no painel, nova versão do Reversa instalada, e nova release da origem do kit |
| RF-08 | 🟡 O sistema deve expor a revisão da origem do modelo à camada de leitura, para que o painel a mostre no diagnóstico | Must | 🟡 O cabeçalho do painel mostra a revisão do modelo herdado ao lado da versão do Reversa lida |
| RF-09 | 🟡 O sistema deve tratar as duas origens como entradas separadas no manifesto, com ritmo de verificação e sinais de disparo próprios | Should | 🟡 O verificador relata cada origem em bloco próprio |
| RF-10 | 🟡 O sistema deve localizar as origens por caminho declarado num arquivo de configuração local, ignorado pelo git, e não por caminho fixo no código | Should | 🟡 Mover a origem de pasta exige editar uma linha, e o verificador diz qual |

### 6.2 Fluxo Principal (Happy Path)

1. 🟡 O usuário nota um dos três sinais de disparo.
2. 🟡 Roda o verificador, que relata por origem o que divergiu.
3. 🟡 Lê o relatório e decide ressincronizar.
4. 🟡 Roda o ressincronizador, que copia, reaplica as adaptações e atualiza carimbos e manifesto.
5. 🟡 Roda a suíte de testes, que inclui as suítes herdadas.
6. 🟡 Registra no changelog a revisão nova da origem.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A, adaptação em conflito:**
1. 🟡 O ressincronizador não consegue reaplicar um delta declarado.
2. 🟡 Para, com o nome do arquivo, o trecho esperado e o trecho encontrado.
3. 🟡 O usuário resolve à mão, atualiza o delta declarado e roda de novo.

**Fluxo Alternativo B, origem ausente:**
1. 🟡 A pasta da origem não está na máquina.
2. 🟡 O verificador ainda confere carimbos e edições locais pelo manifesto, e relata a origem como indisponível.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | 🟡 Tempo do verificador | 🟡 Abaixo de 10 s | 🟡 Poucas dezenas de arquivos e resumos criptográficos baratos |
| RNF-02 | 🟡 Dependências do verificador e do ressincronizador | 🟡 Apenas Node e o que já está no repositório | 🟡 Sem ferramenta a instalar para rodar o ritual |
| RNF-03 | 🟡 Legibilidade do carimbo | 🟡 Cabe nas dez primeiras linhas do arquivo | 🟡 Quem abre o arquivo vê antes de rolar |
| RNF-04 | 🟡 Reversibilidade da ressincronização | 🟡 Um comando do git desfaz | 🟡 O ressincronizador não faz commit; o usuário revisa o diff antes |

---

## 8. Design e Interface

**Componentes afetados:** 🟡 A pasta de herança com o código copiado, o manifesto, o arquivo de
adaptações, os dois scripts e a seção do README.

**Comportamento esperado:**
🟡 Interface de linha de comando, com dois comandos e saída em texto legível. O verificador nunca
altera nada; o ressincronizador altera apenas a pasta de herança, o manifesto e os carimbos, e
deixa o diff para o git.

**Estados da saída do verificador:**
- 🟡 Alinhado: toda entrada do manifesto confere com o arquivo e com a origem.
- 🟡 Editado localmente: um arquivo difere do manifesto sem delta declarado.
- 🟡 Origem avançou: o arquivo confere com o manifesto, e a origem tem conteúdo diferente.
- 🟡 Origem indisponível: a pasta declarada não existe na máquina.
- 🟡 Sem carimbo: um arquivo na pasta de herança não começa com o cabeçalho.

---

## 9. Modelo de Dados

🟡 Duas estruturas persistidas no repositório, ambas legíveis por pessoa:

```
Manifesto {
  origens: lista de { nome, caminhoLocalDeclaradoEm, revisao, dataDaCopia }
  arquivos: lista de {
    caminhoLocal, origem, caminhoNaOrigem, resumoDoConteudo, dataDaCopia
  }
}

Adaptacoes {
  itens: lista de { arquivo, motivo, trechoOriginal, trechoAdaptado }
}
```

🟡 O carimbo no arquivo repete origem, caminho, revisão e data, para ser legível sem abrir o manifesto.

**Migrações necessárias:** 🟡 Não.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| 🟡 Pasta do `scrum-harness` na máquina | Opcional para verificar, obrigatória para ressincronizar | 🟡 Indisponível: o verificador relata e segue com o manifesto; o ressincronizador recusa e diz qual caminho configurar |
| 🟡 Pasta do `vscode-kanban` na máquina | Opcional para verificar, obrigatória para ressincronizar | 🟡 Mesmo comportamento |
| 🟡 Git | Obrigatória para reverter | 🟡 Sem git, a ressincronização ainda roda, e a reversão passa a ser manual |
| 🟡 Rede ou serviço remoto | Nenhuma | 🟡 Nenhum comando toca a rede; não há timeout nem indisponibilidade externa a tratar |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: 🟡 Origem movida de pasta | 🟡 Usuário reorganizou `~/dev` ou `~/HARNESS` | 🟡 O verificador relata origem indisponível e nomeia o arquivo de configuração e a chave a editar |
| EC-02: 🟡 Origem com revisão nova que muda contrato do modelo | 🟡 O Reversa mudou de formato e o `scrum-harness` acompanhou | 🟡 O ressincronizador copia, as suítes herdadas passam a cobrir o formato novo, e a falha eventual aparece nos testes, não no painel |
| EC-03: 🟡 Adaptação declarada conflita com a origem nova | 🟡 A origem alterou o trecho que a adaptação toca | 🟡 O ressincronizador para naquele arquivo, mostra os dois trechos, e não toca nos demais até o usuário decidir |
| EC-04: 🟡 Arquivo herdado editado à mão sem delta declarado | 🟡 Correção rápida esquecida | 🟡 O verificador aponta o arquivo como editado localmente, e o ressincronizador recusa sobrescrever sem que o delta seja declarado ou a edição descartada |
| EC-05: 🟡 Resumo criptográfico confere e comportamento mudou | 🟡 Dependência transitiva da origem atualizada | 🟡 Fora do alcance do verificador por construção; as suítes herdadas são a rede que resta, e o README declara esse limite |
| EC-06: 🟡 Arquivo novo na origem, ausente no manifesto | 🟡 A origem ganhou um módulo | 🟡 O verificador lista o arquivo como novo na origem, sem copiá-lo; a decisão de herdar é humana |
| EC-07: 🟡 Manifesto corrompido ou inválido | 🟡 Conflito de merge mal resolvido | 🟡 O verificador falha com a linha do problema e não emite relatório parcial que pareça íntegro |
| EC-08: 🟡 Ressincronização interrompida no meio | 🟡 Falha de disco ou interrupção pelo usuário | 🟡 O git mostra o estado parcial; o README instrui a descartar o diff e rodar de novo |

---

## 12. Segurança e Privacidade

- **Autenticação:** 🟡 Não se aplica.
- **Autorização:** 🟡 O ressincronizador escreve apenas dentro da pasta de herança, no manifesto e
  nas adaptações. Nenhum comando escreve fora do repositório nem nas origens.
- **Dados sensíveis:** 🟡 Nenhum. Os arquivos herdados são código-fonte do próprio usuário.
- **Auditoria:** 🟡 O manifesto e os carimbos são a trilha. O diff do git mostra cada ressincronização.

---

## 13. Plano de Rollout

- **Estratégia:** 🟡 Carimbo e manifesto nascem com a cópia inicial, antes de qualquer outro
  componente. O verificador entra na mesma feature; o ressincronizador pode entrar na seguinte,
  porque a primeira ressincronização só ocorrerá quando um sinal disparar.
- **Como reverter:** 🟡 Toda ressincronização é um diff no git, revisado antes de commit. Reverter
  é descartar o diff.
- **Monitoramento pós-entrega:** 🟡 Os três sinais do ritual, dos quais o mais provável é a anomalia
  de campo desconhecido no painel.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| OQ-01 | 🟡 O identificador de revisão da origem deve ser o commit do git, a versão do manifesto do pacote, ou ambos? | Médio | 🟡 iago | 🟡 Antes da cópia inicial |
| OQ-02 | 🟡 As adaptações devem ser declaradas como trechos textuais ou como arquivos de diferença aplicáveis por ferramenta? | Médio | 🟡 iago | 🟡 Antes da primeira ressincronização |
| OQ-03 | 🟡 O verificador deve rodar como passo do build, falhando-o em caso de arquivo sem carimbo, ou apenas sob demanda? | Baixo | 🟡 iago | 🟡 Antes do primeiro empacotamento |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| 🟡 Vendorização carimbada | 🟡 Dependência relativa; pacote comum; reimplementação | 🟡 Registrada no brief: o repositório precisa compilar sozinho depois de meses; as demais custam mais agora ou amarram a vizinhos |
| 🟡 Ritual humano, não automação | 🟡 Verificação no build; sincronização por hook | 🟡 Mudança na origem pode exigir decisão; o que se automatiza é a medição, não a escolha |
| 🟡 Manifesto com resumo criptográfico | 🟡 Só o carimbo no arquivo | 🟡 O carimbo diz de onde veio; o resumo diz se foi mexido; são perguntas diferentes |
| 🟡 Adaptações declaradas à parte | 🟡 Editar a cópia e confiar no diff do git | 🟡 O diff do git some no próximo commit; a declaração sobrevive e é reaplicável |
| 🟡 Duas origens com entradas separadas | 🟡 Uma lista única | 🟡 Ritmos e sinais diferentes; misturar faria o verificador acusar defasagem do kit quando só o Reversa mudou |
| 🟡 Suítes herdadas copiadas junto | 🟡 Confiar nas suítes da origem | 🟡 A suíte é o contrato do que foi copiado; sem ela a divergência só aparece no painel |

---

## Apêndice

### Referências
- 🟡 `_reversa_sdd/newproject-brief.md`, decisões de abertura
- 🟡 `_reversa_sdd/prd.md`, seções 6, 7 e 8
- 🟡 `_reversa_sdd/ideation.md`, premissa 3
- 🟡 Origens: `~/HARNESS/scrum-harness/packages/reversa-domain`, `packages/reversa-probe`, `~/dev/vscode-kanban`

### Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-09-09 | reversa-spec-sdd | Criação inicial |

---

## Relatório de avaliação (spec_scorer.py)

```
============================================================
  SPEC QUALITY REPORT
  Arquivo: /Users/iagoleal/dev/reversa-views/_reversa_sdd/sdd/heranca-e-sincronia.md
============================================================

  SCORE TOTAL: 100.0/100  —  ⭐ Excelente — Pronta para implementação

  BREAKDOWN POR DIMENSÃO:
  Dimensão             Score      Peso     Contribuição
  --------------------------------------------------
  Completude           100%       30%     30.0/pt
  Testabilidade        100%       25%     25.0/pt
  Clareza              100%       20%     20.0/pt
  Escopo               100%       15%     15.0/pt
  Edge Cases           100%       10%     10.0/pt

  ✅ PONTOS FORTES:
     ✅ Seção 1 (Resumo) presente e preenchida
     ✅ Seção 2 (Contexto) presente e preenchida
     ✅ Seção 3 (Goals) presente e preenchida
     ✅ Seção 4 (Non-Goals) presente e preenchida
     ✅ Seção 5 (Usuários) presente e preenchida

============================================================
```

Iterações: 1 (100)
