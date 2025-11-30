<!-- src/lib/components/FileManager.svelte -->
<script>
  import { onMount } from "svelte";

  let currentPath = "/";
  let files = [];
  let errorMessage = "";
  let successMessage = ""; 

  function clearMessages() {
      setTimeout(() => {
          errorMessage = "";
          successMessage = "";
      }, 3000);
  }

  async function loadDirectory(targetPath = "/") {
    errorMessage = "";
    successMessage = "";
    const url = `/api/files?path=${encodeURIComponent(targetPath)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Не удалось загрузить директорию.");

      const data = await response.json();
      files = data.files;
      currentPath = data.currentPath;
    } catch (error) {
      errorMessage = error.message;
      clearMessages();
    }
  }

  function getDownloadUrl(file) {
      if (file.type === 'file') {
          return `/api/files?path=${encodeURIComponent(currentPath)}&download=${encodeURIComponent(file.name)}`;
      }
      return '#';
  }

  function handleEntryClick(file) {
    if (file.type === "directory") {
      loadDirectory(file.path);
    } 
  }

  function goBack() {
      const parentDir = files.find(f => f.name === '..');
      if (parentDir) {
          loadDirectory(parentDir.path);
      }
  }

  async function createNewFolder() {
    const folderName = prompt("Введите имя новой папки:");
    if (!folderName || folderName.trim() === "") return;

    try {
        const response = await fetch('/api/files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'mkdir',
                path: currentPath,
                name: folderName.trim()
            })
        });

        const result = await response.json();

        if (response.ok) {
            successMessage = result.message;
            loadDirectory(currentPath);
        } else {
            throw new Error(result.error || 'Не удалось создать папку.');
        }

    } catch (error) {
        errorMessage = error.message;
    }
    clearMessages();
  }

  async function uploadFile(event) {
    // Исправление: event.target.files — это FileList, берем первый элемент [0]
    const file = event.target.files[0]; 
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetPath', currentPath); 

    try {
        const response = await fetch('/api/files', {
            method: 'PUT',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            successMessage = result.message;
            loadDirectory(currentPath);
        } else {
            throw new Error(result.error || 'Не удалось загрузить файл.');
        }

    } catch (error) {
        errorMessage = error.message;
    }
    event.target.value = ''; 
    clearMessages();
  }
  
  // --- НОВАЯ ФУНКЦИЯ ДЛЯ ЗАПУСКА Скрытого input ---
  function triggerFileInput() {
      // Это безопасный способ вызова клика по скрытому элементу в Svelte
      const fileInput = document.getElementById('fileInput');
      if (fileInput) {
          fileInput.click();
      }
  }
  // --- КОНЕЦ НОВЫХ ФУНКЦИЙ ---


  onMount(() => {
    loadDirectory("/");
  });
</script>

<div class="file-manager">
  <div class="header">
    <div class="path-controls">
        <code>{currentPath}</code>
        
        <button on:click={goBack} disabled={currentPath === '/'}>
            ←
        </button>
        
    </div>
    <div class="actions">
        <button on:click={() => loadDirectory(currentPath)}>↻</button>
        
        <div class="action-dropdown">
            <button class="primary-action">+</button>
            <div class="dropdown-content">
                <button on:click={createNewFolder}>Новая папка 📁</button>
                
                <!-- Скрытый input type="file" -->
                <input type="file" id="fileInput" style="display: none;" on:change={uploadFile} />
                
                <!-- Кнопка с ПРАВИЛЬНЫМ обработчиком Svelte on:click -->
                <button on:click={triggerFileInput}>Загрузить файл 📄</button>
            </div>
        </div>
    </div>
  </div>

  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
  {#if successMessage}
    <p class="success">{successMessage}</p>
  {/if}

  <div class="file-list">
    {#each files as file (file.path)}
      {#if file.name !== '..'}
          {#if file.type === 'directory'}
            <div class="file-entry" on:click={() => handleEntryClick(file)}>
                <span class="icon">📁</span>
                <span class="name">{file.name}</span>
            </div>
          {:else}
            <a class="file-entry file-link" href={getDownloadUrl(file)} download={file.name}>
                <span class="icon">📄</span>
                <span class="name">{file.name}</span>
            </a>
          {/if}
      {/if}
    {/each}
  </div>
</div>



<style>
  .file-manager {
    border-radius: 8px;
    padding: 1rem;
    color: var(--clr-white);
    margin-top: 1rem;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
  }
  .path-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-dropdown {
    position: relative;
    display: inline-block;
  }

  .dropdown-content {
    display: none;
    position: absolute;
    right: 0;
    background-color: #f9f9f9;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
    flex-direction: column;
  }

  .dropdown-content button {
    color: black;
    padding: 8px 12px;
    text-decoration: none;
    display: block;
    border: none;
    background: none;
    text-align: left;
    width: 100%;
    cursor: pointer;
  }

  .dropdown-content button:hover {
    background-color: #f1f1f1;
  }

  .action-dropdown:hover .dropdown-content {
    display: flex;
  }

  .file-list {
    display: flex;
    flex-direction: column;
  }
  .file-entry {
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background-color 0.2s;
  }
  .file-entry:hover {
    background-color: var(--clr-hover);
  }
  .file-link {
    text-decoration: none; 
    color: inherit;
  }
  .icon {
    margin-right: 1rem;
  }
  .name {
    font-family: monospace;
  }
  .error {
    color: red;
    background-color: #fee;
    padding: 0.5rem;
    border: 1px solid red;
    margin-bottom: 1rem;
  }
  .success {
    color: green;
    background-color: #efe;
    padding: 0.5rem;
    border: 1px solid green;
    margin-bottom: 1rem;
  }
</style>
