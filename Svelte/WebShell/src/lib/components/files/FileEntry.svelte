<script>
    const { file, onNavigate, currentPath } = $props();
    const downloadUrl = $derived(() => {
        if (file.type === 'file') {
            return `/api/files?path=${encodeURIComponent(currentPath)}&download=${encodeURIComponent(file.name)}`;
        }
        return '#';
    });

  function toggleDropdown() {
    alert();  document.getElementById("myDropdown").classList.toggle("show");
  }
  window.onclick = function(event) {
    if (!event.target.matches('.dots-button') && !event.target.closest('.dots-button')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  }
</script>


{#snippet DotsButton()}
  <div class="dropdown">
<button class="dots-button" on:click={toggleDropdown}>

      <!--(SVG)(3 points)-->
      <svg xmlns="www.w3.org" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16"> 
          <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
      </svg>
    </button>
    
    <!-- Выпадающее содержимое -->
    <div id="myDropdown" class="dropdown-content">
      <a href={downloadUrl} download={file.name}>скачать</a>
      <a href="#about">удалить</a>
      <a href="#contact">что-то еще</a>
    </div>
  </div>
{/snippet}



<!-- (HTML) -->

{#if file.type === 'directory'}
    <div class="file-entry" >
    {@render DotsButton()}
        <span class="icon" on:click={() => onNavigate(file)}>
           <!--(SVG)(folder)--> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder-fill" viewBox="0 0 16 16"><path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3m-8.322.12q.322-.119.684-.12h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981z"/></svg>
        </span>
        <span class="name">{file.name}</span>
    </div>
{:else}
    <a class="file-entry file-link">
        {@render DotsButton()}
        <span class="icon">
           <!--(SVG)(file)--> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-fill" viewBox="0 0 16 16"><path d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2z"/></svg>
</span>
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
  .dots-button {
    margin-right: 1rem;
  }

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  display: none; 
  position: absolute;
  background-color: #f9f9f9;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
  right: 0;
}

.dropdown-content a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
}

.dropdown-content a:hover {
  background-color: #f1f1f1;
}

/* Класс, который добавляется JavaScript при клике для отображения меню */
.show {
  display: block;
}

</style>
