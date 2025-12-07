<script>
  import { onMount } from 'svelte';
  import SideBar from "$lib/components/sidebar/SideBar.svelte";
  import LinkItem from "$lib/components/sidebar/LinkItem.svelte";
  import { invalidateAll } from "$app/navigation";
  
  let {data, children} = $props();
  
  // Простые состояния
  let showBookmarks = $state(false);
  let isMobile = $state(false);
  
  // Определяем мобильное устройство
  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });
  
  function checkMobile() {
    isMobile = window.innerWidth < 768;
  }
  
  function handleSaveSuccess(message) {
    invalidateAll();
  }
  
  // Добавить текущую страницу
  async function addCurrentPage() {
    try {
      const url = window.location.href;
      const title = document.title;
      
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title })
      });
      
      invalidateAll();
      showBookmarks = false;
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  }
  
  // Удалить закладку
  async function removeBookmark(url, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    try {
      // Удаляем по URL, так как в данных нет id
      await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      invalidateAll();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  }
  
  // Функция для получения имени из URL
  function getNameFromUrl(url) {
    try {
      // Убираем протокол и домен, оставляем путь
      const path = url.replace(/^https?:\/\/[^\/]+/, '');
      if (path === '' || path === '/') {
        return 'Главная';
      }
      
      // Берём последнюю часть пути
      const parts = path.split('/').filter(p => p);
      if (parts.length > 0) {
        return parts[parts.length - 1].replace(/-/g, ' ');
      }
      
      return url;
    } catch {
      return url;
    }
  }
</script>

<div class="layout">
  <!-- Сайдбар - только для десктопа -->
  {#if !isMobile}
    <SideBar class="sidebar" onSaveSuccess={handleSaveSuccess}>
      <hr style="margin: 1rem 0;" />
      <LinkItem url="/" icon="/icon-atom.svg"></LinkItem>
      <hr style="margin: 1rem 0;" />
      <div class="items">
        <LinkItem url="/files" icon="/icon-folder.svg"></LinkItem>
      </div>
    </SideBar>
  {/if}

  <!-- Основной контент -->
  <main class="content-area">
    <!-- Мобильный хедер с кнопкой закладок -->
    {#if isMobile}
      <div class="mobile-header">
        <button 
          class="mobile-menu-btn"
          on:click={() => showBookmarks = !showBookmarks}
        >
          {#if showBookmarks}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          {/if}
          Закладки ({data.bookmarks?.length || 0})
        </button>
      </div>
    {/if}
    
    <!-- Контент страницы -->
    <div class="page-content">
      {@render children()}
    </div>
  </main>
</div>

<!-- Панель закладок (только для мобильных) -->
{#if isMobile && showBookmarks}
  <div class="mobile-bookmarks-panel">
    <div class="panel-header">
      <h3>Закладки</h3>
    </div>
    
    <!-- Список закладок -->
    <div class="bookmarks-list">
      {#each data.bookmarks || [] as bookmark}
        <a 
          href={bookmark.url} 
          class="bookmark-item"
          on:click={() => showBookmarks = false}
        >
          <div class="bookmark-icon">
            <img 
              src={bookmark.icon || '/default-icon.svg'} 
              alt="" 
              on:error={(e) => e.target.src = '/default-icon.svg'}
            />
          </div>
          <div class="bookmark-info">
            <div class="bookmark-name">{getNameFromUrl(bookmark.url)}</div>
            <div class="bookmark-url">{bookmark.url.replace(/^https?:\/\//, '')}</div>
          </div>
          <button 
            class="remove-btn"
            on:click={(e) => removeBookmark(bookmark.url, e)}
          >×</button>
        </a>
      {:else}
        <div class="empty">Нет закладок</div>
      {/each}
    </div>
    
    <div class="panel-footer">
      <button on:click={addCurrentPage}>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Добавить текущую страницу
      </button>
    </div>
  </div>
{/if}

<!-- Десктопная панель закладок (фиксированная слева) -->
{#if !isMobile && data.bookmarks && data.bookmarks.length > 0}
  <div class="desktop-bookmarks">
    <div class="bookmarks-header">
      <h4>Закладки</h4>
      <button on:click={addCurrentPage} title="Добавить текущую">+</button>
    </div>
    <div class="bookmarks-list">
      {#each data.bookmarks || [] as bookmark}
        <a 
          href={bookmark.url} 
          class="bookmark-item"
        >
          <div class="bookmark-icon">
            <img 
              src={bookmark.icon || '/default-icon.svg'} 
              alt=""
              on:error={(e) => e.target.src = '/default-icon.svg'}
            />
          </div>
          <div class="bookmark-info">
            <div class="bookmark-name">{getNameFromUrl(bookmark.url)}</div>
          </div>
          <button 
            class="remove-btn"
            on:click={(e) => removeBookmark(bookmark.url, e)}
          >×</button>
        </a>
      {/each}
    </div>
  </div>
{/if}

<style lang="stylus">
  // БАЗОВЫЕ СТИЛИ
  :global(*) 
    box-sizing: border-box
  
  :global(body) 
    margin: 0
    padding: 0
    background-color: #1d1e26
    width: 100vw
    height: 100svh
    font-family: sans-serif
    overflow: hidden
  
  :global(:root) 
    font-size: 10px
    --second-bg: #17181f
    --dark-bg: #101218
    --light-bg: #1d1e26
    --clr-gray: #adafb8
    --clr-white: white
    --clr-red: #e11d48
    --clr-hover: #2f2d39
    --clr-blue: #3b82f6
    --sidebar-width: 76px
  
  :global(hr) 
    border: none
    height: 0.5px
    background: var(--clr-gray)
  
  // ОСНОВНОЙ LAYOUT
  .layout 
    display: grid
    width: 100%
    height: 100%
    position: relative
    
    // Десктоп: сайдбар + контент
    @media (min-width: 768px) 
      grid-template-columns: var(--sidebar-width) 1fr
    
    // Мобильные: только контент
    @media (max-width: 767px) 
      grid-template-columns: 1fr
  
  .content-area 
    height: 100%
    overflow-y: auto
    
    @media (min-width: 768px) 
      grid-column: 2 / 3
      padding: 1rem
    
    @media (max-width: 767px) 
      grid-column: 1 / 2
      padding-top: 60px // Для мобильного хедера
  
  .page-content 
    padding: 1rem
    min-height: 100%
  
  .items 
    display: grid
    gap: 0.5rem
    padding: 1rem
    background: var(--light-bg)
  
  // МОБИЛЬНЫЙ ХЕДЕР
  .mobile-header 
    position: fixed
    top: 0
    left: 0
    right: 0
    height: 60px
    background: var(--dark-bg)
    display: flex
    align-items: center
    padding: 0 1rem
    z-index: 100
    border-bottom: 1px solid var(--clr-gray)
  
  .mobile-menu-btn 
    background: var(--clr-hover)
    border: none
    color: var(--clr-white)
    padding: 8px 16px
    border-radius: 8px
    cursor: pointer
    font-size: 1.4rem
    display: flex
    align-items: center
    gap: 8px
    width: 100%
    justify-content: center
    
    &:hover 
      background: var(--clr-gray)
  
  // МОБИЛЬНАЯ ПАНЕЛЬ ЗАКЛАДОК
  .mobile-bookmarks-panel 
    position: fixed
    top: 0
    left: 0
    right: 0
    bottom: 0
    background: var(--dark-bg)
    z-index: 200
    padding: 20px
    padding-top: 80px
    overflow-y: auto
    
    .panel-header 
      display: flex
      justify-content: space-between
      align-items: center
      margin-bottom: 20px
      
      h3 
        margin: 0
        color: var(--clr-white)
        font-size: 1.8rem
      
      button 
        background: none
        border: none
        color: var(--clr-gray)
        font-size: 2rem
        cursor: pointer
        width: 40px
        height: 40px
        
        &:hover 
          color: var(--clr-white)
    
    .bookmarks-list 
      display: flex
      flex-direction: column
      gap: 8px
      margin-bottom: 20px
      
      .bookmark-item 
        display: flex
        align-items: center
        background: var(--light-bg)
        border-radius: 8px
        padding: 12px
        text-decoration: none
        color: inherit
        
        &:hover 
          background: var(--clr-hover)
        
        .bookmark-icon 
          width: 40px
          height: 40px
          margin-right: 12px
          flex-shrink: 0
          
          img 
            width: 100%
            height: 100%
            object-fit: contain
            border-radius: 4px
        
        .bookmark-info 
          flex: 1
          min-width: 0
          
          .bookmark-name 
            color: var(--clr-white)
            font-size: 1.4rem
            font-weight: 500
            margin-bottom: 2px
            white-space: nowrap
            overflow: hidden
            text-overflow: ellipsis
          
          .bookmark-url 
            color: var(--clr-gray)
            font-size: 1.2rem
            white-space: nowrap
            overflow: hidden
            text-overflow: ellipsis
        
        .remove-btn 
          background: none
          border: none
          color: var(--clr-gray)
          font-size: 1.8rem
          cursor: pointer
          width: 30px
          height: 30px
          flex-shrink: 0
          margin-left: 8px
          
          &:hover 
            color: var(--clr-red)
      
      .empty 
        text-align: center
        color: var(--clr-gray)
        padding: 40px
        font-size: 1.4rem
    
    .panel-footer 
      margin-top: 20px
      
      button 
        width: 100%
        padding: 12px
        background: var(--clr-blue)
        border: none
        border-radius: 8px
        color: white
        font-size: 1.4rem
        cursor: pointer
        display: flex
        align-items: center
        justify-content: center
        gap: 8px
        
        &:hover 
          background: darken(#3b82f6, 10%)
  
  // ДЕСКТОПНАЯ ПАНЕЛЬ ЗАКЛАДОК
  .desktop-bookmarks 
    position: fixed
    top: 0
    left: var(--sidebar-width)
    width: 250px
    height: 100%
    background: var(--dark-bg)
    border-right: 1px solid var(--clr-gray)
    padding: 1rem
    overflow-y: auto
    z-index: 50
    
    .bookmarks-header 
      display: flex
      justify-content: space-between
      align-items: center
      margin-bottom: 1rem
      
      h4 
        margin: 0
        color: var(--clr-white)
        font-size: 1.4rem
      
      button 
        background: var(--clr-blue)
        border: none
        color: white
        width: 30px
        height: 30px
        border-radius: 4px
        cursor: pointer
        font-size: 1.6rem
        
        &:hover 
          background: darken(#3b82f6, 10%)
    
    .bookmarks-list 
      display: flex
      flex-direction: column
      gap: 6px
      
      .bookmark-item 
        display: flex
        align-items: center
        background: var(--light-bg)
        border-radius: 6px
        padding: 8px
        text-decoration: none
        color: inherit
        
        &:hover 
          background: var(--clr-hover)
        
        .bookmark-icon 
          width: 32px
          height: 32px
          margin-right: 8px
          flex-shrink: 0
          
          img 
            width: 100%
            height: 100%
            object-fit: contain
            border-radius: 4px
        
        .bookmark-info 
          flex: 1
          min-width: 0
          
          .bookmark-name 
            color: var(--clr-white)
            font-size: 1.3rem
            white-space: nowrap
            overflow: hidden
            text-overflow: ellipsis
        
        .remove-btn 
          background: none
          border: none
          color: var(--clr-gray)
          cursor: pointer
          width: 24px
          height: 24px
          flex-shrink: 0
          font-size: 1.6rem
          
          &:hover 
            color: var(--clr-red)
  
  // СКРЫТЬ САЙДБАР НА МОБИЛЬНЫХ
  @media (max-width: 767px) 
    .sidebar 
      display: none !important
  
  @media (min-width: 768px) 
    .mobile-header 
      display: none !important
</style>