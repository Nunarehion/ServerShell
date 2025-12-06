<script>
  import { onMount } from 'svelte';
  import SideBar from "$lib/components/sidebar/SideBar.svelte";
  import LinkItem from "$lib/components/sidebar/LinkItem.svelte";
  import { invalidateAll } from "$app/navigation";
   let {data, children} =$props()

  
  let layoutMessage = '';

  function handleSaveSuccess(message) {
    layoutMessage = message;
    invalidateAll();
    setTimeout(() => (layoutMessage = ""), 3000);
  }
  
</script>


<div style="position: fixed; top:0; left:0; color:white; background: black; display: grid; gap: 1rem">
{#each data.bookmarks as mark}
   <a href="mark.url">{mark.url.split("/").at(-1)}</a>
{/each}
</div>
<div class="layout">
  <SideBar class="sidebar" onSaveSuccess={handleSaveSuccess}>
    <hr style="margin: 1rem 0;" />
    <LinkItem url="/" icon="/icon-atom.svg"></LinkItem>
    <hr style="margin: 1rem 0;" />
    <div class="items">
      <LinkItem url="/files" icon="/icon-folder.svg"></LinkItem>
    </div>
  </SideBar>

  <main class="content-area">
    {#if layoutMessage}
      <div class="layout-notification">{layoutMessage}</div>
    {/if}
    {@render children()}
  </main>
</div>

<!-- (HTML) -->

<style lang="stylus">
    // Сброс
    :global(*) {box-sizing: border-box}
    :global(body) {margin: 0; padding: 0}
    //:global(*) {outline: .1px solid orangered}

    // < Переменные > //
    :global(:root) {
        font-size: 10px;
        // <-- цвета --> //
        --second-bg: #17181f;
        --dark-bg: #101218;
        --light-bg: #1d1e26;
        --clr-gray: #adafb8;
        --clr-white: white;
        --clr-red: #e11d48;
        --clr-hover: #2f2d39;

        // <-- размеры --> //
        --sidebar-width: 76px
    }
      :global(body) {
        background-color: var(--light-bg);
        max-width: 100vw;
        width: 100vw;
        width: 100dvw;
        //height: 100vh;
        //height: 100dvh;
        height: 100svh;
        font-family: sans-serif;
        box-sizing: border-box;
        overflow: hidden;
        
        
    }
    :global(hr) {
        border: none;
        height: .1px;
        background: var(--clr-gray);
    }

    :global(button) {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 300;
        padding: .5rem;
        background: none;
        box-shadow: 0 0 1px #ffffff88;
        border: none;
        border-radius: .25rem;
        color: #ffffff88;
        height: 100%;
        text-transform: uppercase
    }

    .layout 
        display: grid
        width: 100%
        height: 100%
        grid-template-columns: var(--sidebar-width) 1fr 
        
        
        .content-area
            grid-column: 2 / 3
            
            padding: 1rem
        .items
            display: grid
            gap: .5rem
            padding: 1rem
            background: var(--light-bg)
            
  header {
    position: fixed;
    top: 0;
    right: 0;
    left: var(--sidebar-width);
    height: 4rem;
    background: var(--dark-bg);
    
    display: flex;
    align-items: center; /* Выравнивание ссылок по центру вертикали */
    padding: 0 1rem; /* Горизонтальные отступы */
    gap: 1rem; /* Расстояние между ссылками */
  }
  header a {
    text-decoration: none;
    color: var(--clr-gray);
    padding: 0.5rem 0;
  }

  header a:hover {
    color: var(--clr-white);
  }
</style>
