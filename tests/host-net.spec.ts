/**
 * Suíte da porta de consulta à origem (T021), contra `src/host/net.ts`.
 *
 * NENHUM TESTE DAQUI ABRE CONEXÃO. A porta recebe o executor de requisição por
 * parâmetro, e o que estes casos exercitam é um duplo: pela mesma razão que
 * nenhum teste abre navegador, suíte que depende de rede falha por motivo alheio
 * ao código e ensina a ignorar vermelho.
 *
 * O que se verifica é o que o contrato de `interfaces/consulta-a-origem.md`
 * promete e o intérprete não pode garantir sozinho: que a requisição carrega os
 * dois cabeçalhos declarados e nada mais, que não há corpo, que o tempo limite
 * destrói a requisição em vez de deixá-la pendurada, que o teto de corpo
 * abandona a leitura, e que redirecionamento algum é seguido.
 * @module tests/host-net
 */

import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { MAX_BYTES, TIMEOUT_MS, originPort } from '../src/host/net.ts'
import type { OriginReply } from '../src/host/ports.ts'

/** O repositório e o commit que o carimbo desta construção traria. */
const REPO = 'iago-leal/reversa-views'
const COMMIT = 'a23711d481021a978720c0bc478b6dabed94fec3'

/** A requisição de mentira, com o que a porta chama nela. */
class RequisicaoFalsa extends EventEmitter {
  destruida = false
  encerrada = false
  corpoEnviado: unknown = null
  private aoEstourar: (() => void) | null = null
  private prazo = 0

  setTimeout(ms: number, ouvinte: () => void): this {
    this.prazo = ms
    this.aoEstourar = ouvinte
    return this
  }

  end(corpo?: unknown): this {
    this.encerrada = true
    this.corpoEnviado = corpo ?? null
    return this
  }

  destroy(): this {
    this.destruida = true
    return this
  }

  /** Faz o tempo limite estourar, como o módulo nativo faria. */
  estourar(): void {
    this.aoEstourar?.()
  }

  prazoDeclarado(): number {
    return this.prazo
  }
}

/** Uma resposta de mentira, com código e pedaços de corpo. */
class RespostaFalsa extends EventEmitter {
  retomada = false
  constructor(public statusCode: number) {
    super()
  }

  resume(): this {
    this.retomada = true
    return this
  }
}

/** A bancada: a porta, o duplo de requisição e o que ele registrou. */
function bancada(
  responder?: (requisicao: RequisicaoFalsa, responderCom: (resposta: RespostaFalsa) => void) => void,
  opcoes: { timeoutMs?: number; maxBytes?: number } = {},
) {
  const chamadas: Array<Record<string, unknown>> = []
  let ultima: RequisicaoFalsa | null = null

  const perform = vi.fn((options: Record<string, unknown>, aoResponder: (r: RespostaFalsa) => void) => {
    chamadas.push(options)
    const requisicao = new RequisicaoFalsa()
    ultima = requisicao
    // O executor real chama de volta em outra volta do laço de eventos, e o
    // duplo faz o mesmo: chamar em linha esconderia ordem que importa.
    if (responder !== undefined) {
      queueMicrotask(() => responder(requisicao, (resposta) => aoResponder(resposta)))
    }
    return requisicao
  })

  const porta = originPort(REPO, {
    version: '0.6.1',
    perform: perform as never,
    ...opcoes,
  })

  return { porta, chamadas, perform, requisicao: () => ultima }
}

/** Uma resposta completa, com o corpo entregue em um pedaço só. */
function responderCom(codigo: number, corpo: string) {
  return (_requisicao: RequisicaoFalsa, responder: (r: RespostaFalsa) => void): void => {
    const resposta = new RespostaFalsa(codigo)
    responder(resposta)
    queueMicrotask(() => {
      if (corpo !== '') resposta.emit('data', Buffer.from(corpo, 'utf8'))
      resposta.emit('end')
    })
  }
}

describe('a requisição que sai (RF-13, RN-09)', () => {
  it('vai ao endereço da comparação, com o repositório, a base e a cabeça', async () => {
    const b = bancada(responderCom(200, '{"status":"identical"}'))
    await b.porta.compare(COMMIT, 'master')

    expect(b.chamadas[0].host).toBe('api.github.com')
    expect(b.chamadas[0].protocol).toBe('https:')
    expect(b.chamadas[0].path).toBe(`/repos/${REPO}/compare/${COMMIT}...master`)
  })

  it('é leitura: o método é GET e nenhum corpo é enviado', async () => {
    const b = bancada(responderCom(200, '{"status":"identical"}'))
    await b.porta.compare(COMMIT, 'master')

    expect(b.chamadas[0].method).toBe('GET')
    expect(b.requisicao()?.encerrada).toBe(true)
    expect(b.requisicao()?.corpoEnviado).toBeNull()
  })

  it('carrega os dois cabeçalhos declarados, e nenhum outro', async () => {
    const b = bancada(responderCom(200, '{"status":"identical"}'))
    await b.porta.compare(COMMIT, 'master')

    const cabecalhos = b.chamadas[0].headers as Record<string, string>
    expect(Object.keys(cabecalhos).sort()).toEqual(['Accept', 'User-Agent'])
    expect(cabecalhos.Accept).toBe('application/vnd.github+json')
  })

  it('o cabeçalho de agente carrega a versão, e só ela', async () => {
    const b = bancada(responderCom(200, '{"status":"identical"}'))
    await b.porta.compare(COMMIT, 'master')

    const cabecalhos = b.chamadas[0].headers as Record<string, string>
    expect(cabecalhos['User-Agent']).toBe('reversa-views/0.6.1')
  })

  it('nada de credencial, de cookie nem de identificador de máquina viaja', async () => {
    const b = bancada(responderCom(200, '{"status":"identical"}'))
    await b.porta.compare(COMMIT, 'master')

    const tudo = JSON.stringify(b.chamadas[0]).toLowerCase()
    for (const proibido of ['authorization', 'cookie', 'token', 'bearer', 'workspace', 'hostname']) {
      expect(tudo, `a requisição carrega ${proibido}`).not.toContain(proibido)
    }
  })
})

describe('valor que não pode virar caminho é recusado antes do socket', () => {
  it('base que não é commit não abre conexão alguma', async () => {
    const b = bancada()
    const reply = await b.porta.compare('../../etc/passwd', 'master')

    expect(b.perform).not.toHaveBeenCalled()
    expect(reply).toEqual({ kind: 'failure', cause: 'resposta-inesperada' })
  })

  it('cabeça com caractere fora do vocabulário de referência tampouco', async () => {
    const b = bancada()
    const reply = await b.porta.compare(COMMIT, 'master?x=1')

    expect(b.perform).not.toHaveBeenCalled()
    expect(reply).toEqual({ kind: 'failure', cause: 'resposta-inesperada' })
  })

  it('repositório torto tampouco, ainda que venha do carimbo', async () => {
    const porta = originPort('não é um repositório', { version: '0.6.1', perform: vi.fn() as never })
    expect(await porta.compare(COMMIT, 'master')).toEqual({
      kind: 'failure',
      cause: 'resposta-inesperada',
    })
  })

  it('ramo com barra é aceito, porque ramo com barra é comum', async () => {
    const b = bancada(responderCom(200, '{"status":"identical"}'))
    await b.porta.compare(COMMIT, 'release/1.x')

    expect(b.chamadas[0].path).toBe(`/repos/${REPO}/compare/${COMMIT}...release/1.x`)
  })
})

describe('o que volta, entregue sem interpretação', () => {
  it('o corpo chega decodificado, ao lado do código', async () => {
    const b = bancada(responderCom(200, '{"status":"ahead","ahead_by":4}'))
    expect(await b.porta.compare(COMMIT, 'master')).toEqual({
      kind: 'response',
      status: 200,
      body: { status: 'ahead', ahead_by: 4 },
    })
  })

  it('o corpo chega inteiro ainda que venha em vários pedaços', async () => {
    const b = bancada((_req, responder) => {
      const resposta = new RespostaFalsa(200)
      responder(resposta)
      queueMicrotask(() => {
        resposta.emit('data', Buffer.from('{"status":"ah', 'utf8'))
        resposta.emit('data', Buffer.from('ead","ahead_by":9}', 'utf8'))
        resposta.emit('end')
      })
    })
    const reply = (await b.porta.compare(COMMIT, 'master')) as Extract<
      OriginReply,
      { kind: 'response' }
    >
    expect(reply.body).toEqual({ status: 'ahead', ahead_by: 9 })
  })

  it('corpo que não é JSON vira corpo nulo, e não exceção', async () => {
    const b = bancada(responderCom(200, '<html>desculpe</html>'))
    expect(await b.porta.compare(COMMIT, 'master')).toEqual({
      kind: 'response',
      status: 200,
      body: null,
    })
  })

  it('o código de erro atravessa, porque quem decide por ele é o intérprete', async () => {
    const b = bancada(responderCom(404, '{"message":"Not Found","status":"404"}'))
    const reply = (await b.porta.compare(COMMIT, 'master')) as Extract<
      OriginReply,
      { kind: 'response' }
    >
    expect(reply.status).toBe(404)
  })
})

describe('tempo limite, com destruição explícita (RF-11)', () => {
  it('declara cinco segundos, que é o que o requisito pede', async () => {
    const b = bancada(responderCom(200, '{}'))
    await b.porta.compare(COMMIT, 'master')
    expect(b.requisicao()?.prazoDeclarado()).toBe(TIMEOUT_MS)
    expect(TIMEOUT_MS).toBe(5000)
  })

  it('ao estourar, destrói a requisição e devolve a causa própria', async () => {
    const b = bancada((requisicao) => requisicao.estourar())
    const reply = await b.porta.compare(COMMIT, 'master')

    expect(reply).toEqual({ kind: 'failure', cause: 'tempo-esgotado' })
    expect(b.requisicao()?.destruida).toBe(true)
  })

  it('resposta que chega depois do estouro não desfaz o desfecho', async () => {
    let responder: ((r: RespostaFalsa) => void) | null = null
    const b = bancada((requisicao, aoResponder) => {
      responder = aoResponder
      requisicao.estourar()
    })
    const reply = await b.porta.compare(COMMIT, 'master')
    expect(reply).toEqual({ kind: 'failure', cause: 'tempo-esgotado' })

    // A promessa já foi resolvida; a resposta atrasada não pode reabri-la, e
    // o que se verifica é que entregá-la assim mesmo não derruba nada.
    const resposta = new RespostaFalsa(200)
    expect(() => (responder as unknown as (r: RespostaFalsa) => void)(resposta)).not.toThrow()
    expect(() => {
      resposta.emit('data', Buffer.from('{"status":"ahead","ahead_by":4}', 'utf8'))
      resposta.emit('end')
    }).not.toThrow()
    expect(await reply).toEqual({ kind: 'failure', cause: 'tempo-esgotado' })
  })
})

describe('falha de transporte (RF-10)', () => {
  it('erro na requisição vira ausência de rede', async () => {
    const b = bancada((requisicao) => requisicao.emit('error', new Error('ENOTFOUND')))
    expect(await b.porta.compare(COMMIT, 'master')).toEqual({ kind: 'failure', cause: 'sem-rede' })
  })

  it('erro no meio da resposta também', async () => {
    const b = bancada((_req, responder) => {
      const resposta = new RespostaFalsa(200)
      responder(resposta)
      queueMicrotask(() => resposta.emit('error', new Error('ECONNRESET')))
    })
    expect(await b.porta.compare(COMMIT, 'master')).toEqual({ kind: 'failure', cause: 'sem-rede' })
  })

  it('um segundo erro depois do primeiro não muda o desfecho nem lança', async () => {
    const b = bancada((requisicao) => {
      requisicao.emit('error', new Error('primeiro'))
      requisicao.emit('error', new Error('segundo'))
    })
    expect(await b.porta.compare(COMMIT, 'master')).toEqual({ kind: 'failure', cause: 'sem-rede' })
  })
})

describe('teto de corpo aceito', () => {
  it('declara um teto, com folga de uma ordem de grandeza sobre a resposta real', () => {
    // A comparação real de quatro commits pesa cerca de 450 KB.
    expect(MAX_BYTES).toBeGreaterThan(450 * 1024 * 8)
  })

  it('acima do teto, abandona a leitura e destrói a requisição', async () => {
    const b = bancada(
      (_req, responder) => {
        const resposta = new RespostaFalsa(200)
        responder(resposta)
        queueMicrotask(() => {
          resposta.emit('data', Buffer.alloc(64, 0x61))
          resposta.emit('data', Buffer.alloc(64, 0x61))
        })
      },
      { maxBytes: 100 },
    )
    const reply = await b.porta.compare(COMMIT, 'master')

    expect(reply).toEqual({ kind: 'failure', cause: 'resposta-inesperada' })
    expect(b.requisicao()?.destruida).toBe(true)
  })

  it('abaixo do teto, lê normalmente', async () => {
    const b = bancada(responderCom(200, '{"status":"identical"}'), { maxBytes: 100 })
    const reply = (await b.porta.compare(COMMIT, 'master')) as Extract<
      OriginReply,
      { kind: 'response' }
    >
    expect(reply.body).toEqual({ status: 'identical' })
  })
})

describe('redirecionamento não é seguido, a domínio algum', () => {
  it('um 301 devolve o próprio código, sem segunda requisição', async () => {
    const b = bancada((_req, responder) => {
      const resposta = new RespostaFalsa(301)
      responder(resposta)
    })
    const reply = await b.porta.compare(COMMIT, 'master')

    expect(reply).toEqual({ kind: 'response', status: 301, body: null })
    expect(b.perform).toHaveBeenCalledTimes(1)
  })

  it('cada código de redirecionamento é tratado do mesmo modo', async () => {
    for (const codigo of [301, 302, 307, 308]) {
      const b = bancada((_req, responder) => responder(new RespostaFalsa(codigo)))
      expect(await b.porta.compare(COMMIT, 'master')).toEqual({
        kind: 'response',
        status: codigo,
        body: null,
      })
      expect(b.perform).toHaveBeenCalledTimes(1)
    }
  })

  it('o corpo do redirecionamento é drenado, para não segurar o socket', async () => {
    let vista: RespostaFalsa | null = null
    const b = bancada((_req, responder) => {
      vista = new RespostaFalsa(302)
      responder(vista)
    })
    await b.porta.compare(COMMIT, 'master')
    expect((vista as unknown as RespostaFalsa).retomada).toBe(true)
  })
})

describe('a porta não faz nada além de perguntar', () => {
  it('expõe um método só', () => {
    const porta = originPort(REPO, { version: '0.6.1', perform: vi.fn() as never })
    expect(Object.keys(porta)).toEqual(['compare'])
  })

  it('não repete sozinha: uma chamada, uma requisição (RN-09)', async () => {
    const b = bancada((requisicao) => requisicao.emit('error', new Error('caiu')))
    await b.porta.compare(COMMIT, 'master')
    expect(b.perform).toHaveBeenCalledTimes(1)
  })

  it('duas perguntas são duas requisições, e o gesto de repetir é de quem chama', async () => {
    const b = bancada(responderCom(200, '{"status":"identical"}'))
    await b.porta.compare(COMMIT, 'master')
    await b.porta.compare(COMMIT, 'master')
    expect(b.perform).toHaveBeenCalledTimes(2)
  })
})
