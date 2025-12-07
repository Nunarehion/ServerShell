<script>
  import { onMount } from 'svelte';
  import SideBar from "$lib/components/sidebar/SideBar.svelte";
  import LinkItem from "$lib/components/sidebar/LinkItem.svelte";
  import { invalidateAll } from "$app/navigation";
  
  let {data, children} = $props();
  
  // Состояния
  let isBookmarksOpen = $state(false);
  let isMobile = $state(false);
  let layoutMessage = '';
  let searchQuery = $state('');
  
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
    layoutMessage = message;
    invalidateAll();
    setTimeout(() => (layoutMessage = ""), 3000);
  }
  
  // Добавить текущую страницу в закладки
  async function addCurrentPage() {
    try {
      const url = window.location.href;
      const title = document.title;
      
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title })
      });
      
      if (response.ok) {
        invalidateAll();
        isBookmarksOpen = false;
      }
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  }
  
  // Удалить закладку
  async function removeBookmark(id, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        invalidateAll();
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  }
  
  // Фильтрация закладок по поиску
  const filteredBookmarks = $derived(() => {
    if (!data.bookmarks) return [];
    
    if (!searchQuery.trim()) return data.bookmarks;
    
    const query = searchQuery.toLowerCase();
    return data.bookmarks.filter(bookmark => 
      bookmark.url.toLowerCase().includes(query) ||
      (bookmark.title && bookmark.title.toLowerCase().includes(query))
    );
  });
  
  // Форматирование URL для отображения
  function formatUrl(url) {
    try {
      return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    } catch {
      return url;
    }
  }
  
  // Получить короткое название из URL
  function getShortName(url) {
    try {
      const parts = url.split('/').filter(Boolean);
      return parts[parts.length - 1] || parts[parts.length - 2] || url;
    } catch {
      return url;
    }
  }
</script>

<div class="layout">
  <!-- Сайдбар (только для десктопа) -->
  {#if !isMobile}
    <SideBar class="sidebar" onSaveSuccess={handleSaveSuccess}>
      <hr style="margin: 1rem 0;" />
      <LinkItem url="/" icon="/icon-atom.svg"></LinkItem>
      <hr style="margin: 1rem 0;" />
      <div class="items">
        <LinkItem url="/files" icon="/icon-folder.svg"></LinkItem>
        
        <!-- Кнопка закладок в сайдбаре -->
        <button 
          class="bookmarks-trigger"
          on:click={() => isBookmarksOpen = !isBookmarksOpen}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" style="opacity: 0.7;">
            <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Закладки ({data.bookmarks?.length || 0})</span>
        </button>
      </div>
    </SideBar>
  {/if}

  <!-- Основной контент -->
  <main class="content-area">
    <!-- Кнопка закладок для мобильных (в хедере) -->
    {#if isMobile}
      <header class="mobile-header">
        <button 
          class="mobile-bookmarks-btn"
          on:click={() => isBookmarksOpen = !isBookmarksOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Закладки ({data.bookmarks?.length || 0})</span>
        </button>
      </header>
    {/if}
    
    <!-- Контент страницы -->
    <div class="page-content">
      {@render children()}
    </div>
    
    <!-- Простое уведомление (только если нужно) -->
    {#if layoutMessage}
      <div class="simple-notification">{layoutMessage}</div>
    {/if}
  </main>
</div>

<!-- Панель закладок (iOS стиль) -->
<div 
  class="bookmarks-overlay {isBookmarksOpen ? 'visible' : ''}"
  class:visible={isBookmarksOpen}
  on:click={(e) => {
    if (e.target.classList.contains('bookmarks-overlay')) {
      isBookmarksOpen = false;
    }
  }}
>
  <div class="bookmarks-sheet {isBookmarksOpen ? 'open' : ''}" class:open={isBookmarksOpen}>
    <!-- Хедер панели -->
    <div class="sheet-header">
      <div class="sheet-handle"></div>
      <div class="sheet-title">
        <h3>Закладки</h3>
        {#if data.bookmarks?.length > 0}
          <span class="bookmarks-count">{data.bookmarks.length}</span>
        {/if}
      </div>
      <button 
        class="sheet-close"
        on:click={() => isBookmarksOpen = false}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
    
    <!-- Поиск -->
    <div class="bookmarks-search">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="currentColor" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        type="text"
        placeholder="Поиск закладок..."
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button 
          class="clear-search"
          on:click={() => searchQuery = ''}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      {/if}
    </div>
    
    <!-- Список закладок -->
    <div class="bookmarks-list">
      {#if filteredBookmarks.length === 0}
        <div class="empty-state">
          {#if searchQuery}
            <svg width="48" height="48" viewBox="0 0 24 24">
              <path fill="currentColor" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p>Ничего не найдено</p>
          {:else}
            <svg width="48" height="48" viewBox="0 0 24 24">
              <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            <p>Нет закладок</p>
          {/if}
        </div>
      {:else}
        {#each filteredBookmarks as bookmark}
          <div class="bookmark-item">
            <a 
              href={bookmark.url} 
              class="bookmark-link"
              on:click={() => isBookmarksOpen = false}
            >
              <div class="bookmark-icon">
                <!-- Простая иконка вместо favicon -->
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/>
                </svg>
              </div>
              <div class="bookmark-info">
                <div class="bookmark-title">
                  {bookmark.title || getShortName(bookmark.url)}
                </div>
                <div class="bookmark-url">
                  {formatUrl(bookmark.url)}
                </div>
              </div>
            </a>
            <button 
              class="remove-btn"
              on:click={(e) => removeBookmark(bookmark.id, e)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        {/each}
      {/if}
    </div>
    
    <!-- Футер с кнопкой добавления -->
    <div class="sheet-footer">
      <button 
        class="add-bookmark-btn"
        on:click={addCurrentPage}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Добавить текущую страницу
      </button>
    </div>
  </div>
</div>

<style lang="stylus">
  // ===== БАЗОВЫЕ СТИЛИ =====
  :global(*) 
    box-sizing: border-box
  
  :global(body) 
    margin: 0
    padding: 0
  
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
  
  :global(body) 
    background-color: var(--light-bg)
    width: 100vw
    height: 100svh
    font-family: sans-serif
    overflow: hidden
  
  :global(hr) 
    border: none
    height: 0.5px
    background: var(--clr-gray)
  
  // ===== ОСНОВНОЙ ЛЕЙАУТ =====
  .layout 
    display: grid
    width: 100%
    height: 100%
    
    // Десктоп
    @media (min-width: 768px) 
      grid-template-columns: var(--sidebar-width) 1fr
    
    // Мобильные
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
      padding: 0
  
  .page-content 
    padding: 1rem
    min-height: 100%
  
  .items 
    display: grid
    gap: 0.5rem
    padding: 1rem
    background: var(--light-bg)
  
  // ===== ХЕДЕР ДЛЯ МОБИЛЬНЫХ =====
  .mobile-header 
    position: sticky
    top: 0
    background: var(--dark-bg)
    padding: 0.5rem 1rem
    border-bottom: 0.5px solid var(--clr-gray)
    z-index: 50
  
  .mobile-bookmarks-btn 
    display: flex
    align-items: center
    gap: 10px
    background: none
    border: none
    color: var(--clr-white)
    font-size: 1.4rem
    padding: 8px 12px
    border-radius: 8px
    cursor: pointer
    width: 100%
    justify-content: center
    
    &:hover 
      background: var(--clr-hover)
  
  // ===== КНОПКА В САЙДБАРЕ (ДЕСКТОП) =====
  .bookmarks-trigger 
    display: flex
    align-items: center
    gap: 10px
    padding: 10px
    background: var(--dark-bg)
    border: none
    border-radius: 8px
    color: var(--clr-white)
    cursor: pointer
    width: 100%
    margin-top: 1rem
    
    &:hover 
      background: var(--clr-hover)
    
    span 
      font-size: 1.3rem
  
  // ===== ПАНЕЛЬ ЗАКЛАДОК (iOS СТИЛЬ) =====
  .bookmarks-overlay 
    position: fixed
    top: 0
    left: 0
    right: 0
    bottom: 0
    background: rgba(0, 0, 0, 0)
    z-index: 1000
    display: flex
    align-items: flex-end
    justify-content: center
    opacity: 0
    visibility: hidden
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
    
    &.visible 
      opacity: 1
      visibility: visible
      background: rgba(0, 0, 0, 0.4)
  
  .bookmarks-sheet 
    width: 100%
    max-width: 600px
    height: 80vh
    background: var(--dark-bg)
    border-radius: 20px 20px 0 0
    display: flex
    flex-direction: column
    transform: translateY(100%)
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)
    
    &.open 
      transform: translateY(0)
    
    // Хедер
    .sheet-header 
      padding: 16px 20px 8px
      border-bottom: 0.5px solid var(--clr-gray)
      display: flex
      align-items: center
      justify-content: space-between
      
      .sheet-handle 
        position: absolute
        top: 8px
        left: 50%
        transform: translateX(-50%)
        width: 36px
        height: 5px
        background: var(--clr-gray)
        border-radius: 2.5px
      
      .sheet-title 
        flex: 1
        text-align: center
        display: flex
        align-items: center
        justify-content: center
        gap: 8px
        
        h3 
          margin: 0
          font-size: 1.8rem
          font-weight: 600
          color: var(--clr-white)
        
        .bookmarks-count 
          background: var(--clr-blue)
          color: white
          font-size: 1.2rem
          padding: 2px 8px
          border-radius: 10px
      
      .sheet-close 
        width: 36px
        height: 36px
        border: none
        background: none
        color: var(--clr-gray)
        cursor: pointer
        border-radius: 8px
        display: flex
        align-items: center
        justify-content: center
        
        &:hover 
          background: var(--clr-hover)
    
    // Поиск
    .bookmarks-search 
      padding: 16px 20px
      position: relative
      border-bottom: 0.5px solid var(--clr-gray)
      
      svg 
        position: absolute
        left: 32px
        top: 50%
        transform: translateY(-50%)
        color: var(--clr-gray)
      
      input 
        width: 100%
        padding: 12px 40px 12px 40px
        background: var(--light-bg)
        border: none
        border-radius: 10px
        color: var(--clr-white)
        font-size: 1.4rem
        
        &:focus 
          outline: none
        
        &::placeholder 
          color: var(--clr-gray)
      
      .clear-search 
        position: absolute
        right: 32px
        top: 50%
        transform: translateY(-50%)
        width: 24px
        height: 24px
        border: none
        background: none
        color: var(--clr-gray)
        cursor: pointer
        display: flex
        align-items: center
        justify-content: center
        
        &:hover 
          color: var(--clr-white)
    
    // Список закладок
    .bookmarks-list 
      flex: 1
      overflow-y: auto
      padding: 0 20px
      
      .empty-state 
        display: flex
        flex-direction: column
        align-items: center
        justify-content: center
        height: 200px
        color: var(--clr-gray)
        text-align: center
        
        svg 
          margin-bottom: 16px
          opacity: 0.5
        
        p 
          font-size: 1.6rem
          margin: 0
      
      .bookmark-item 
        display: flex
        align-items: center
        padding: 12px 0
        border-bottom: 0.5px solid var(--clr-gray)
        
        &:last-child 
          border-bottom: none
        
        .bookmark-link 
          display: flex
          align-items: center
          flex: 1
          gap: 12px
          text-decoration: none
          color: inherit
          padding-right: 12px
          
          &:hover 
            .bookmark-title 
              color: var(--clr-blue)
        
        .bookmark-icon 
          width: 40px
          height: 40px
          flex-shrink: 0
          border-radius: 8px
          background: var(--light-bg)
          display: flex
          align-items: center
          justify-content: center
          
          svg 
            opacity: 0.7
        
        .bookmark-info 
          flex: 1
          overflow: hidden
          
          .bookmark-title 
            font-size: 1.5rem
            font-weight: 500
            color: var(--clr-white)
            margin-bottom: 2px
            white-space: nowrap
            overflow: hidden
            text-overflow: ellipsis
            transition: color 0.2s
          
          .bookmark-url 
            font-size: 1.3rem
            color: var(--clr-gray)
            white-space: nowrap
            overflow: hidden
            text-overflow: ellipsis
        
        .remove-btn 
          width: 36px
          height: 36px
          border: none
          background: none
          color: var(--clr-gray)
          cursor: pointer
          border-radius: 8px
          display: flex
          align-items: center
          justify-content: center
          
          &:hover 
            background: var(--clr-red)
            color: white
    
    // Футер
    .sheet-footer 
      padding: 16px 20px
      border-top: 0.5px solid var(--clr-gray)
      
      .add-bookmark-btn 
        width: 100%
        padding: 12px
        background: var(--clr-blue)
        border: none
        border-radius: 10px
        color: white
        font-size: 1.4rem
        font-weight: 500
        cursor: pointer
        display: flex
        align-items: center
        justify-content: center
        gap: 8px
        
        &:hover 
          background: darken(#3b82f6, 10%)
  
  // ===== УВЕДОМЛЕНИЕ =====
  .simple-notification 
    position: fixed
    bottom: 20px
    right: 20px
    background: var(--clr-blue)
    color: white
    padding: 8px 16px
    border-radius: 6px
    font-size: 1.2rem
    z-index: 100
  
  // ===== АДАПТИВНОСТЬ ДЕСКТОПА =====
  @media (min-width: 768px) 
    .bookmarks-sheet 
      border-radius: 16px
      height: 70vh
      max-height: 600px
      
      .sheet-header 
        .sheet-handle 
          display: none
  
  // ===== СКРЫТЬ САЙДБАР НА МОБИЛЬНЫХ =====
  @media (max-width: 767px) 
    .sidebar 
      display: none
</style>