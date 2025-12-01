<script>
  import { onMount } from "svelte";
  import FileEntry from "./FileEntry.svelte"; 

  let currentPath = "/";
  let files = $state([]);
  let errorMessage = $state(""); 
  let successMessage = $state(""); 

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

  function goBack() {
      // ИСПРАВЛЕНИЕ: Вычисляем родительский путь из текущего пути
      if (currentPath !== '/') {
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
          loadDirectory(parentPath);
      }
  }

  function handleEntryClick(file) {
    if (file.type === "directory") {
      loadDirectory(file.path);
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
    const file = event.target.files[0]; // Исправлено получение файла
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
  
  function triggerFileInput() {
      const fileInput = document.getElementById('fileInput');
      if (fileInput) {
          fileInput.click();
      }
  }

  onMount(() => {
    loadDirectory("/");
  });
</script>

<div class="file-manager">
  <div class="header">
    <div class="path-controls">
        <code>{currentPath}</code>
    </div>
    <div class="actions">
        <!-- Кнопка теперь отключена, если мы в корневом каталоге -->
        <button on:click={goBack} disabled={currentPath === '/'}>
            ←
        </button>
        <button on:click={() => loadDirectory(currentPath)}>↻</button>

        <div class="action-dropdown">
            <button class="primary-action">+</button>
            <div class="dropdown-content">
                <button on:click={createNewFolder}>Новая папка 📁</button>
                <input type="file" id="fileInput" style="display: none;" on:change={uploadFile} />
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
      <!-- Мы больше не ищем '..' в списке, так как логика "назад" в goBack() -->
      <!-- Но оставим проверку, если бэкенд все еще может его возвращать в других случаях -->
      {#if file.name !== '..'}
          <FileEntry {file} onNavigate={handleEntryClick} currentPath={currentPath} />
      {/if}
    {/each}
  </div>
</div>

<style>
  /* Стили CSS */
  .file-manager {
    border-radius: 8px;
    padding: .5rem;
    color: var(--clr-white);
    margin-top: 1rem;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: .25rem;
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
