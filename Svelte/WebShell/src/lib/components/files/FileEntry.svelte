<!-- FileEntry.svelte (Исправленная версия) -->
<script>
    const { file, onNavigate, currentPath } = $props();

    // Используем $derived, чтобы URL динамически обновлялся 
    // при любом изменении currentPath или file.type/file.name
    const downloadUrl = $derived(() => {
        if (file.type === 'file') {
            return `/api/files?path=${encodeURIComponent(currentPath)}&download=${encodeURIComponent(file.name)}`;
        }
        return '#';
    });
</script>

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

<style>
  .file-entry {
    padding: 0.25rem;
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
