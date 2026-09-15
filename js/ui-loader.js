async function loadComponent(id, file) {
    const element = document.getElementById(id);

    if (!element) return;

    try {
      const response = await fetch(file);

      if (!response.ok) {
          console.error(`Failed to load ${file}: ${response.status}`);
          return;
      }

      element.innerHTML = await response.text();
      updateNavState();
    } catch (error) {
      console.error(`Failed to load ${file}`, error);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    loadComponent("nav", "/components/nav.html");
    loadComponent("sidebar", "/components/sidebar.html");
});

