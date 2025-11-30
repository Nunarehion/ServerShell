import http from 'http';
import { WebSocketServer } from 'ws';
import pty from 'node-pty';
import os from 'os';

const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
  const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'bash';
  
  const env = process.env;
  if (os.platform() !== 'win32') {
    env.LANG = 'ru_RU.UTF-8';
    env.LC_ALL = 'ru_RU.UTF-8';
  }

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: env
  });

  ptyProcess.on('data', data => { 
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data })); 
    }
  });

  ws.on('message', msg => {
    try {
      const m = JSON.parse(msg);
      if (m.type === 'input') ptyProcess.write(m.data);
      else if (m.type === 'resize') ptyProcess.resize(m.cols, m.rows);
    } catch (e) {}
  });

  ws.on('close', () => { try { ptyProcess.kill(); } catch (e) {} });
});

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/pty') {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PTY_WS_PORT || 8081;
server.listen(PORT, () => console.log('pty-ws listening on', PORT));
