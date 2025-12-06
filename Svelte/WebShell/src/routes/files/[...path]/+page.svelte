<script>
  import FileEntry from "$lib/components/files/FileEntry.svelte";
  import { goto, invalidateAll } from "$app/navigation";

  const { data } = $props();

  let errorMessage = $state("");
  let successMessage = $state("");

  let fileContent = $state(data.content);
  let message = $state("");

  let viewingFile = $state(null);

  let editorMessage = $state("");

  function clearMessages() {
    setTimeout(() => {
      errorMessage = "";
      successMessage = "";
    }, 3000);
  }

  function goBack() {
    if (data.currentPath !== "/") {
      const parentPath =
        data.currentPath.substring(0, data.currentPath.lastIndexOf("/")) || "/";
      const targetUrl = parentPath === "/" ? "/files" : `/files${parentPath}`;
      goto(targetUrl);
    }
  }

  async function createNewFolder() {
    const folderName = prompt("Введите имя новой папки:");
    if (!folderName || folderName.trim() === "") return;

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mkdir",
          path: data.currentPath,
          name: folderName.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        successMessage = result.message;
        await invalidateAll();
      } else {
        throw new Error(result.error || "Не удалось создать папку.");
      }
    } catch (error) {
      errorMessage = error.message;
    }
    clearMessages();
  }

  async function uploadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetPath", data.currentPath);

    try {
      const response = await fetch("/api/files", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        successMessage = result.message;
        await invalidateAll();
      } else {
        throw new Error(result.error || "Не удалось загрузить файл.");
      }
    } catch (error) {
      errorMessage = error.message;
    }
    event.target.value = "";
    clearMessages();
  }

  function triggerFileInput() {
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.click();
    }
  }

  async function saveFile() {
    const userConfirmed = confirm(
      `Вы уверены, что хотите сохранить изменения в файле "${viewingFile.path}"?`
    );

    if (!userConfirmed) {
      editorMessage = "Сохранение отменено пользователем.";
      setTimeout(() => (editorMessage = ""), 3000);
      return;
    }

    editorMessage = "Сохранение...";
    try {
      const response = await fetch("/api/file-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: viewingFile.path,
          content: viewingFile.content,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        editorMessage = `Сохранено: ${result.message}`;
        hasChanges = false;
      } else {
        throw new Error(result.error || "Ошибка сохранения.");
      }
    } catch (error) {
      editorMessage = `Ошибка: ${error.message}`;
    }
    setTimeout(() => (editorMessage = ""), 3000);
  }

  function goBackToFileManager() {
    const parentPath =
      data.filePath.substring(0, data.filePath.lastIndexOf("/")) || "/";
    goto(`/files${parentPath}`);
  }

  async function handleFileClick(filePath) {
    errorMessage = "";
    try {
      const response = await fetch(
        `/api/file-content?path=${encodeURIComponent(filePath)}`
      );
      if (!response.ok)
        throw new Error("Не удалось загрузить содержимое файла.");

      const fileData = await response.json();
      viewingFile = fileData;
    } catch (error) {
      errorMessage = error.message;
      clearMessages();
    }
  }
  function closeFileViewer() {
    viewingFile = null;
    editorMessage = "";
  }
</script>

<!-- (HTML) -->
<div class="file-manager">
  {#if viewingFile}
    <!-- РЕЖИМ ПРОСМОТРА ФАЙЛА -->
    <div class="file-viewer">
      <div class="header">
        <button on:click={closeFileViewer}>Закрыть</button>
        <button on:click={saveFile}>Сохранить изменения</button>
        <h2>{viewingFile.path}</h2>
      </div>
      <textarea bind:value={viewingFile.content}></textarea>
    </div>
  {:else}
    <!-- РЕЖИМ СПИСКА ФАЙЛОВ -->
    <div class="header">
      <div class="path-controls">
        <code>{data.currentPath}</code>
      </div>
      <div class="actions">
        <button on:click={goBack} disabled={data.currentPath === "/"}>
          <!--(SVG)-->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-arrow-90deg-left"
            viewBox="0 0 16 16"
            ><path
              fill-rule="evenodd"
              d="M1.146 4.854a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H12.5A2.5 2.5 0 0 1 15 6.5v8a.5.5 0 0 1-1 0v-8A1.5 1.5 0 0 0 12.5 5H2.707l3.147 3.146a.5.5 0 1 1-.708.708z"
            /></svg
          >
        </button>
        <button on:click={() => invalidateAll()}>
          <!--(SVG)-->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-arrow-counterclockwise"
            viewBox="0 0 16 16"
            ><path
              fill-rule="evenodd"
              d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"
            /><path
              d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"
            /></svg
          >
        </button>

        <div class="action-dropdown">
          <button class="primary-action">
            <!--(SVG)-->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-patch-plus"
              viewBox="0 0 16 16"
              ><path
                fill-rule="evenodd"
                d="M8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5"
              /><path
                d="m10.273 2.513-.921-.944.715-.698.622.637.89-.011a2.89 2.89 0 0 1 2.924 2.924l-.01.89.636.622a2.89 2.89 0 0 1 0 4.134l-.637.622.011.89a2.89 2.89 0 0 1-2.924 2.924l-.89-.01-.622.636a2.89 2.89 0 0 1-4.134 0l-.622-.637-.89.011a2.89 2.89 0 0 1-2.924-2.924l.01-.89-.636-.622a2.89 2.89 0 0 1 0-4.134l.637-.622-.011-.89a2.89 2.89 0 0 1 2.924-2.924l.89.01.622-.636a2.89 2.89 0 0 1 4.134 0l-.715.698a1.89 1.89 0 0 0-2.704 0l-.92.944-1.32-.016a1.89 1.89 0 0 0-1.911 1.912l.016 1.318-.944.921a1.89 1.89 0 0 0 0 2.704l.944.92-.016 1.32a1.89 1.89 0 0 0 1.912 1.911l1.318-.016.921.944a1.89 1.89 0 0 0 2.704 0l.92-.944 1.32.016a1.89 1.89 0 0 0 1.911-1.912l-.016-1.318.944-.921a1.89 1.89 0 0 0 0-2.704l-.944-.92.016-1.32a1.89 1.89 0 0 0-1.912-1.911z"
              /></svg
            >
          </button>
          <div class="dropdown-content">
            <button on:click={createNewFolder}>Новая папка</button>
            <input
              type="file"
              id="fileInput"
              style="display: none;"
              on:change={uploadFile}
            />
            <button on:click={triggerFileInput}>Загрузить файл</button>
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
      {#each data.files as file (file.path)}
        {#if file.name !== ".."}
          <FileEntry
            {file}
            currentPath={data.currentPath}
            onFileClick={handleFileClick}
          />
        {/if}
      {/each}
    </div>
  {/if}
</div>




<!-- (HTML) -->

<style>
  .file-manager {
    border-radius: 8px;
    padding: 0.5rem;
    color: var(--clr-white);
    margin-top: 1rem;
    height: 100%;
    max-width: 100%;
    max-height: 50rem;
  }
  .header {
    display: flex;
    max-width: 100%;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.25rem;
  }
  .path-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .path-controls code {
    word-wrap: break-word;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: scroll;
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

  .dropdown-content {
    position: absolute;
    right: 0;
    background-color: black;
    color: white;
    min-width: max-content;
    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.3);
    z-index: 1;

    text-transform: uppercase;
    background: var(--dark-bg);
    border-radius: 8px;
  }
  .actions {
    display: flex;
  }
  .dropdown-content {
    display: none;
  }
  .action-dropdown {
    position: relative;
  }
  .action-dropdown:hover .dropdown-content {
    display: grid;
  }

  .dropdown-content button {
    color: white;
    padding: 1rem 1.25rem;
    text-decoration: none;
    display: block;
  }

  .dropdown-content button:hover {
    background-color: var(--clr-hover);
  }

  .file-viewer {
    padding: 1rem;
    height: 100vh;
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  textarea {
    background: var(--light-bg);
    color: white;
    flex-grow: 1;
    width: 100%;
    font-family: monospace;
    padding: 2rem;
    border: none;
    border-radius: 1rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
  textarea:focus {
    border: none;
    outline: 1px solid #34d39999;
  }
  .status-message {
    margin-top: 1rem;
    color: green;
  }
</style>
