#!/usr/bin/env node
/**
 * Uma cópia estragada de um workspace, para alcançar os quatro estados do eixo
 * da descoberta que um projeto saudável não produz (T029, RF-01, RF-05, RF-07,
 * RF-11, RN-02).
 *
 * O painel da feature 011 julga duas coisas sobre o `.reversa/state.json`: até
 * onde a extração foi, e até onde cada agente foi com o seu checkpoint. Três
 * dos quatro estados que esse julgamento distingue não existem em disco por
 * aqui, e o quarto só existe em projeto alheio. Alcançá-los exigiria ou
 * adoecer o `state.json` de verdade deste repositório, que é o ponteiro do
 * próprio ciclo em curso, ou versionar um arquivo doente aqui dentro. Este
 * auxiliar faz o que `estragar-workspace.js` já fazia para o estado degradado:
 * copia o workspace para pasta temporária do sistema, reescreve o `state.json`
 * da cópia e imprime o caminho dela.
 *
 * Quem escreve é ele, e não o preview: o preview não escreve nada, em lugar
 * nenhum. E o que ele escreve fica fora do repositório e fora do workspace de
 * origem, que não é tocado.
 *
 * As formas plantadas aqui são as MEDIDAS em campo, e são as mesmas das
 * fixturas de `tests/fixtures/descoberta/`: a fase de encerramento e o
 * checkpoint sem `completed_at` não são invenção deste arquivo, e a suíte
 * `tests/preview-descoberta.spec.ts` confere que cada caso produz de fato o
 * estado que promete.
 *
 * Uso:
 *     node ./scripts/estragar-descoberta.js --caso=terminal-e-estranha
 *     node ./scripts/preview.js --workspace=$(node ./scripts/estragar-descoberta.js --caso=parcial)
 * @module scripts/estragar-descoberta
 */

const { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')

/** O que nunca vale a pena copiar: peso sem efeito sobre a leitura. */
const DISPENSADOS = new Set(['node_modules', '.git', 'out', 'coverage'])

/** O ponteiro que este auxiliar reescreve, e o único arquivo que ele toca. */
const ESTADO = '.reversa/state.json'

/** As cinco fases que o REVERSA documenta, na ordem em que ele as roda. */
const CANONICAS = ['reconhecimento', 'escavacao', 'interpretacao', 'geracao', 'revisao']

/** Os campos de identidade que a cópia herda do original, quando existem. */
const IDENTIDADE = ['version', 'project', 'user_name', 'output_folder']

/** Os quatro estados que este auxiliar sabe produzir. */
const CASOS = ['fase-estranha', 'parcial', 'terminal-e-estranha', 'saidas-nao-canonicas', 'falha']

/**
 * O que cada caso escreve por cima da identidade preservada.
 *
 * Um checkpoint concluído acompanha quase todos, porque o contraste é parte do
 * que se vai olhar: o estado excepcional só se reconhece ao lado do normal.
 */
const FORMAS = {
  falha: {
    estado: {
      phase: 'escavacao',
      completed: ['reconhecimento'],
      pending: ['escavacao', 'interpretacao', 'geracao', 'revisao'],
      checkpoints: {
        scout: { completed_at: '2026-09-01T10:00:00Z', files: ['_reversa_sdd/inventory.md'] },
        archaeologist: { date: '2026-09-02', status: 'failed', artifacts: [] },
      },
    },
    relato:
      'checkpoint que terminou MAL, declarado fora do esquema: sem o par aprovado sai em conclusão não declarada, e com o par status/failed aprovado como falhou sai como falha, que é a quarta situação da feature 012',
  },
  'fase-estranha': {
    estado: {
      phase: 're-extracao-005',
      completed: ['reconhecimento', 'escavacao'],
      pending: ['interpretacao', 'geracao', 'revisao'],
      checkpoints: {
        scout: { completed_at: '2026-09-01T10:00:00Z', files: ['_reversa_sdd/inventory.md'] },
      },
    },
    relato:
      'fase que não é canônica nem de encerramento: as cinco fases desenhadas, nenhuma frase de encerramento, e a anomalia fase-desconhecida continuando na tela',
  },
  parcial: {
    estado: {
      phase: 'escavacao',
      completed: ['reconhecimento'],
      pending: ['escavacao', 'interpretacao', 'geracao', 'revisao'],
      checkpoints: {
        scout: { completed_at: '2026-09-01T10:00:00Z', files: ['_reversa_sdd/inventory.md'] },
        archaeologist: {
          modules_analyzed: ['auth', 'orders'],
          modules_pending: ['payments', 'users'],
        },
      },
    },
    relato:
      'checkpoint sem completed_at e com modules_pending, que é a assinatura documentada do trabalho em curso: a palavra em andamento, e nenhuma anomalia por isso',
  },
  'terminal-e-estranha': {
    estado: {
      phase: 'concluido',
      completed: ['reconhecimento', 'escavacao', 'documentacao'],
      pending: [],
      checkpoints: {
        scout: { completed_at: '2026-09-01T10:00:00Z', files: ['_reversa_sdd/inventory.md'] },
      },
    },
    relato:
      'fase terminal e, ao mesmo tempo, um nome estranho em completed: a frase de encerramento aparece e sobra exatamente uma anomalia de fase, a do nome estranho',
  },
  'saidas-nao-canonicas': {
    estado: {
      phase: 'revisao',
      completed: CANONICAS.slice(0, 4),
      pending: ['revisao'],
      checkpoints: {
        writer: {
          at: '2026-09-01T10:00:00Z',
          status: 'concluido',
          arquivos_canonicos: ['_reversa_sdd/sdd/folha.md', '_reversa_sdd/sdd/estoque.md'],
          achados: ['duas máquinas de estado'],
          cobertura_vba: 82,
          nota: 'texto solto',
        },
        reviewer: {
          completed_at: '2026-09-01T12:00:00Z',
          files: ['_reversa_sdd/review.md'],
          artefatos: ['_reversa_sdd/review.md'],
        },
        // Terceiro checkpoint com um campo que nenhum par aprovado alcança, e
        // que por isso continua em conclusão não declarada. Ele existe desde
        // que o mapa da 012 deixou de estar vazio neste repositório: sem ele, o
        // caso deixaria de mostrar a situação que ele foi feito para mostrar,
        // porque `status: "concluido"` passou a ser reconhecido.
        scout: {
          at: '2026-09-01T09:00:00Z',
          estado: 'pronto',
          lacunas: ['duas rotinas sem origem', 'um contrato sem consumidor'],
        },
      },
    },
    relato:
      'checkpoint sem files e com campos de lista de textos sob nomes não canônicos: o painel nomeia os campos sem chamá-los de saídas, e a lista de arquivos continua vazia. O `scout` traz um campo de estado que ninguém aprovou, e segue em conclusão não declarada ao lado do `writer` reconhecido'
  },
}

/**
 * Reescreve o `state.json` da cópia, preservando a identidade do original.
 *
 * O que muda é só o que o eixo lê: `phase`, `completed`, `pending` e
 * `checkpoints`. Tudo o mais que o arquivo carregava sai de cena, porque o
 * caso precisa ser exatamente o que promete e não a soma dele com o que o
 * projeto de origem já tinha.
 * @param {string} caso - um dos quatro nomes.
 * @param {string} destino - a raiz da cópia.
 * @returns {string} o que foi feito, para o relato no terminal.
 */
function adoecer(caso, destino) {
  const arquivo = path.join(destino, ESTADO)
  const original = JSON.parse(readFileSync(arquivo, 'utf8'))

  const novo = {}
  for (const campo of IDENTIDADE) {
    if (original[campo] !== undefined) novo[campo] = original[campo]
  }
  Object.assign(novo, FORMAS[caso].estado)

  mkdirSync(path.dirname(arquivo), { recursive: true })
  writeFileSync(arquivo, `${JSON.stringify(novo, null, 2)}\n`)
  return FORMAS[caso].relato
}

/**
 * Copia e adoece.
 * @param {string[]} argumentos - aceita `--workspace=<caminho>` e `--caso=<nome>`.
 * @param {string} raiz - o repositório de onde o comando roda.
 * @returns {number} o código de saída; o caminho da cópia sai na saída padrão.
 */
function principal(argumentos, raiz) {
  const pedidoDoCaso = argumentos.find((argumento) => argumento.startsWith('--caso='))
  const caso = pedidoDoCaso === undefined ? '' : pedidoDoCaso.slice('--caso='.length)
  if (!CASOS.includes(caso)) {
    process.stderr.write(
      `caso inválido: "${caso}".\nOs que existem: ${CASOS.join(', ')}.\n` +
        'Use --caso=<nome>, e --workspace=<caminho> para adoecer outro workspace.\n',
    )
    return 1
  }

  const pedido = argumentos.find((argumento) => argumento.startsWith('--workspace='))
  const origem = pedido === undefined ? raiz : pedido.slice('--workspace='.length)
  if (!existsSync(origem) || !statSync(origem).isDirectory()) {
    process.stderr.write(`o workspace ${origem} não existe como diretório.\n`)
    return 1
  }

  if (!existsSync(path.join(origem, ESTADO))) {
    process.stderr.write(
      `${origem} não tem ${ESTADO}: os quatro casos são sobre o ponteiro da extração, e sem ele o painel nem chega ao eixo.\n`,
    )
    return 1
  }

  const destino = mkdtempSync(path.join(tmpdir(), 'reversa-views-descoberta-'))
  cpSync(origem, destino, {
    recursive: true,
    filter: (caminho) => !DISPENSADOS.has(path.basename(caminho)),
  })

  const feito = adoecer(caso, destino)
  process.stderr.write(`cópia em ${destino}: ${feito}.\n`)
  process.stdout.write(`${destino}\n`)
  return 0
}

if (require.main === module) {
  process.exit(principal(process.argv.slice(2), path.resolve(__dirname, '..')))
}

module.exports = { CANONICAS, CASOS, ESTADO, FORMAS, principal }
