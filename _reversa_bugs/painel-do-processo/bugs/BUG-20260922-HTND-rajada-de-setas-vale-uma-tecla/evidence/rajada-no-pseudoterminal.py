import os, pty, time, select, re, sys, fcntl, termios, struct
exec(open(os.path.join(os.path.dirname(__file__),'trajeto-no-pseudoterminal.py')).read().split('tecla=eval')[0])
def rodar(bytes_, rotulo):
    pid, fd = pty.fork()
    if pid==0: os.execvp('node',['node','scripts/painel.js','--sem-conferir'])
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH',60,110,0,0))
    ler(fd,3.0)
    for _ in range(2): os.write(fd,b'\t'); ler(fd,0.5)
    os.write(fd,bytes_); s=ler(fd,1.0)
    print(f"{rotulo:34} -> {s.count(b'\x1b[?2026h')} quadro(s); seleção: {sel(s)}")
    os.write(fd,b'q'); ler(fd,0.5)
for tentativa in (1,2):
    print(f"tentativa {tentativa}")
    rodar(b'\x1b[B'*5, '5 setas abaixo numa escrita')
    rodar(b'\x1b[B'*40, '40 setas abaixo numa escrita')
    rodar(b'\x1b[B\x1b[B\x1b[B\x1b[A', '3 abaixo e 1 acima numa escrita')
    rodar(b'jjjjj', 'jjjjj numa escrita')
