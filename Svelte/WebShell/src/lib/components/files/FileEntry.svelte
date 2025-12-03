<script>
  const { file, currentPath, onFileClick } = $props();

  import { goto, invalidateAll } from "$app/navigation";

  const downloadUrl = $derived.by(() => {
    if (file.type === "file") {
      return `/api/files?path=${encodeURIComponent(currentPath)}&download=${encodeURIComponent(file.name)}`;
    }
    return "#";
  });

  function handleDownloadClick(event) {
    event.preventDefault();
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    closeDropdown();
  }

  async function handleDelete() {
    if (
      !confirm(
        `Вы уверены, что хотите удалить ${file.type === "directory" ? "папку" : "файл"} "${file.name}"? Это действие необратимо.`
      )
    ) {
      closeDropdown();
      return;
    }

    try {
      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentPath,
          name: file.name,
          type: file.type,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Не удалось удалить объект.");
      }

      await invalidateAll();
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message);
    }
    closeDropdown();
  }

  async function handleRename() {
    const newName = prompt(`Переименовать "${file.name}" в:`, file.name);
    if (!newName || newName.trim() === "" || newName === file.name) {
      closeDropdown();
      return;
    }

    try {
      const response = await fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentPath,
          oldName: file.name,
          newName: newName.trim(),
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Не удалось переименовать объект.");
      }

      await invalidateAll();
    } catch (error) {
      console.error("Rename error:", error);
      alert(error.message);
    }
    closeDropdown();
  }

  //<!--(DropDown.js)-->//
  let dropdownContainer;
  let show = $state(false);
  function toggleDropdown() {
    show = !show;
  }
  function closeDropdown() {
    show = false;
  }
  function handleOutsideClick(event) {
    if (dropdownContainer && !dropdownContainer.contains(event.target)) {
      show = false;
    }
  }
</script>

<!--(events)-->
<svelte:window on:click={handleOutsideClick} />

<!--(snipet)(dot-dropdown-button)-->
{#snippet DotsButton()}
  <div class="dropdown" bind:this={dropdownContainer}>
    <button class="dots-button" on:click={toggleDropdown}>
      <svg
        xmlns="www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-three-dots"
        viewBox="0 0 16 16"
      >
        <path
          d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"
        />
      </svg>
    </button>
    <div class="dropdown-content" class:show>
      {#if file.type === "file"}
        <a href="#" on:click={handleDownloadClick}>скачать</a>
      {/if}
      <button on:click={handleRename}>переименовать</button>
      <button on:click={handleDelete}>удалить</button>
    </div>
  </div>
{/snippet}

<!-- (HTML) -->
{#if file.type === "directory"}
  <div class="file-entry">
    {@render DotsButton()}
    <!-- !!! ИЗМЕНЕНО ЗДЕСЬ !!! Используем goto напрямую -->
    <span on:click={() => goto(`/files${file.path}`)}>
      <span class="icon">
        <svg
          xmlns="www.w3.org"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-folder-fill"
          viewBox="0 0 16 16"
          ><path
            d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3m-8.322.12q.322-.119.684-.12h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981z"
          /></svg
        >
      </span>
      <span class="name">{file.name}</span></span
    >
  </div>
{:else}
  <div class="file-entry file-link" on:click={() => onFileClick(file.path)}>
    {@render DotsButton()}
    <span class="icon">
      <!--(SVG)(file)-->
      <svg
        xmlns="www.w3.org"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-file-earmark-fill"
        viewBox="0 0 16 16"
        ><path
          d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2z"
        /></svg
      >
    </span>
    <span class="name">{file.name}</span>
  </div>
{/if}

<!-- (/HTML) -->

<style lang="stylus">
/* ... Ваши стили без изменений ... */
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
.dots-button {
  margin-right: 1rem;
}

.dropdown {
position: relative;
display: inline-block;
}

.dropdown-content {
position: absolute;
left: 0;
background-color: black;
color: white
min-width: max-content;
box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.3);
z-index: 1;

text-transform: uppercase;
background: var(--dark-bg);
border-radius: 8px;

}
.dropdown-content {
 display: none;
}
.dropdown-content.show {
 display: grid; 
}

/* Стили кнопок и ссылок в меню */
.dropdown-content a, .dropdown-content button {
color: white;
padding: 1rem 1.25rem;
text-decoration: none;
display: block;
background: none;
border: none;
text-align: left;
cursor: pointer;
width: 100%;
font-family: inherit;
text-transform: inherit;
}

.dropdown-content a:hover, .dropdown-content button:hover {
background-color: var(--clr-hover);
}
</style>
