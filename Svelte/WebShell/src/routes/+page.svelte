<script>
  import InteractiveTerminal from "$lib/components/InteractiveTerminal.svelte";
  import { onMount, onDestroy } from "svelte";

  let isTerminalOpen = $state(false);
  let cmd = $state("");
  let rawOutput = $state("");
  let ws = $state(null);
  let termDiv = $state(null);

  const ansiRegex = /\x1b\[[0-9;]*m|\x1b\[[K]|\[\?2004[h|l]|\]0;.*?\x07|\r/g;

  let cleanOutput = $derived(rawOutput.replace(ansiRegex, ""));

  function scrollToBottom() {
    setTimeout(() => {
      if (termDiv) termDiv.scrollTop = termDiv.scrollHeight;
    }, 0);
  }

  onMount(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.hostname}:8081/pty`;
    ws = new WebSocket(url);
    ws.onopen = () => {
      rawOutput += "Connection established.\n";
      scrollToBottom();
    };
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "output") {
        rawOutput += message.data;
        scrollToBottom();
      }
    };
    ws.onclose = () => {
      rawOutput += "\nClosed.\n";
    };
  });
  onDestroy(() => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
  });

  function sendCommand() {
    if (!cmd || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "input", data: cmd + "\n" }));
    cmd = "";
  }
  function onKey(e) {
    if (e.key === "Enter") sendCommand();
  }

  function openInteractiveTerminal() {
    isTerminalOpen = true;
  }

  function closeInteractiveTerminal() {
    isTerminalOpen = false;
  }
</script>

<div class="page-container">
  <div class="term" bind:this={termDiv}>
    <pre>{cleanOutput}</pre>
  </div>

  <div class="input-area">
    <input
      bind:value={cmd}
      on:keydown={onKey}
      placeholder="Введите команду (ls, echo)..."
      autofocus
    />
    <button on:click={sendCommand}>send</button>
  </div>

  <button class="open-xterm-btn" on:click={openInteractiveTerminal}>
    Открыть интерактивный xterm (для nano, htop)
  </button>
</div>

<InteractiveTerminal
  isOpen={isTerminalOpen}
  onClose={closeInteractiveTerminal}
/>

<style lang="stylus">

  .page-container {
    display: grid;
    grid-template-rows: 1fr max-content;
    gap: .5rem;
    width: 100%;
    height: 100%;
    max-height: 100vh;
    max-width: 100vw;
    max-height: calc(100vh - 10rem)
    max-height: calc(100dvh - 10rem)
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
  .term {
    width: 100%;
    background: #1d1e26;
    color: #e0e0e0;
    padding: 1rem 0;
    height: 100%;
    max-height: 100%;
    overflow: auto;
    font-family: monospace;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .input-area {
    position: fixed;
    display: grid;
    grid-template-columns: 1fr max-content;
    bottom: 1rem;
    left: 2rem;
    right: 2rem;
    border-radius: 3rem;
    background-color: #1d1e26;
    border: 1px solid #e7e7f011;
    color: #ffffff99;
    overflow: hidden;
    transition: all 1s easy;
    
    &:focus-within {
      bottom: 0;
      left: 0;
      right: 0;
      border-radius: 3rem 3rem 0 0;
    }
  }

  input {
    flex-grow: 1;
    padding: 1.5rem 1.5rem 1.5rem 2rem;
    font-family: monospace;
    background: none;
    color: inherit;
    border: none;
    transition: all 1s easy;
  }

  input:focus {
    outline: none;
    padding: 2.5rem 1.5rem 2.5rem 4rem;
}


  button {
    padding: 0.75rem 1.5rem;
    background-color: #007acc;
    color: #ffffff99;
    border: none;
    height: 100%;
    cursor: pointer;
  }
  .open-xterm-btn {
    background-color: #4caf50;
    margin-top: 1rem;
  }
</style>
