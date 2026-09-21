/**
 * O texto do `--ajuda` e a recusa nomeada (RF-25).
 *
 * Duas funções puras, e nenhuma delas escreve em canal algum: quem escolhe o
 * canal é o ponto de entrada, porque a recusa vai para o canal de erro e a
 * descrição do uso vai para o canal padrão, e misturar os dois contaminaria
 * quem redireciona um deles.
 *
 * O texto é a transcrição do contrato de linha de comando. Ele envelhece junto
 * com o contrato, de propósito: alterar uma bandeira é alterar comportamento
 * observável, e o lugar de anunciá-lo é o mesmo que o declara.
 * @module cli/uso
 */

/** O nome pelo qual a ferramenta é invocada, que é o do comando do projeto. */
const COMANDO = 'npm run painel'

/** O texto inteiro do `--ajuda`, em linhas. */
export function textoDeUso(): string[] {
  return [
    'O painel do processo do Reversa, no terminal.',
    '',
    'Uso:',
    `  ${COMANDO}`,
    `  ${COMANDO} -- --workspace=/caminho/do/projeto`,
    `  ${COMANDO} -- --passada`,
    `  ${COMANDO} -- --dados > processo.json`,
    '',
    'Argumentos:',
    '  --workspace=<caminho>  A raiz a observar. O padrão é o diretório corrente,',
    '                         e caminho inexistente é recusado.',
    '  --passada              Imprime uma vez e termina, mesmo com terminal disponível.',
    '  --vivo                 Força a interface viva, mesmo com a saída redirecionada.',
    '  --dados                Imprime a carga da leitura em JSON e termina. Implica --passada.',
    '  --sem-conferir         Não consulta a origem. Nenhuma conexão é aberta.',
    '  --sem-cor              Desenha sem cor, mesmo em terminal que a suporte.',
    '  --ajuda                Descreve este uso e termina.',
    '',
    'Variáveis de ambiente:',
    '  NO_COLOR                       Declarada, desliga a cor, como --sem-cor.',
    '  REVERSA_VIEWS_SEM_CONFERIR     Declarada, desliga a consulta, como --sem-conferir.',
    '  VISUAL, EDITOR                 Quem abre o artefato selecionado.',
    '',
    'Códigos de saída:',
    '  0  A leitura ocorreu, inclusive degradada e inclusive sem Reversa instalado.',
    '  1  A leitura falhou, e o estado de erro foi nomeado.',
    '  2  Uso incorreto: argumento não reconhecido, ou raiz inexistente.',
    '',
    'Sem bandeira de modo, a interface viva só nasce se a saída for um terminal:',
    'redirecionar a saída basta para o uso em script.',
    '',
    'A ferramenta não escreve arquivo algum, em modo algum, por argumento algum.',
  ]
}

/**
 * A recusa, já com a orientação de onde ler o uso inteiro.
 * @param mensagem - o que foi recusado, nomeado por quem recusou.
 * @returns as linhas para o canal de erro.
 */
export function textoDaRecusa(mensagem: string): string[] {
  return [mensagem, `Rode \`${COMANDO} -- --ajuda\` para ver o uso.`]
}
