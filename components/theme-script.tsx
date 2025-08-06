// components/theme-script.tsx

export function ThemeScript() {
  const codeToRunBeforeHydration = `
    (function() {
      try {
        const theme = localStorage.getItem("theme") || "light";
        document.documentElement.classList.add(theme);
        document.documentElement.style.colorScheme = theme;
      } catch (_) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: codeToRunBeforeHydration }} />;
}
