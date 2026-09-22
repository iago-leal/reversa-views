import os, pty, time, select, re, sys, fcntl, termios, struct
def ler(fd, t):
    out=b''; fim=time.time()+t
    while time.time()<fim:
        r,_,_=select.select([fd],[],[],0.05)
        if r:
            try: out+=os.read(fd,65536)
            except OSError: break
    return out
def sel(s):
    q=s.split(b'\x1b[?2026h')[-1].decode('utf8','replace')
    for l in q.split('\n'):
        x=re.sub(r'\x1b\[[0-9;?]*[A-Za-z]','',l).strip()
        if '❯' in x: return x[:50]
    return '(sem seleção; %d bytes)'%len(s)
tecla=eval(sys.argv[1])
pid, fd = pty.fork()
if pid==0: os.execvp('node',['node','scripts/painel.js','--sem-conferir'])
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH',60,110,0,0))
print('início ', sel(ler(fd,3.0)))
for _ in range(2): os.write(fd,b'\t'); print('tab    ', sel(ler(fd,0.5)))
for i in range(5): os.write(fd,tecla); print('tecla',i+1, sel(ler(fd,0.5)))
os.write(fd,b'q'); ler(fd,0.5)
