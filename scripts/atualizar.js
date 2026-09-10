#!/usr/bin/env node
/**
 * O ritual de atualização, em dois atos separados (RF-01 a RF-08, RN-03, RN-04, D-12).
 *
 * O primeiro ato CONFERE: busca as referências da origem sem tocar a árvore de
 * trabalho e diz, em três desfechos nomeados, se o clone está em dia, atrás de
 * N commits, ou se não deu para saber. O segundo ato APLICA, e só existe atrás
 * de `--aplicar`: deixa a INSTALAÇÃO em dia com este clone, incorporando antes
 * quando há o que incorporar. Constrói, roda a suíte, empacota, imprime o
 * comando de instalação com o nome do pacote gerado e tenta a instalação quando
 * o executável do editor está no caminho, parando na primeira falha.
 *
 * Que o percurso rode mesmo sem commits a trazer é a correção do
 * BUG-20260910-SVZU, e a razão é que o ritual mede um eixo e o painel mede
 * outro. A conferência compara CLONE e origem; o cabeçalho do painel compara
 * CONSTRUÇÃO INSTALADA e origem. Os dois divergem sempre que se constrói ou se
 * incorpora sem instalar, e enquanto a aplicação era consequência da
 * incorporação o clone em dia com instalação atrasada não tinha comando algum
 * que o alcançasse: o painel pedia atualização a cada recarga e nada a
 * satisfazia.
 *
 * Três códigos de saída, no esquema que `verificar-heranca.js` já usa: zero
 * quando nada há a fazer, um quando há algo a aplicar ou a aplicação foi
 * recusada ou reprovou, dois quando não foi possível conferir. A distinção entre
 * um e dois é o que permite a um script de fora saber se deve tentar de novo
 * (dois) ou chamar alguém (um).
 *
 * A aplicação recusa antes de tocar em qualquer coisa (RF-05), e as duas
 * recusas têm alcances distintos porque guardam coisas distintas: a árvore suja
 * recusa sempre, para que nenhum pacote saia declarando procedência que o
 * conteúdo não tem, e o commit local à frente recusa só no ramo que incorpora,
 * porque a incorporação sobre trabalho não registrado é exatamente a decisão que
 * script nenhum toma (RN-04). Nada aqui escreve fora do clone: a árvore
 * versionada, a pasta de saída e o pacote são os únicos destinos (RN-03).
 *
 * Todo acesso ao mundo entra por `FERRAMENTAS`, para que a suíte exercite os
 * desfechos sem rede, sem clone e sem editor.
 *
 * Uso:
 *     npm run atualizar               # confere, e nada mais
 *     npm run atualizar -- --aplicar  # confere, incorpora se houver, e reinstala
 * @module scripts/atualizar
 */

const { execFileSync } = require('node:child_process')
const { existsSync } = require('node:fs')
const path = require('node:path')

const { ErroDeGit, executar, tentar } = require('./git')

/**
 * Se um erro é o que a porta do git lança.
 *
 * Pelo nome, e não só por `instanceof`: a suíte carrega este módulo pelo
 * caminho de módulos ES e a porta pelo de CommonJS, e as duas cópias da classe
 * não se reconhecem. O nome é parte do contrato da porta, e é o que se lê aqui.
 * @param {unknown} erro - o que foi lançado.
 * @returns {boolean} verdadeiro para um `ErroDeGit` de qualquer origem.
 */
function eErroDeGit(erro) {
  return erro instanceof ErroDeGit || (erro instanceof Error && erro.name === 'ErroDeGit')
}
const { derivarVersao } = require('./versao')

/** Os três códigos de saída, no vocabulário de `verificar-heranca.js` (D-12). */
const SAIDA_EM_DIA = 0
const SAIDA_REPROVADO = 1
const SAIDA_IMPOSSIVEL = 2

/** O remoto que se confere; o projeto não conhece outro. */
const REMOTO = 'origin'

/** O ramo comparado quando o clone não está em ramo algum (cabeça solta). */
const RAMO_DE_RECUO = 'master'

/**
 * Quanto a busca de referências pode demorar (RF-03).
 *
 * Dez segundos é o critério de aceite: sem rede, o git fica esperando uma
 * resposta que não vem, e um comando de conferência que trava é pior que um que
 * diz "não deu".
 */
const LIMITE_DA_BUSCA_MS = 10000

/**
 * Quantos caracteres do commit se imprimem (RF-08, D-18).
 *
 * Sete, os mesmos de `revisionLabel` em `src/webview/domain/labels.ts`: as duas
 * cadeias existem para serem comparadas a olho, e comparar truncamentos de
 * comprimentos diferentes é trabalho manual sem razão de ser.
 */
const COMPRIMENTO_CURTO = 7

/** Os passos da aplicação, na ordem de RF-06, cada um com o comando que o cumpre. */
const PASSOS = [
  { nome: 'construção', comando: 'npm', argumentos: ['run', 'build'] },
  { nome: 'suíte', comando: 'npm', argumentos: ['test'] },
  { nome: 'empacotamento', comando: 'npm', argumentos: ['run', 'empacotar'] },
]

/**
 * A forma curta de um commit, a mesma que o painel exibe.
 * @param {string|null} commit - o commit inteiro, ou nulo.
 * @returns {string} os sete primeiros caracteres, ou o valor inteiro se for menor.
 */
function encurtar(commit) {
  if (typeof commit !== 'string' || commit === '') return ''
  return commit.length <= COMPRIMENTO_CURTO ? commit : commit.slice(0, COMPRIMENTO_CURTO)
}

/** O acesso ao mundo, trocável na suíte. */
const FERRAMENTAS = {
  /** Se a raiz é um clone. */
  eClone: (raiz) => tentar(['rev-parse', '--is-inside-work-tree'], { caminho: raiz }) === 'true',
  /** O endereço do remoto, ou nulo quando ele não está configurado. */
  remoto: (raiz) => tentar(['remote', 'get-url', REMOTO], { caminho: raiz }),
  /** O ramo corrente, ou nulo com a cabeça solta. */
  ramo: (raiz) => {
    const nome = tentar(['rev-parse', '--abbrev-ref', 'HEAD'], { caminho: raiz })
    return nome === null || nome === 'HEAD' ? null : nome
  },
  /** A revisão corrente, inteira. */
  revisao: (raiz) => tentar(['rev-parse', 'HEAD'], { caminho: raiz }),
  /** Busca as referências do remoto; lança `ErroDeGit` quando não consegue. */
  buscar: (raiz) =>
    executar(['fetch', '--quiet', REMOTO], { caminho: raiz, tempoLimite: LIMITE_DA_BUSCA_MS }),
  /** Quantos commits há em `de..ate`, ou nulo se algum dos dois não existir. */
  contar: (raiz, de, ate) => {
    const saida = tentar(['rev-list', '--count', `${de}..${ate}`], { caminho: raiz })
    if (saida === null) return null
    const numero = Number(saida)
    return Number.isInteger(numero) && numero >= 0 ? numero : null
  },
  /** As linhas de `git status --porcelain`, vazias numa árvore limpa. */
  sujeira: (raiz) => {
    const saida = tentar(['status', '--porcelain'], { caminho: raiz })
    return saida === null || saida === '' ? [] : saida.split('\n')
  },
  /** Incorpora por avanço rápido, e só por ele; lança se não der. */
  incorporar: (raiz, referencia) =>
    executar(['merge', '--ff-only', '--quiet', referencia], { caminho: raiz }),
  /** Os arquivos que mudaram entre dois commits, entre os pedidos. */
  mudados: (raiz, de, ate, arquivos) => {
    const saida = tentar(['diff', '--name-only', `${de}..${ate}`, '--', ...arquivos], {
      caminho: raiz,
    })
    return saida === null || saida === '' ? [] : saida.split('\n')
  },
  /** Roda um comando do projeto com a saída no terminal; lança se reprovar. */
  rodar: (raiz, comando, argumentos) => {
    execFileSync(comando, argumentos, { cwd: raiz, stdio: 'inherit' })
  },
  /** Se o executável do editor está no caminho. */
  temEditor: () => {
    try {
      execFileSync('code', ['--version'], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  },
  /** Instala o pacote pelo executável do editor; lança se reprovar. */
  instalar: (raiz, pacote) => {
    execFileSync('code', ['--install-extension', pacote], { cwd: raiz, stdio: 'inherit' })
  },
  /** O nome do pacote que o empacotamento acabou de gerar (RF-20). */
  nomeDoPacote: (raiz) => {
    const manifesto = JSON.parse(require('node:fs').readFileSync(path.join(raiz, 'package.json'), 'utf8'))
    return `${manifesto.name}-${derivarVersao(raiz).versao}.vsix`
  },
  /** Se um arquivo existe na raiz. */
  existe: (raiz, nome) => existsSync(path.join(raiz, nome)),
  escrever: (texto) => process.stdout.write(texto),
  escreverErro: (texto) => process.stderr.write(texto),
}

/**
 * O primeiro ato: conferir sem tocar na árvore (RF-01, RF-02, RF-03).
 *
 * O desfecho é um valor, e não um efeito: quem chama decide o que imprimir e
 * com que código sair. A ordem das verificações vai do mais barato ao mais
 * caro, e a busca de referências, a única que fala com a rede, é a última.
 * @param {string} raiz - a raiz do clone.
 * @param {typeof FERRAMENTAS} [ferramentas] - o acesso ao mundo.
 * @returns {{desfecho: 'em-dia'|'atrasada'|'impossivel', commit: string|null,
 *   ramo: string, atras: number, aFrente: number, causa: string|null,
 *   explicacao: string|null}} o que se apurou.
 */
function conferir(raiz, ferramentas = FERRAMENTAS) {
  const base = { commit: null, ramo: RAMO_DE_RECUO, atras: 0, aFrente: 0, causa: null, explicacao: null }

  if (!ferramentas.eClone(raiz)) {
    return {
      ...base,
      desfecho: 'impossivel',
      causa: 'sem-clone',
      explicacao: `${raiz} não é um clone git, ou o git não está instalado: não há origem com que comparar`,
    }
  }

  const commit = ferramentas.revisao(raiz)
  const ramo = ferramentas.ramo(raiz) ?? RAMO_DE_RECUO

  if (ferramentas.remoto(raiz) === null) {
    return {
      ...base,
      commit,
      ramo,
      desfecho: 'impossivel',
      causa: 'sem-remoto',
      explicacao: `o clone não tem o remoto ${REMOTO} configurado: \`git remote add ${REMOTO} <endereço>\` o cria`,
    }
  }

  try {
    ferramentas.buscar(raiz)
  } catch (erro) {
    if (!eErroDeGit(erro)) throw erro
    if (erro.causa === 'ausente') {
      return {
        ...base,
        commit,
        ramo,
        desfecho: 'impossivel',
        causa: 'git-ausente',
        explicacao: 'o git não está instalado ou não está no caminho',
      }
    }
    return {
      ...base,
      commit,
      ramo,
      desfecho: 'impossivel',
      causa: 'sem-rede',
      explicacao:
        erro.causa === 'tempo-esgotado'
          ? `a origem não respondeu em ${LIMITE_DA_BUSCA_MS} ms: sem rede, ou a origem está fora do ar`
          : `a busca de referências reprovou: ${erro.saidaDeErro || erro.message}`,
    }
  }

  const referencia = `${REMOTO}/${ramo}`
  const atras = ferramentas.contar(raiz, 'HEAD', referencia)
  const aFrente = ferramentas.contar(raiz, referencia, 'HEAD')
  if (atras === null || aFrente === null) {
    return {
      ...base,
      commit,
      ramo,
      desfecho: 'impossivel',
      causa: 'sem-ramo-na-origem',
      explicacao: `a origem não tem o ramo ${ramo}: não há com que comparar a cabeça deste clone`,
    }
  }

  return {
    ...base,
    commit,
    ramo,
    atras,
    aFrente,
    desfecho: atras === 0 ? 'em-dia' : 'atrasada',
  }
}

/**
 * O relato da conferência, em texto para o terminal (RF-02, RF-08).
 * @param {ReturnType<typeof conferir>} resultado - o que se apurou.
 * @returns {string} as linhas a imprimir.
 */
function relatar(resultado) {
  const linhas = []
  if (resultado.commit !== null) {
    linhas.push(`Clone em ${encurtar(resultado.commit)}, ramo ${resultado.ramo}.`)
  }
  switch (resultado.desfecho) {
    case 'em-dia':
      linhas.push('Em dia com a origem: não há commit a trazer.')
      if (resultado.aFrente > 0) {
        linhas.push(`Este clone tem ${resultado.aFrente} commit(s) que a origem não tem.`)
      }
      break
    case 'atrasada':
      linhas.push(`Atrás da origem em ${resultado.atras} commit(s).`)
      if (resultado.aFrente > 0) {
        linhas.push(
          `Este clone também tem ${resultado.aFrente} commit(s) próprio(s): a aplicação vai recusar até que sejam enviados ou desfeitos.`,
        )
      } else {
        linhas.push('Para aplicar: npm run atualizar -- --aplicar')
      }
      break
    default:
      linhas.push(`Impossível conferir (${resultado.causa}): ${resultado.explicacao}.`)
  }
  return `${linhas.join('\n')}\n`
}

/**
 * O código de saída de uma conferência (D-12).
 * @param {ReturnType<typeof conferir>} resultado - o que se apurou.
 * @returns {number} zero, um ou dois.
 */
function codigoDaConferencia(resultado) {
  if (resultado.desfecho === 'em-dia') return SAIDA_EM_DIA
  if (resultado.desfecho === 'atrasada') return SAIDA_REPROVADO
  return SAIDA_IMPOSSIVEL
}

/**
 * O segundo ato: aplicar, depois de conferir de novo (RF-04 a RF-07).
 *
 * As duas recusas vêm ANTES de qualquer escrita, e nomeiam o que encontraram.
 * Elas guardam coisas diferentes, e por isso valem em alcances diferentes. A
 * árvore suja recusa SEMPRE, inclusive com o clone em dia, porque o carimbo da
 * construção declara o commit da cabeça e um pacote feito sobre alteração não
 * registrada anunciaria no painel uma procedência que o conteúdo não tem. O
 * commit local à frente recusa apenas quando há incorporação a fazer, porque o
 * que ele proíbe é incorporar por cima de trabalho que a origem não conhece, e
 * não construir o próprio trabalho.
 *
 * Não conseguir conferir, essa sim, interrompe tudo: construir às cegas, sem
 * saber o estado da origem, é o oposto do que o ritual existe para fazer.
 *
 * Depois das guardas o percurso é o de RF-06 e para na primeira falha, com o
 * pacote anterior intacto porque o empacotamento é o último passo.
 * @param {string} raiz - a raiz do clone.
 * @param {typeof FERRAMENTAS} [ferramentas] - o acesso ao mundo.
 * @returns {number} o código de saída.
 */
function aplicar(raiz, ferramentas = FERRAMENTAS) {
  const resultado = conferir(raiz, ferramentas)
  ferramentas.escrever(relatar(resultado))
  if (resultado.desfecho === 'impossivel') return codigoDaConferencia(resultado)

  const sujeira = ferramentas.sujeira(raiz)
  if (sujeira.length > 0) {
    ferramentas.escreverErro(
      `Aplicação recusada: a árvore de trabalho tem ${sujeira.length} alteração(ões) não registrada(s).\n` +
        sujeira.map((linha) => `  ${linha}\n`).join('') +
        'Registre, guarde (git stash) ou desfaça antes de aplicar: o carimbo da construção declara o\n' +
        'commit da cabeça, e um pacote feito daqui anunciaria no painel uma procedência que não tem.\n',
    )
    return SAIDA_REPROVADO
  }

  const passos = [...PASSOS]

  if (resultado.desfecho === 'atrasada') {
    if (resultado.aFrente > 0) {
      ferramentas.escreverErro(
        `Aplicação recusada: este clone tem ${resultado.aFrente} commit(s) que a origem não tem.\n` +
          'Incorporar por cima deles é decisão sua, não deste script: envie-os (git push) ou desfaça-os antes.\n',
      )
      return SAIDA_REPROVADO
    }

    const antes = resultado.commit
    const referencia = `${REMOTO}/${resultado.ramo}`
    try {
      ferramentas.incorporar(raiz, referencia)
    } catch (erro) {
      if (!eErroDeGit(erro)) throw erro
      ferramentas.escreverErro(`A incorporação reprovou: ${erro.saidaDeErro || erro.message}\n`)
      return SAIDA_REPROVADO
    }
    const depois = ferramentas.revisao(raiz)
    ferramentas.escrever(`Incorporados ${resultado.atras} commit(s): ${encurtar(antes)} → ${encurtar(depois)}.\n`)

    // A instalação só quando o arquivo de trava mudou (RF-06): reinstalar a cada
    // atualização custa minutos por nada, e não reinstalar quando ele mudou
    // quebra a construção com um erro que não nomeia a causa. A pergunta só faz
    // sentido no ramo que incorpora: sem antes e depois não há trava que mudar.
    if (ferramentas.mudados(raiz, antes, depois, ['package-lock.json']).length > 0) {
      passos.unshift({ nome: 'instalação das dependências', comando: 'npm', argumentos: ['ci'] })
    }
  } else {
    ferramentas.escrever(
      'Nada a trazer da origem, e ainda assim há o que fazer: quem pode estar atrás deste clone é a\n' +
        'construção instalada, que é o que o painel compara. Refazendo a construção deste clone.\n',
    )
  }

  for (const passo of passos) {
    ferramentas.escrever(`\n== ${passo.nome}: ${passo.comando} ${passo.argumentos.join(' ')}\n`)
    try {
      ferramentas.rodar(raiz, passo.comando, passo.argumentos)
    } catch (erro) {
      ferramentas.escreverErro(
        `O passo "${passo.nome}" reprovou, e o percurso parou aqui: ${erro.message}\n` +
          'Os commits já foram incorporados; corrija e rode os passos restantes à mão.\n',
      )
      return SAIDA_REPROVADO
    }
  }

  return instalar(raiz, ferramentas)
}

/**
 * O fecho da aplicação: o comando de instalação, e a tentativa quando dá (RF-07).
 * @param {string} raiz - a raiz do clone.
 * @param {typeof FERRAMENTAS} ferramentas - o acesso ao mundo.
 * @returns {number} zero, mesmo sem editor no caminho: a linha impressa é o resultado.
 */
function instalar(raiz, ferramentas) {
  const pacote = ferramentas.nomeDoPacote(raiz)
  if (!ferramentas.existe(raiz, pacote)) {
    ferramentas.escreverErro(`O empacotamento terminou, mas ${pacote} não está na raiz.\n`)
    return SAIDA_REPROVADO
  }

  const linha = `code --install-extension ${pacote}`
  ferramentas.escrever(`\nInstale com: ${linha}\n`)

  if (!ferramentas.temEditor()) {
    ferramentas.escrever('O executável do editor não está no caminho: copie a linha acima e rode no terminal do editor.\n')
    return SAIDA_EM_DIA
  }

  try {
    ferramentas.instalar(raiz, pacote)
    ferramentas.escrever('Instalado. Recarregue a janela do editor para a versão nova valer.\n')
  } catch (erro) {
    ferramentas.escreverErro(`A instalação automática reprovou (${erro.message}); a linha acima continua valendo.\n`)
  }
  return SAIDA_EM_DIA
}

/**
 * A linha de comando: sem argumento confere; `--aplicar` aplica.
 * @param {readonly string[]} argumentos - o que veio depois do nome do script.
 * @param {string} raiz - a raiz do clone.
 * @param {typeof FERRAMENTAS} [ferramentas] - o acesso ao mundo.
 * @returns {number} o código de saída.
 */
function principal(argumentos, raiz, ferramentas = FERRAMENTAS) {
  const desconhecidos = argumentos.filter((argumento) => argumento !== '--aplicar')
  if (desconhecidos.length > 0) {
    ferramentas.escreverErro(
      `argumento desconhecido: ${desconhecidos.join(' ')}\nO único aceito é --aplicar.\n`,
    )
    return SAIDA_REPROVADO
  }

  if (argumentos.includes('--aplicar')) return aplicar(raiz, ferramentas)

  const resultado = conferir(raiz, ferramentas)
  ferramentas.escrever(relatar(resultado))
  return codigoDaConferencia(resultado)
}

if (require.main === module) {
  process.exit(principal(process.argv.slice(2), path.resolve(__dirname, '..')))
}

module.exports = {
  COMPRIMENTO_CURTO,
  FERRAMENTAS,
  LIMITE_DA_BUSCA_MS,
  PASSOS,
  RAMO_DE_RECUO,
  REMOTO,
  SAIDA_EM_DIA,
  SAIDA_IMPOSSIVEL,
  SAIDA_REPROVADO,
  aplicar,
  codigoDaConferencia,
  conferir,
  encurtar,
  principal,
  relatar,
}
