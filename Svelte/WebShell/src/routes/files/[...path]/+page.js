export async function load({ params, fetch }) {
  const currentPath = params.path || "";
  const apiPath = `/api/files?path=/${encodeURIComponent(currentPath)}`;

  const response = await fetch(apiPath);

  if (response.ok) {
    const data = await response.json();
    return {
      files: data.files,
      currentPath: data.currentPath,
    };
  } else {
    const error = await response.json();
    throw new Error(error.error || "Failed to load directory");
  }
}