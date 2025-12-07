<script>
  import { onMount } from 'svelte';
  import SideBar from "$lib/components/sidebar/SideBar.svelte";
  import LinkItem from "$lib/components/sidebar/LinkItem.svelte";
  import { invalidateAll } from "$app/navigation";
  
  let {data, children} = $props();
  
  // Состояние панели закладок
  let showBookmarks = $state(false);
  let isMobile = $state(false);
  let layoutMessage = '';
  
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
        showBookmarks = false; // Закрываем панель после добавления
      }
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  }
  
  // Удалить закладку
  async function removeBookmark(id, event) {
    event.stopPropagation(); // Чтобы не открывать ссылку
    event.preventDefault();
    
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
</script>

<div class="layout">
  <!-- Сайдбар (скрываем на мобильных) -->
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

  <main class="content-area">
    <!-- Кнопка открытия закладок (для мобильных) -->
    {#if isMobile}
      <button class="mobile-bookmarks-toggle" on:click={() => showBookmarks = !showBookmarks}>
        {#if showBookmarks}
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        {:else}
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
        {/if}
        Закладки ({data.bookmarks?.length || 0})
      </button>
    {/if}
    
    <!-- Панель закладок для мобильных (поверх контента) -->
    {#if isMobile && showBookmarks}
      <div class="mobile-bookmarks-panel">
        <div class="bookmarks-header">
          <h3>Закладки</h3>
          <button on:click={addCurrentPage} class="add-btn">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Добавить
          </button>
        </div>
        
        <div class="bookmarks-list">
          {#each data.bookmarks as bookmark}
            <div class="bookmark-item">
              <a href={bookmark.url} class="bookmark-link">
                <span class="bookmark-title">
                  {bookmark.title || bookmark.url.split('/').at(-1)}
                </span>
                <span class="bookmark-url">
                  {bookmark.url.replace(/^https?:\/\//, '').split('/')[0]}
                </span>
              </a>
              <button 
                class="remove-btn"
                on:click={(e) => removeBookmark(bookmark.id, e)}
                title="Удалить"
              >
                ×
              </button>
            </div>
          {:else}
            <div class="empty-bookmarks">
              Нет закладок
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Панель закладок для десктопа (в сайдбаре) -->
    {#if !isMobile}
      <div class="desktop-bookmarks">
        <div class="bookmarks-header">
          <h3>Закладки</h3>
          <button on:click={addCurrentPage} class="add-btn" title="Добавить текущую страницу">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>
        
        <div class="bookmarks-list">
          {#each data.bookmarks as bookmark}
            <div class="bookmark-item">
              <a href={bookmark.url} class="bookmark-link">
                <span class="bookmark-title">
                  {bookmark.title || bookmark.url.split('/').at(-1)}
                </span>
                <span class="bookmark-url">
                  {bookmark.url.replace(/^https?:\/\//, '').split('/')[0]}
                </span>
              </a>
              <button 
                class="remove-btn"
                on:click={(e) => removeBookmark(bookmark.id, e)}
                title="Удалить"
              >
                ×
              </button>
            </div>
          {:else}
            <div class="empty-bookmarks">
              Нет закладок
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Основной контент страницы -->
    {@render children()}
    
    <!-- Простое уведомление (если нужно) -->
    {#if layoutMessage}
      <div class="simple-notification">{layoutMessage}</div>
    {/if}
  </main>
</div>

<style lang="stylus">
  // ===== БАЗОВЫЕ СТИЛИ (из вашего кода) =====
  :global(*) 
    box-sizing: border-box
  
  :global(body) 
    margin: 0
    padding: 0
  
  :global(:root) 
    font-size: 10px
    // Цвета
    --second-bg: #17181f
    --dark-bg: #101218
    --light-bg: #1d1e26
    --clr-gray: #adafb8
    --clr-white: white
    --clr-red: #e11d48
    --clr-hover: #2f2d39
    --clr-blue: #3b82f6
    
    // Размеры
    --sidebar-width: 76px
  
  :global(body) 
    background-color: var(--light-bg)
    max-width: 100vw
    width: 100vw
    width: 100dvw
    height: 100vh
    height: 100dvh
    height: 100svh
    font-family: sans-serif
    box-sizing: border-box
    overflow: hidden
  
  :global(hr) 
    border: none
    height: 0.5px
    background: var(--clr-gray)
  
  :global(button) 
    display: flex
    align-items: center
    justify-content: center
    font-weight: 300
    padding: 0.5rem
    background: none
    box-shadow: 0 0 1px #ffffff88
    border: none
    border-radius: 0.25rem
    color: #ffffff88
    height: 100%
    text-transform: uppercase
  
  // ===== ОСНОВНОЙ ЛЕЙАУТ =====
  .layout 
    display: grid
    width: 100%
    height: 100%
    
    // На десктопе: сайдбар + контент
    @media (min-width: 768px) 
      grid-template-columns: var(--sidebar-width) 1fr
    
    // На мобильных: только контент
    @media (max-width: 767px) 
      grid-template-columns: 1fr
  
  .content-area 
    position: relative
    height: 100%
    overflow-y: auto
    
    @media (min-width: 768px) 
      grid-column: 2 / 3
      padding: 1rem
    
    @media (max-width: 767px) 
      grid-column: 1 / 2
  
  .items 
    display: grid
    gap: 0.5rem
    padding: 1rem
    background: var(--light-bg)
  
  // ===== МОБИЛЬНАЯ ПАНЕЛЬ ЗАКЛАДОК =====
  .mobile-bookmarks-toggle 
    position: fixed
    top: 10px
    left: 10px
    background: var(--dark-bg)
    color: var(--clr-white)
    border: 1px solid var(--clr-gray)
    border-radius: 8px
    padding: 8px 12px
    display: flex
    align-items: center
    gap: 8px
    z-index: 100
    font-size: 1.2rem
    
    &:hover 
      background: var(--clr-hover)
    
    svg 
      flex-shrink: 0
  
  .mobile-bookmarks-panel 
    position: fixed
    top: 0
    left: 0
    right: 0
    bottom: 0
    background: var(--dark-bg)
    z-index: 90
    padding: 20px
    overflow-y: auto
    padding-top: 60px // Чтобы не перекрывалось кнопкой
    
    .bookmarks-header 
      display: flex
      justify-content: space-between
      align-items: center
      margin-bottom: 20px
      
      h3 
        margin: 0
        color: var(--clr-white)
        font-size: 1.8rem
      
      .add-btn 
        background: var(--clr-blue)
        color: white
        border: none
        border-radius: 6px
        padding: 8px 12px
        display: flex
        align-items: center
        gap: 6px
        font-size: 1.2rem
        
        &:hover 
          background: darken(#3b82f6, 10%)
  
  // ===== ДЕСКТОПНАЯ ПАНЕЛЬ ЗАКЛАДОК =====
  .desktop-bookmarks 
    position: fixed
    top: 0
    left: var(--sidebar-width)
    width: 300px
    height: 100%
    background: var(--dark-bg)
    border-right: 1px solid var(--clr-gray)
    padding: 1rem
    overflow-y: auto
    
    .bookmarks-header 
      display: flex
      justify-content: space-between
      align-items: center
      margin-bottom: 1rem
      
      h3 
        margin: 0
        color: var(--clr-white)
        font-size: 1.6rem
      
      .add-btn 
        background: none
        border: none
        color: var(--clr-blue)
        cursor: pointer
        padding: 4px
        border-radius: 4px
        
        &:hover 
          background: var(--clr-hover)
  
  // ===== ОБЩИЕ СТИЛИ ДЛЯ ЗАКЛАДОК =====
  .bookmarks-list 
    display: flex
    flex-direction: column
    gap: 8px
  
  .bookmark-item 
    display: flex
    align-items: center
    background: var(--light-bg)
    border-radius: 6px
    padding: 8px
    transition: background 0.2s
    
    &:hover 
      background: var(--clr-hover)
    
    .bookmark-link 
      flex: 1
      display: flex
      flex-direction: column
      text-decoration: none
      color: inherit
      padding-right: 8px
      
      .bookmark-title 
        color: var(--clr-white)
        font-size: 1.3rem
        margin-bottom: 2px
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis
      
      .bookmark-url 
        color: var(--clr-gray)
        font-size: 1.1rem
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis
    
    .remove-btn 
      background: none
      border: none
      color: var(--clr-gray)
      font-size: 1.8rem
      width: 24px
      height: 24px
      cursor: pointer
      border-radius: 4px
      display: flex
      align-items: center
      justify-content: center
      
      &:hover 
        background: var(--clr-red)
        color: white
  
  .empty-bookmarks 
    text-align: center
    color: var(--clr-gray)
    padding: 20px
    font-size: 1.4rem
  
  // ===== ПРОСТОЕ УВЕДОМЛЕНИЕ =====
  .simple-notification 
    position: fixed
    bottom: 20px
    right: 20px
    background: var(--clr-blue)
    color: white
    padding: 8px 16px
    border-radius: 6px
    font-size: 1.2rem
    animation: fadeInOut 3s ease
    
    @keyframes fadeInOut 
      0%, 100% 
        opacity: 0
        transform: translateY(10px)
      10%, 90% 
        opacity: 1
        transform: translateY(0)
  
  // ===== АДАПТИВНОСТЬ =====
  @media (max-width: 767px) 
    .sidebar 
      display: none
  
  @media (min-width: 768px) 
    .mobile-bookmarks-toggle 
      display: none
</style>