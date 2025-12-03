<script>
  import { page } from "$app/stores";

  let { onSaveSuccess, children } = $props();

  async function saveCurrentUrl() {
    const currentUrl = $page.url.pathname;
    if (currentUrl === "/") {
      alert("Нельзя сохранить корневой URL.");
      return;
    }

    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
      });

      if (response.ok) {
        if (onSaveSuccess) onSaveSuccess("URL сохранен!");
      } else {
        const result = await response.json();
        alert(`Ошибка сохранения: ${result.error}`);
      }
    } catch (error) {
      alert(`Ошибка сети: ${error.message}`);
    }
  }
</script>


<div class="sidebar">
  {@render children()}
  <button
    class="add-bookmark-button"
    on:click={saveCurrentUrl}
    title="Сохранить текущий URL как закладку"
  >
    +
  </button>
</div>

<style lang="stylus">
    .sidebar
        background: var(--second-bg)
        height: 100%
        width: 100%
        padding: 1rem
    .add-bookmark-button {
        width: 100%;
        height: 3 rem;
        margin-top: 1rem;
        margin-bottom: auto
    }
</style>
