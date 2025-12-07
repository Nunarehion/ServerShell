<script>
  import { onMount } from 'svelte';
  import SideBar from "$lib/components/sidebar/SideBar.svelte";
  import LinkItem from "$lib/components/sidebar/LinkItem.svelte";
  import { invalidateAll } from "$app/navigation";
  
  let {data, children} = $props();
  
  // Состояния
  let showBookmarks = $state(false);
  let isMobile = $state(false);
  let searchQuery = $state('');
  let activeFilter = $state('all'); // all, internal, external
  
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
  
  // Получить имя из URL
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
        // Убираем расширения файлов и декодируем URL
        const name = parts[parts.length - 1]
          .replace(/\.[^/.]+$/, '') // Убираем расширение
          .replace(/[-_]/g, ' ')    // Заменяем дефисы и подчёркивания на пробелы
          .replace(/%20/g, ' ')     // Декодируем пробелы
          .trim();
        
        return name || url;
      }
      
      return url;
    } catch {
      return url;
    }
  }
  
  // Проверить является ли ссылка внутренней
  function isInternal(url) {
    return url.startsWith('/') || url.includes(window.location.hostname);
  }
  
  // Фильтрованные закладки
  const filteredBookmarks = $derived.by(() => {
    if (!data.bookmarks) return [];
    
    let filtered = data.bookmarks.filter(bookmark => {
      // Поиск
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = getNameFromUrl(bookmark.url).toLowerCase();
        const url = bookmark.url.toLowerCase();
        return name.includes(query) || url.includes(query);
      }
      return true;
    });
    
    // Фильтр по типу
    if (activeFilter === 'internal') {
      filtered = filtered.filter(bookmark => isInternal(bookmark.url));
    } else if (activeFilter === 'external') {
      filtered = filtered.filter(bookmark => !isInternal(bookmark.url));
    }
    
    return filtered;
  });
</script>

<!-- Основной layout -->
<div class="layout">
  <!-- Сайдбар - только для десктопа -->
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
          on:click={() => showBookmarks = !showBookmarks}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Закладки ({data.bookmarks?.length || 0})</span>
        </button>
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

<!-- iOS-панель закладок -->
<div 
  class="bookmarks-overlay {showBookmarks ? 'visible' : ''}"
  class:visible={showBookmarks}
  on:click={(e) => {
    if (e.target.classList.contains('bookmarks-overlay')) {
      showBookmarks = false;
    }
  }}
>
  <div class="bookmarks-sheet {showBookmarks ? 'open' : ''}" class:open={showBookmarks}>
    <!-- Хедер панели с ручкой и крестиком -->
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
        on:click={() => showBookmarks = false}
        title="Закрыть"
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
          title="Очистить поиск"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      {/if}
    </div>
    
    <!-- Фильтры -->
    <div class="bookmarks-filters">
      <button 
        class:active={activeFilter === 'all'}
        on:click={() => activeFilter = 'all'}
      >
        Все
      </button>
      <button 
        class:active={activeFilter === 'internal'}
        on:click={() => activeFilter = 'internal'}
      >
        Внутренние
      </button>
      <button 
        class:active={activeFilter === 'external'}
        on:click={() => activeFilter = 'external'}
      >
        Внешние
      </button>
    </div>
    
    <!-- Список закладок -->
    <div class="bookmarks-list">
      {#if filteredBookmarks.length === 0}
        <div class="empty-state">
          {#if searchQuery || activeFilter !== 'all'}
            <svg width="48" height="48" viewBox="0 0 24 24">
              <path fill="currentColor" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p>Ничего не найдено</p>
            <button 
              class="reset-filters"
              on:click={() => {
                searchQuery = '';
                activeFilter = 'all';
              }}
            >
              Сбросить фильтры
            </button>
          {:else}
            <svg width="48" height="48" viewBox="0 0 24 24">
              <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            <p>Нет закладок</p>
            <p class="empty-hint">Добавьте свою первую закладку</p>
          {/if}
        </div>
      {:else}
        {#each filteredBookmarks as bookmark}
          <div class="bookmark-item">
            <a 
              href={bookmark.url} 
              class="bookmark-link"
              on:click={() => showBookmarks = false}
            >
              <div class="bookmark-icon">
                <!-- Простая иконка ссылки (без favicon) -->
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M10 6v2H5v11h11v-5h2v6a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h6zm11-3v9h-2V6.413l-7.793 7.794-1.414-1.414L17.585 5H13V3h8z"/>
                </svg>
              </div>
              <div class="bookmark-info">
                <div class="bookmark-name">{getNameFromUrl(bookmark.url)}</div>
                <div class="bookmark-url">{bookmark.url.replace(/^https?:\/\//, '').split('/')[0]}</div>
              </div>
            </a>
            <button 
              class="remove-btn"
              on:click={(e) => removeBookmark(bookmark.url, e)}
              title="Удалить закладку"
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
  // БАЗОВЫЕ СТИЛИ
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
    --clr-border: rgba(255, 255, 255, 0.07)
    --clr-gray: #adafb8
    --clr-white: white
    --clr-red: #e11d48
    --clr-hover: #2f2d39
    --clr-blue: #3b82f6
    --clr-green: #10b981
    --sidebar-width: 76px
  
  :global(body) 
    background-color: var(--light-bg)
    width: 100vw
    height: 100svh
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
    overflow: hidden
  
  :global(hr) 
    border: none
    height: 0.5px
    background: var(--clr-border)
  
  // ГЛОБАЛЬНЫЕ СТИЛИ ДЛЯ КНОПОК (из твоего оригинального кода)
  :global(button) 
    display: flex
    align-items: center
    justify-content: center
    font-weight: 300
    padding: .5rem
    background: none
    box-shadow: 0 0 1px #ffffff88
    border: none
    border-radius: .25rem
    color: #ffffff88
    height: 100%
    text-transform: uppercase
    cursor: pointer
  
  // ОСНОВНОЙ LAYOUT
  .layout 
    display: grid
    width: 100%
    height: 100%
    
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
    border-bottom: 1px solid var(--clr-border)
  
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
  
  // КНОПКА В САЙДБАРЕ (ДЕСКТОП)
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
  
  // iOS-ПАНЕЛЬ ЗАКЛАДОК
  .bookmarks-overlay 
    position: fixed
    top: 0
    left: 0
    right: 0
    bottom: 0
    background: rgba(0, 0, 0, 0)
    backdrop-filter: blur(0)
    -webkit-backdrop-filter: blur(0)
    z-index: 1000
    display: flex
    align-items: flex-end
    justify-content: center
    opacity: 0
    visibility: hidden
    transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1)
    
    &.visible 
      opacity: 1
      visibility: visible
      background: rgba(0, 0, 0, 0.4)
      backdrop-filter: blur(4px)
      -webkit-backdrop-filter: blur(4px)
  
  .bookmarks-sheet 
    width: 100%
    max-width: 600px
    height: 85vh
    background: var(--dark-bg)
    border-radius: 20px 20px 0 0
    display: flex
    flex-direction: column
    transform: translateY(100%)
    transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)
    
    &.open 
      transform: translateY(0)
    
    // Хедер с ручкой и крестиком
    .sheet-header 
      padding: 16px 20px 8px
      border-bottom: 0.5px solid var(--clr-border)
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
        opacity: 0.6
      
      .sheet-title 
        flex: 1
        text-align: center
        display: flex
        align-items: center
        justify-content: center
        gap: 10px
        
        h3 
          margin: 0
          font-size: 1.8rem
          font-weight: 600
          color: var(--clr-white)
        
        .bookmarks-count 
          background: var(--clr-blue)
          color: white
          font-size: 1.2rem
          font-weight: 500
          padding: 2px 8px
          border-radius: 10px
      
      .sheet-close 
        width: 40px
        height: 40px
        border: none
        background: none
        color: var(--clr-gray)
        cursor: pointer
        border-radius: 8px
        display: flex
        align-items: center
        justify-content: center
        transition: all 0.2s
        
        &:hover 
          background: var(--clr-hover)
          color: var(--clr-white)
    
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
        font-weight: 400
        
        &:focus 
          outline: none
          background: var(--clr-hover)
        
        &::placeholder 
          color: var(--clr-gray)
          font-weight: 300
      
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
        border-radius: 4px
        
        &:hover 
          background: var(--clr-hover)
          color: var(--clr-white)
    
    // Фильтры
    .bookmarks-filters 
      display: flex
      padding: 12px 20px
      gap: 8px
      border-bottom: 0.5px solid var(--clr-border)
      
      button 
        flex: 1
        padding: 8px 12px
        border: 0.5px solid var(--clr-gray)
        background: var(--light-bg)
        color: var(--clr-gray)
        border-radius: 8px
        font-size: 1.3rem
        font-weight: 500
        cursor: pointer
        transition: all 0.2s
        
        &:hover 
          background: var(--clr-hover)
          color: var(--clr-white)
        
        &.active 
          background: var(--clr-blue)
          border-color: var(--clr-blue)
          color: white
    
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
          margin: 0 0 8px 0
        
        .empty-hint 
          font-size: 1.3rem
          opacity: 0.7
          margin-bottom: 16px
        
        .reset-filters 
          padding: 8px 16px
          background: var(--clr-blue)
          color: white
          border: none
          border-radius: 8px
          font-size: 1.3rem
          cursor: pointer
          margin-top: 16px
          
          &:hover 
            background: darken(#3b82f6, 10%)
      
      .bookmark-item 
        display: flex
        align-items: center
        padding: 12px 0
        border-bottom: 0.5px solid var(--clr-border)
        
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
            .bookmark-name 
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
          
          .bookmark-name 
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
          opacity: 0.7
          transition: all 0.2s
          
          &:hover 
            background: var(--clr-red)
            color: white
            opacity: 1
    
    // Футер с кнопкой добавления
    .sheet-footer 
      padding: 16px 20px
      border-top: 0.5px solid var(--clr-border)
      
      .add-bookmark-btn 
        width: 100%
        padding: 14px
        background: var(--clr-blue)
        border: none
        border-radius: 12px
        color: white
        font-size: 1.5rem
        font-weight: 600
        cursor: pointer
        display: flex
        align-items: center
        justify-content: center
        gap: 10px
        transition: all 0.2s
        
        &:hover 
          background: darken(#3b82f6, 10%)
          transform: translateY(-1px)
        
        &:active 
          transform: translateY(0)
  
  // АДАПТИВНОСТЬ ДЛЯ ДЕСКТОПА
  @media (min-width: 768px) 
    .bookmarks-sheet 
      border-radius: 16px
      height: 70vh
      max-height: 600px
      margin: 20px
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3)
      
      .sheet-header 
        .sheet-handle 
          display: none
  
  // СКРЫТЬ САЙДБАР НА МОБИЛЬНЫХ
  @media (max-width: 767px) 
    .sidebar 
      display: none !important
  
  @media (min-width: 768px) 
    .mobile-header 
      display: none !important
</style>