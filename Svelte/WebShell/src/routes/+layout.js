export async function load({ fetch }) {
    const response = await fetch('/api/bookmarks');
    if (response.ok) {
        const bookmarks = await response.json();
        return { bookmarks };
    }
    return { bookmarks: [] };
}