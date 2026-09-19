# Legacy impact: infraestrutura remota, autenticação e assistente

## 1. Como ler a coluna Componente

| Componente | Spec de origem | Situação |
|---|---|---|
| `fundacao-persistencia` | `_reversa_sdd/sdd/fundacao-persistencia.md` | spec existente |
| `metas` | `_reversa_sdd/sdd/metas.md` | citada no mapeamento e não entregue |
| `acesso-e-identidade` | nenhuma | nasce aqui |
| `operacao-de-producao` | nenhuma | nasce aqui |
| `assistente` | nenhuma | nasce aqui |

## 2. Arquivos afetados

### 2.1 `fundacao-persistencia`

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `models/core/ambiente.ts` | fundacao-persistencia | componente-novo | CRITICAL | decide o ambiente |
| `infra/docker-compose.yml` | fundacao-persistencia | componente-novo | MEDIUM | banco local marcado |

### 2.2 `acesso-e-identidade`

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `models/core/acesso.ts` | acesso-e-identidade | componente-novo | CRITICAL | decide se a identidade entra |
| `proxy.ts` | `acesso-e-identidade` | componente-novo | CRITICAL | a borda |

### 2.3 `telas-e-navegacao`

| Componente | Arquivo afetado | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| telas-e-navegacao | `pages/_app.tsx` | componente-novo | HIGH | colunas em outra ordem |

### 2.4 `ajustes`

| O arquivo afetado | O componente (spec) | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `pages/ajustes.tsx` | **ajustes** | componente-novo | MEDIUM | artigo e anotação no cabeçalho |

### 2.5 `operacao-de-producao`

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `infra/provisioning/production/README.md` | operacao-de-producao | componente-novo | HIGH | roteiro de produção |

### 2.6 `assistente`

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `pages/api/assistente.ts` | assistente | componente-novo | HIGH | uma palavra só |
| `pages/api/assistente-stream.ts` | assistente | componente-novo | MEDIUM | a mesma célula, repetida |
