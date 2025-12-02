<script>
    const { file, onNavigate, currentPath } = $props();
    const downloadUrl = $derived(() => {
        if (file.type === 'file') {
            return `/api/files?path=${encodeURIComponent(currentPath)}&download=${encodeURIComponent(file.name)}`;
        }
        return '#';
    });
</script>

<!-- (HTML) -->

{#if file.type === 'directory'}
    <div class="file-entry" on:click={() => onNavigate(file)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
  <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
</svg>
        <span class="icon">📁</span>
        <span class="name">{file.name}</span>
    </div>
{:else}
    <!-- Используем реактивную переменную downloadUrl -->
    <a class="file-entry file-link" href={downloadUrl} download={file.name}>
        <span class="icon">📄</span>
        <span class="name">{file.name}</span>
    </a>
{/if}

<!-- (/HTML) -->

<style lang="stylus">
  .file-entry {
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background-color 0.2s;
    color: inherit; 
    text-decoration: none;
  }
  
  .file-entry:hover {
    background-color: var(--clr-hover);
  }
  
  .icon {
    margin-right: 1rem;
  }
  
  .name {
    font-family: monospace;
  }
</style>
