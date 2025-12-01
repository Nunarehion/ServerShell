<script>
  import SideBar from "$lib/components/sidebar/SideBar.svelte";
  import LinkItem from "$lib/components/sidebar/LinkItem.svelte";
  let { children } = $props();
</script>

<!-- (HTML) -->

<div class="layout">
  <!-- Первая колонка -->
  <SideBar class="sidebar">
    <hr style="margin: 1rem 0;" />
    <LinkItem url="/" icon="/icon-atom.svg"></LinkItem>
    <hr style="margin: 1rem 0;" />
    <div class="items">
      <LinkItem url="/files" icon="/icon-folder.svg"></LinkItem>
      <LinkItem url="/files" icon="/icon-folder.svg"></LinkItem>
      <LinkItem url="/files" icon="/icon-folder.svg"></LinkItem>
    </div>
  </SideBar>

  <!-- Вторая колонка -->
  <main class="content-area">
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
        margin: 0;
        padding: 0;
        background-color: var(--light-bg);
        max-width: 100vw;
        width: 100vw;
        height: 100%;
        font-family: sans-serif;
        box-sizing: border-box;
        overflow: hidden;
        border: 1px solid red;
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
        font-weight: 100;
        padding: .5rem;
        background: none;
        box-shadow: 0 0 1px #ffffff88;
        border: none;
        border-radius: .25rem;
        color: #ffffff88;
        height: 100%;
      
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
            
        
</style>
