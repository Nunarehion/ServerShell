<script>
  import { onMount, tick } from 'svelte';
  import SideBar from "$lib/components/sidebar/SideBar.svelte";
  import LinkItem from "$lib/components/sidebar/LinkItem.svelte";
  import { invalidateAll } from "$app/navigation";
  
  let {data, children} = $props();
  
  // Состояния для панели закладок
  let isBookmarksOpen = $state(false);
  let isMobile = $state(false);
  let layoutMessage = '';
  let newBookmarkUrl = $state('');
  let newBookmarkTitle = $state('');
  let activeTab = $state('all'); // 'all', 'frequent', 'recent'
  let searchQuery = $state('');
  
  // Определение мобильного устройства
  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });
  
  function checkMobile() {
    isMobile = window.innerWidth < 768;
  }
  
  // Обработчики панели
  function openBookmarksPanel() {
    isBookmarksOpen = true;
    // Блокируем скролл body при открытой панели
    document.body.style.overflow = 'hidden';
  }
  
  function closeBookmarksPanel() {
    isBookmarksOpen = false;
    document.body.style.overflow = '';
  }
  
  // Обработчик клика вне панели
  function handleBackdropClick(event) {
    if (event.target.classList.contains('bookmarks-overlay')) {
      closeBookmarksPanel();
    }
  }
  
  // Добавление закладки
  async function addBookmark() {
    if (!newBookmarkUrl.trim()) return;
    
    try {
      // Добавляем https:// если нет протокола
      let url = newBookmarkUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          title: newBookmarkTitle || getDomainFromUrl(url)
        })
      });
      
      if (response.ok) {
        showNotification('Закладка добавлена!');
        newBookmarkUrl = '';
        newBookmarkTitle = '';
        invalidateAll();
      }
    } catch (error) {
      showNotification('Ошибка при добавлении', 'error');
      console.error('Ошибка добавления:', error);
    }
  }
  
  // Добавить текущую страницу
  function addCurrentPage() {
    newBookmarkUrl = window.location.href;
    newBookmarkTitle = document.title;
    addBookmark();
  }
  
  // Удаление закладки
  async function removeBookmark(id) {
    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showNotification('Закладка удалена');
        invalidateAll();
      }
    } catch (error) {
      showNotification('Ошибка при удалении', 'error');
      console.error('Ошибка удаления:', error);
    }
  }
  
  // Показать уведомление
  function showNotification(message, type = 'success') {
    layoutMessage = message;
    setTimeout(() => (layoutMessage = ""), 3000);
  }
  
  // Вспомогательные функции
  function getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.split('/')[2] || url;
    }
  }
  
  function getFaviconUrl(url) {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return '';
    }
  }
  
  function formatUrl(url) {
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  }
  
  // Отфильтрованные закладки
  const filteredBookmarks = $derived(() => {
    if (!data.bookmarks) return [];
    
    let filtered = [...data.bookmarks];
    
    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        (b.title?.toLowerCase().includes(query)) ||
        (b.url?.toLowerCase().includes(query))
      );
    }
    
    // Сортировка по частоте использования (можно добавить логику позже)
    if (activeTab === 'frequent') {
      filtered.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
    }
    
    // Сортировка по дате добавления
    if (activeTab === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    
    return filtered;
  });
  
  // Обработчик нажатия клавиш
  onMount(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        isBookmarksOpen ? closeBookmarksPanel() : openBookmarksPanel();
      }
      if (e.key === 'Escape' && isBookmarksOpen) {
        closeBookmarksPanel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="layout">
  <!-- Сайдбар -->
  <SideBar class="sidebar" onSaveSuccess={(msg) => showNotification(msg)}>
    <hr style="margin: 1rem 0;" />
    <LinkItem url="/" icon="/icon-atom.svg"></LinkItem>
    <hr style="margin: 1rem 0;" />
    
    <!-- Кнопка открытия панели закладок -->
    <button 
      class="bookmarks-trigger"
      on:click={openBookmarksPanel}
      aria-label="Показать закладки"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 7H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 12H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 17H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Закладки</span>
      {#if data.bookmarks?.length > 0}
        <span class="bookmark-count">{data.bookmarks.length}</span>
      {/if}
    </button>
    
    <!-- Быстрые закладки в сайдбаре (для десктопа) -->
    {#if !isMobile && data.bookmarks?.length > 0}
      <div class="quick-bookmarks">
        <div class="quick-bookmarks-title">Частые</div>
        <div class="quick-bookmarks-grid">
          {#each data.bookmarks.slice(0, 4) as bookmark}
            <a 
              href={bookmark.url} 
              class="quick-bookmark"
              title={bookmark.title || bookmark.url}
            >
              <img 
                src={getFaviconUrl(bookmark.url)} 
                alt="" 
                
              />
            </a>
          {/each}
        </div>
      </div>
    {/if}
    
    <div class="items">
      <LinkItem url="/files" icon="/icon-folder.svg"></LinkItem>
    </div>
  </SideBar>

  <!-- Основной контент -->
  <main class="content-area">
    <!-- Хедер с быстрыми закладками для десктопа -->
    {#if !isMobile && data.bookmarks?.length > 0}
      <header>
        <div class="header-bookmarks">
          {#each data.bookmarks.slice(0, 8) as bookmark}
            <a 
              href={bookmark.url}
              class="header-bookmark"
              title={bookmark.title || formatUrl(bookmark.url)}
            >
              <img 
                src={getFaviconUrl(bookmark.url)} 
                alt=""
                
              />
              <span class="favicon-fallback">
                {getDomainFromUrl(bookmark.url).charAt(0).toUpperCase()}
              </span>
            </a>
          {/each}
          
          {#if data.bookmarks.length > 8}
            <div 
              class="more-bookmarks"
              on:click={openBookmarksPanel}
              title="Показать все закладки"
            >
              <span>+{data.bookmarks.length - 8}</span>
            </div>
          {/if}
          
          <button 
            class="add-bookmark-btn"
            on:click={addCurrentPage}
            title="Добавить текущую страницу"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </header>
    {/if}
    
    <!-- Плавающая кнопка для мобильных -->
    {#if isMobile}
      <button 
        class="floating-bookmark-btn"
        on:click={openBookmarksPanel}
        aria-label="Показать закладки"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 7H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M7 12H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M7 17H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        {#if data.bookmarks?.length > 0}
          <span class="floating-badge">{data.bookmarks.length}</span>
        {/if}
      </button>
    {/if}
    
    <!-- Уведомления -->
    {#if layoutMessage}
      <div class="layout-notification">{layoutMessage}</div>
    {/if}
    
    <!-- Основной контент страницы -->
    {@render children()}
  </main>
</div>

<!-- iOS-стильная выдвижная панель закладок -->
<div 
  class="bookmarks-overlay {isBookmarksOpen ? 'visible' : ''}"
  on:click={handleBackdropClick}
  class:visible={isBookmarksOpen}
>
  <div 
    class="bookmarks-sheet {isBookmarksOpen ? 'open' : ''}"
    class:open={isBookmarksOpen}
  >
    <!-- Хедер панели -->
    <div class="sheet-header">
      <div class="sheet-handle"></div>
      <div class="sheet-title">
        <h3>Закладки</h3>
        {#if data.bookmarks?.length > 0}
          <span class="bookmarks-total">{data.bookmarks.length}</span>
        {/if}
      </div>
      <button 
        class="sheet-close"
        on:click={closeBookmarksPanel}
        aria-label="Закрыть"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    
    <!-- Форма добавления -->
    <div class="add-bookmark-form">
      <div class="input-group">
        <input
          type="text"
          placeholder="https://example.com"
          bind:value={newBookmarkUrl}
          on:keydown={(e) => e.key === 'Enter' && addBookmark()}
        />
        <input
          type="text"
          placeholder="Название (необязательно)"
          bind:value={newBookmarkTitle}
          on:keydown={(e) => e.key === 'Enter' && addBookmark()}
        />
      </div>
      <div class="form-actions">
        <button 
          class="btn-secondary"
          on:click={addCurrentPage}
        >
          Добавить текущую
        </button>
        <button 
          class="btn-primary"
          on:click={addBookmark}
          disabled={!newBookmarkUrl.trim()}
        >
          Добавить
        </button>
      </div>
    </div>
    
    <!-- Табы фильтрации -->
    <div class="bookmarks-tabs">
      <button 
        class="tab {activeTab === 'all' ? 'active' : ''}"
        on:click={() => activeTab = 'all'}
      >
        Все
      </button>
      <button 
        class="tab {activeTab === 'frequent' ? 'active' : ''}"
        on:click={() => activeTab = 'frequent'}
      >
        Частые
      </button>
      <button 
        class="tab {activeTab === 'recent' ? 'active' : ''}"
        on:click={() => activeTab = 'recent'}
      >
        Недавние
      </button>
    </div>
    
    <!-- Поиск -->
    <div class="bookmarks-search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 21L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="2"/>
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
          aria-label="Очистить поиск"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      {/if}
    </div>
    
    <!-- Список закладок -->
    <div class="bookmarks-list">
      {#if filteredBookmarks.length === 0}
        <div class="empty-state">
          {#if searchQuery}
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L15 15" stroke="var(--clr-gray)" stroke-width="2" stroke-linecap="round"/>
              <circle cx="10" cy="10" r="7" stroke="var(--clr-gray)" stroke-width="2"/>
            </svg>
            <p>Ничего не найдено</p>
            <button 
              class="btn-text"
              on:click={() => searchQuery = ''}
            >
              Очистить поиск
            </button>
          {:else}
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" 
                    stroke="var(--clr-gray)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 7H17" stroke="var(--clr-gray)" stroke-width="2" stroke-linecap="round"/>
              <path d="M7 12H14" stroke="var(--clr-gray)" stroke-width="2" stroke-linecap="round"/>
              <path d="M7 17H11" stroke="var(--clr-gray)" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>Пока нет закладок</p>
            <p class="empty-subtitle">Добавьте свою первую закладку</p>
          {/if}
        </div>
      {:else}
        {#each filteredBookmarks as bookmark}
          <div class="bookmark-item">
            <a 
              href={bookmark.url} 
              class="bookmark-link"
              target="_blank"
              rel="noopener"
            >
              <div class="bookmark-icon">
                <img 
                  src={getFaviconUrl(bookmark.url)} 
                  alt=""
                  
                    
                />
                <div class="icon-fallback">
                  {getDomainFromUrl(bookmark.url).charAt(0).toUpperCase()}
                </div>
              </div>
              <div class="bookmark-info">
                <div class="bookmark-title">
                  {bookmark.title || formatUrl(bookmark.url)}
                </div>
                <div class="bookmark-url">
                  {formatUrl(bookmark.url)}
                </div>
              </div>
            </a>
            <div class="bookmark-actions">
              <button 
                class="action-btn"
                on:click={() => window.open(bookmark.url, '_blank')}
                title="Открыть в новой вкладке"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 3H21V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button 
                class="action-btn delete"
                on:click={() => removeBookmark(bookmark.id)}
                title="Удалить закладку"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 21 17 21H7C6.46957 21 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
    
    <!-- Футер панели -->
    <div class="sheet-footer">
      <div class="footer-info">
        {#if filteredBookmarks.length === data.bookmarks?.length}
          Всего закладок: {data.bookmarks?.length || 0}
        {:else}
          Найдено: {filteredBookmarks.length} из {data.bookmarks?.length}
        {/if}
      </div>
      <div class="footer-actions">
        <button 
          class="btn-text"
          on:click={() => {
            searchQuery = '';
            activeTab = 'all';
          }}
        >
          Сбросить фильтры
        </button>
      </div>
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
  
  :global(:root) 
    font-size: 10px
    // Цвета в стиле iOS
    --ios-bg: #f2f2f7
    --ios-surface: #ffffff
    --ios-surface-secondary: #f2f2f7
    --ios-text: #000000
    --ios-text-secondary: #8e8e93
    --ios-border: #c6c6c8
    --ios-blue: #007aff
    --ios-red: #ff3b30
    --ios-gray: #8e8e93
    --ios-light-gray: #d1d1d6
    
    // Адаптация под вашу темную тему
    --dark-bg: #000000
    --dark-surface: #1c1c1e
    --dark-surface-secondary: #2c2c2e
    --dark-text: #ffffff
    --dark-text-secondary: #8e8e93
    --dark-border: #38383a
    --dark-blue: #0a84ff
    --dark-red: #ff453a
    
    // Переменные размеров
    --sidebar-width: 76px
    --header-height: 60px
  
  :global(body) 
    background-color: var(--dark-bg)
    color: var(--dark-text)
    max-width: 100vw
    width: 100vw
    width: 100dvw
    height: 100vh
    height: 100dvh
    height: 100svh
    overflow: hidden
  
  :global(hr) 
    border: none
    height: 0.5px
    background: var(--dark-border)
  
  // ===== ОСНОВНОЙ ЛЕЙАУТ =====
  .layout 
    display: grid
    width: 100%
    height: 100%
    grid-template-columns: var(--sidebar-width) 1fr
    background: var(--dark-bg)
    
    .content-area 
      grid-column: 2 / 3
      overflow-y: auto
      position: relative
    
    .items 
      display: grid
      gap: 0.5rem
      padding: 1rem
      background: var(--dark-surface-secondary)
  
  // ===== ХЕДЕР =====
  header 
    position: sticky
    top: 0
    height: var(--header-height)
    background: var(--dark-surface)
    border-bottom: 0.5px solid var(--dark-border)
    display: flex
    align-items: center
    padding: 0 1rem
    z-index: 100
    
    .header-bookmarks 
      display: flex
      align-items: center
      gap: 8px
      flex: 1
      
      .header-bookmark 
        width: 36px
        height: 36px
        display: flex
        align-items: center
        justify-content: center
        border-radius: 8px
        background: var(--dark-surface-secondary)
        transition: transform 0.2s ease
        position: relative
        
        &:hover 
          transform: translateY(-2px)
          background: var(--dark-border)
        
        img 
          width: 20px
          height: 20px
          border-radius: 4px
        
        .favicon-fallback 
          display: none
          width: 20px
          height: 20px
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
          border-radius: 4px
          color: white
          font-size: 1.2rem
          font-weight: 600
          align-items: center
          justify-content: center
      
      .more-bookmarks 
        width: 36px
        height: 36px
        display: flex
        align-items: center
        justify-content: center
        background: var(--dark-surface-secondary)
        border-radius: 8px
        color: var(--dark-text-secondary)
        font-size: 1.2rem
        cursor: pointer
        transition: background 0.2s
        
        &:hover 
          background: var(--dark-border)
      
      .add-bookmark-btn 
        width: 36px
        height: 36px
        background: var(--dark-blue)
        border: none
        border-radius: 8px
        color: white
        display: flex
        align-items: center
        justify-content: center
        cursor: pointer
        transition: background 0.2s
        
        &:hover 
          background: lighten(#0a84ff, 10%)
        
        &:disabled 
          opacity: 0.5
          cursor: not-allowed
  
  // ===== КНОПКА В САЙДБАРЕ =====
  .bookmarks-trigger 
    display: flex
    align-items: center
    gap: 10px
    padding: 12px
    background: var(--dark-surface-secondary)
    border: none
    border-radius: 10px
    color: var(--dark-text)
    cursor: pointer
    width: 100%
    transition: all 0.2s ease
    margin: 1rem 0
    
    &:hover 
      background: var(--dark-border)
      transform: translateX(2px)
    
    svg 
      flex-shrink: 0
    
    span 
      font-size: 1.3rem
      white-space: nowrap
    
    .bookmark-count 
      margin-left: auto
      background: var(--dark-blue)
      color: white
      font-size: 1.1rem
      padding: 2px 6px
      border-radius: 10px
      min-width: 20px
      text-align: center
  
  // ===== БЫСТРЫЕ ЗАКЛАДКИ В САЙДБАРЕ =====
  .quick-bookmarks 
    padding: 0.5rem
    
    .quick-bookmarks-title 
      font-size: 1.1rem
      color: var(--dark-text-secondary)
      margin-bottom: 8px
      padding-left: 4px
    
    .quick-bookmarks-grid 
      display: grid
      grid-template-columns: repeat(2, 1fr)
      gap: 6px
      
      .quick-bookmark 
        width: 100%
        aspect-ratio: 1
        display: flex
        align-items: center
        justify-content: center
        background: var(--dark-surface-secondary)
        border-radius: 8px
        transition: transform 0.2s
        
        &:hover 
          transform: scale(1.05)
          background: var(--dark-border)
        
        img 
          width: 60%
          height: 60%
          object-fit: contain
          border-radius: 4px
  
  // ===== ПЛАВАЮЩАЯ КНОПКА (МОБИЛЬНАЯ) =====
  .floating-bookmark-btn 
    position: fixed
    bottom: 20px
    right: 20px
    width: 60px
    height: 60px
    border-radius: 30px
    background: var(--dark-blue)
    border: none
    color: white
    cursor: pointer
    box-shadow: 0 4px 20px rgba(10, 132, 255, 0.3)
    display: flex
    align-items: center
    justify-content: center
    z-index: 900
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
    
    &:hover 
      transform: scale(1.1)
      box-shadow: 0 6px 25px rgba(10, 132, 255, 0.4)
    
    &:active 
      transform: scale(0.95)
    
    .floating-badge 
      position: absolute
      top: -4px
      right: -4px
      background: var(--dark-red)
      color: white
      font-size: 1rem
      font-weight: 600
      width: 20px
      height: 20px
      border-radius: 50%
      display: flex
      align-items: center
      justify-content: center
  
  // ===== ВЫДВИЖНАЯ ПАНЕЛЬ (iOS-СТИЛЬ) =====
  .bookmarks-overlay 
    position: fixed
    top: 0
    left: 0
    right: 0
    bottom: 0
    background: rgba(0, 0, 0, 0)
    backdrop-filter: blur(0px)
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
      backdrop-filter: blur(4px)
  
  .bookmarks-sheet 
    width: 100%
    max-width: 600px
    height: 85vh
    max-height: 85vh
    background: var(--dark-surface)
    border-radius: 20px 20px 0 0
    display: flex
    flex-direction: column
    transform: translateY(100%)
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)
    
    &.open 
      transform: translateY(0)
    
    // Хедер панели
    .sheet-header 
      padding: 16px 20px 8px
      border-bottom: 0.5px solid var(--dark-border)
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
        background: var(--dark-border)
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
        
        .bookmarks-total 
          background: var(--dark-surface-secondary)
          color: var(--dark-text-secondary)
          font-size: 1.2rem
          padding: 2px 8px
          border-radius: 10px
      
      .sheet-close 
        width: 36px
        height: 36px
        border: none
        background: none
        color: var(--dark-text-secondary)
        cursor: pointer
        border-radius: 8px
        display: flex
        align-items: center
        justify-content: center
        transition: background 0.2s
        
        &:hover 
          background: var(--dark-surface-secondary)
    
    // Форма добавления
    .add-bookmark-form 
      padding: 16px 20px
      border-bottom: 0.5px solid var(--dark-border)
      
      .input-group 
        display: flex
        flex-direction: column
        gap: 8px
        margin-bottom: 12px
        
        input 
          padding: 12px
          background: var(--dark-surface-secondary)
          border: 0.5px solid var(--dark-border)
          border-radius: 10px
          color: var(--dark-text)
          font-size: 1.4rem
          transition: border-color 0.2s
          
          &:focus 
            outline: none
            border-color: var(--dark-blue)
          
          &::placeholder 
            color: var(--dark-text-secondary)
      
      .form-actions 
        display: flex
        gap: 8px
        
        button 
          flex: 1
          padding: 12px
          border: none
          border-radius: 10px
          font-size: 1.4rem
          font-weight: 500
          cursor: pointer
          transition: all 0.2s
          
          &.btn-secondary 
            background: var(--dark-surface-secondary)
            color: var(--dark-text)
            
            &:hover 
              background: var(--dark-border)
          
          &.btn-primary 
            background: var(--dark-blue)
            color: white
            
            &:hover 
              background: lighten(#0a84ff, 10%)
            
            &:disabled 
              opacity: 0.5
              cursor: not-allowed
    
    // Табы
    .bookmarks-tabs 
      display: flex
      padding: 12px 20px
      border-bottom: 0.5px solid var(--dark-border)
      gap: 4px
      
      .tab 
        flex: 1
        padding: 8px 12px
        border: none
        background: none
        color: var(--dark-text-secondary)
        font-size: 1.4rem
        font-weight: 500
        cursor: pointer
        border-radius: 8px
        transition: all 0.2s
        
        &:hover 
          background: var(--dark-surface-secondary)
        
        &.active 
          background: var(--dark-blue)
          color: white
    
    // Поиск
    .bookmarks-search 
      padding: 16px 20px
      position: relative
      border-bottom: 0.5px solid var(--dark-border)
      
      svg 
        position: absolute
        left: 32px
        top: 50%
        transform: translateY(-50%)
        color: var(--dark-text-secondary)
      
      input 
        width: 100%
        padding: 12px 40px 12px 40px
        background: var(--dark-surface-secondary)
        border: none
        border-radius: 10px
        color: var(--dark-text)
        font-size: 1.4rem
        
        &:focus 
          outline: none
        
        &::placeholder 
          color: var(--dark-text-secondary)
      
      .clear-search 
        position: absolute
        right: 32px
        top: 50%
        transform: translateY(-50%)
        width: 24px
        height: 24px
        border: none
        background: none
        color: var(--dark-text-secondary)
        cursor: pointer
        display: flex
        align-items: center
        justify-content: center
        
        &:hover 
          color: var(--dark-text)
    
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
        height: 300px
        color: var(--dark-text-secondary)
        text-align: center
        
        svg 
          margin-bottom: 16px
          opacity: 0.5
        
        p 
          font-size: 1.6rem
          margin: 8px 0
        
        .empty-subtitle 
          font-size: 1.3rem
          color: var(--dark-text-secondary)
        
        .btn-text 
          margin-top: 16px
          padding: 8px 16px
          background: none
          border: none
          color: var(--dark-blue)
          font-size: 1.4rem
          cursor: pointer
          
          &:hover 
            text-decoration: underline
      
      .bookmark-item 
        display: flex
        align-items: center
        padding: 12px 0
        border-bottom: 0.5px solid var(--dark-border)
        
        &:last-child 
          border-bottom: none
        
        .bookmark-link 
          display: flex
          align-items: center
          flex: 1
          gap: 12px
          text-decoration: none
          color: inherit
          
          &:hover 
            .bookmark-title 
              color: var(--dark-blue)
        
        .bookmark-icon 
          width: 40px
          height: 40px
          flex-shrink: 0
          border-radius: 8px
          background: var(--dark-surface-secondary)
          display: flex
          align-items: center
          justify-content: center
          
          img 
            width: 24px
            height: 24px
            border-radius: 4px
          
          .icon-fallback 
            display: none
            width: 24px
            height: 24px
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
            border-radius: 6px
            color: white
            font-size: 1.4rem
            font-weight: 600
            align-items: center
            justify-content: center
        
        .bookmark-info 
          flex: 1
          overflow: hidden
          
          .bookmark-title 
            font-size: 1.5rem
            font-weight: 500
            margin-bottom: 2px
            white-space: nowrap
            overflow: hidden
            text-overflow: ellipsis
            transition: color 0.2s
          
          .bookmark-url 
            font-size: 1.3rem
            color: var(--dark-text-secondary)
            white-space: nowrap
            overflow: hidden
            text-overflow: ellipsis
        
        .bookmark-actions 
          display: flex
          gap: 4px
          opacity: 0
          transition: opacity 0.2s
          
          .bookmark-item:hover &
            opacity: 1
          
          .action-btn 
            width: 36px
            height: 36px
            border: none
            background: var(--dark-surface-secondary)
            color: var(--dark-text-secondary)
            border-radius: 8px
            cursor: pointer
            display: flex
            align-items: center
            justify-content: center
            transition: all 0.2s
            
            &:hover 
              background: var(--dark-border)
              color: var(--dark-text)
            
            &.delete:hover 
              background: var(--dark-red)
              color: white
    
    // Футер панели
    .sheet-footer 
      padding: 12px 20px
      border-top: 0.5px solid var(--dark-border)
      display: flex
      align-items: center
      justify-content: space-between
      
      .footer-info 
        font-size: 1.3rem
        color: var(--dark-text-secondary)
      
      .footer-actions 
        .btn-text 
          padding: 8px 12px
          background: none
          border: none
          color: var(--dark-blue)
          font-size: 1.4rem
          cursor: pointer
          border-radius: 8px
          
          &:hover 
            background: var(--dark-surface-secondary)
  
  // ===== УВЕДОМЛЕНИЯ =====
  .layout-notification 
    position: fixed
    top: 20px
    left: 50%
    transform: translateX(-50%)
    background: var(--dark-blue)
    color: white
    padding: 12px 24px
    border-radius: 10px
    font-size: 1.4rem
    font-weight: 500
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)
    z-index: 1100
    animation: slideIn 0.3s ease
    
    @keyframes slideIn 
      from 
        opacity: 0
        transform: translateX(-50%) translateY(-20px)
      to 
        opacity: 1
        transform: translateX(-50%) translateY(0)
  
  // ===== АДАПТИВНОСТЬ =====
  @media (max-width: 767px) 
    .layout 
      grid-template-columns: 1fr
      
      .content-area 
        grid-column: 1 / 2
    
    header 
      left: 0
    
    .bookmarks-sheet 
      height: 90vh
      max-height: 90vh
      
      .bookmarks-list 
        .bookmark-item 
          .bookmark-actions 
            opacity: 1 // Всегда показываем на мобильных
  
  @media (min-width: 768px) 
    .bookmarks-sheet 
      border-radius: 16px
      height: 80vh
      max-height: 80vh
      
      .sheet-header 
        .sheet-handle 
          display: none
  
  // ===== АНИМАЦИИ =====
  @keyframes fadeIn 
    from 
      opacity: 0
    to 
      opacity: 1
  
  @keyframes slideUp 
    from 
      transform: translateY(20px)
      opacity: 0
    to 
      transform: translateY(0)
      opacity: 1
  
  .bookmark-item 
    animation: fadeIn 0.3s ease forwards
    
</style>