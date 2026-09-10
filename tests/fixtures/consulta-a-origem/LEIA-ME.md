# Respostas gravadas da consulta à origem

Uma fixture por linha da tabela de desfechos de
`_reversa_forward/007-atualizacao-e-progresso/interfaces/consulta-a-origem.md`. Cada arquivo é um
par de código de resposta e corpo, na forma em que `src/host/net.ts` os entrega ao intérprete de
`src/host/update.ts`.

**Nenhum teste abre conexão.** Pela mesma razão que nenhum teste abre navegador: suíte que depende de
rede falha por motivo alheio ao código e ensina a ignorar vermelho.

O campo `procedencia` de cada arquivo diz se o corpo veio de chamada real ou foi montado no molde de
uma. As quatro respostas do serviço trazem só as chaves de topo que importam: a resposta real traz
treze, incluindo dois vetores de commits e de arquivos que somam centenas de linhas, e guardá-los
inteiros faria a fixture pesar mais que o módulo que ela exercita. O que fica é o suficiente para
provar o que interessa, que o intérprete lê três campos e ignora o resto.
