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
    border-left: 1px solid #ffffff55;
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
