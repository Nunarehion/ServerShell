<script>
  import "xterm/css/xterm.css";
  import { tick } from "svelte";

  let { isOpen, onClose } = $props();

  let terminalContainer = $state(null);
  let ws = $state(null);
  let term = $state(null);
  let fitAddon = $state(null);
  let resizeHandler = $state(null);

  async function initializeTerminal() {
    if (term || !terminalContainer) return;

    await tick();

    const { Terminal } = await import("xterm");
    const { FitAddon } = await import("xterm-addon-fit");

    term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#000000",
        foreground: "#e0e0e0",
        cursor: "#e0e0e0",
      },
    });
    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainer);
    fitAddon.fit();
    term.focus();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.hostname}:8081/pty`;
    ws = new WebSocket(url);
    ws.onopen = () => {
      term.write("Interactive Terminal Connected.\r\n");
      fitAddon.fit();
    };
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "output" && term) term.write(message.data);
    };
    ws.onclose = () => {
      if (term) term.write("\r\nConnection closed.\r\n");
    };
    ws.onerror = (error) => {
      if (term) term.write(`\r\nWebSocket error: ${error.message}\r\n`);
    };

    term.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ type: "input", data: data }));
    });

    resizeHandler = () => {
      if (fitAddon && ws && ws.readyState === WebSocket.OPEN) {
        fitAddon.fit();
        ws.send(
          JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows })
        );
      }
    };
    window.addEventListener("resize", resizeHandler);
  }

  function cleanupTerminal() {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    if (term) term.dispose();
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    ws = null;
    term = null;
    fitAddon = null;
    resizeHandler = null;
  }

  $effect(() => {
    if (isOpen) {
      initializeTerminal();
    } else {
      cleanupTerminal();
    }
  });
</script>

{#if isOpen}
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Interactive PTY Session</h3>
        <button on:click={onClose} class="close-btn">×</button>
      </div>
      <div class="terminal-container" bind:this={terminalContainer}></div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .modal-content {
    background: #252526;
    width: 90%;
    height: 80%;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: #333;
    color: white;
  }
  .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
  }
  .terminal-container {
    flex-grow: 1;
    padding: 10px;
  }
  :global(.terminal-container .xterm .xterm-viewport) {
    background-color: #000;
  }
</style>
