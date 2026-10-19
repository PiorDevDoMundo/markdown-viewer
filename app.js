(() => {
  "use strict";

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_EXTENSION = /\.(md|markdown|mdown|txt)$/i;
  const $ = (id) => document.getElementById(id);
  const input = $("fileInput");
  const welcome = $("welcome");
  const viewer = $("viewer");
  const content = $("markdownContent");
  const toc = $("tableOfContents");
  const overlay = $("dropOverlay");
  const toast = $("toast");

  let markdownSource = "";
  let dragDepth = 0;
  let toastTimer;
  let headingObserver;

  const EXAMPLE = `# Um lugar para suas ideias

Bem-vindo ao **md.**, um espaço simples para ler arquivos Markdown com tranquilidade.

## O que é Markdown?

Markdown é uma forma leve de formatar textos usando caracteres simples. Ele funciona muito bem para **documentações**, anotações e arquivos README.

### Formatação básica

Você pode escrever em **negrito**, *itálico*, usar [links](https://www.markdownguide.org/) ou destacar \`trechos de código\`.

> A melhor interface é aquela que deixa o conteúdo falar.

### Listas e tarefas

- [x] Arrastar um arquivo .md
- [x] Visualizar o conteúdo instantaneamente
- [x] Navegar pelos títulos do documento
- [ ] Escrever algo incrível

## Código

\`\`\`javascript
function saudacao(nome) {
  return \`Olá, \${nome}!\`;
}
\`\`\`

## Tabelas

| Recurso | Disponível |
| :--- | :---: |
| GitHub Flavored Markdown | Sim |
| Tabelas e listas de tarefas | Sim |
| Privacidade local | Sim |

---

Pronto para começar? Clique em **Novo arquivo** ou arraste um documento para a janela.
`;

  function notify(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3500);
  }

  function fileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".0", "")} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function slugify(text, index) {
    const slug = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim()
      .replace(/\s+/g, "-").replace(/-+/g, "-");
    return slug || `secao-${index}`;
  }

  function buildTableOfContents() {
    if (headingObserver) headingObserver.disconnect();
    toc.replaceChildren();

    const headings = [...content.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    if (!headings.length) {
      const message = document.createElement("p");
      message.className = "toc-empty";
      message.textContent = "Nenhum título encontrado.";
      toc.append(message);
      return;
    }

    const seen = new Map();
    const links = new Map();
    headings.forEach((heading, index) => {
      const base = slugify(heading.textContent, index + 1);
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count + 1}`;
      heading.id = id;

      const anchor = document.createElement("a");
      anchor.href = `#${encodeURIComponent(id)}`;
      anchor.textContent = heading.textContent.trim() || `Seção ${index + 1}`;
      anchor.className = `depth-${heading.tagName.slice(1)}`;
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        heading.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", `#${encodeURIComponent(id)}`);
      });
      toc.append(anchor);
      links.set(heading, anchor);
    });

    if ("IntersectionObserver" in window) {
      headingObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          toc.querySelectorAll("a.active").forEach((item) => item.classList.remove("active"));
          links.get(entry.target)?.classList.add("active");
        }
      }, { rootMargin: "-10% 0px -72% 0px", threshold: 0 });
      headings.forEach((heading) => headingObserver.observe(heading));
    }
  }

  function showDocument(name, source, sizeBytes) {
    if (typeof marked === "undefined" || typeof DOMPurify === "undefined") {
      notify("Não foi possível carregar o renderizador de Markdown.");
      return;
    }

    markdownSource = source.replace(/^\uFEFF/, "");
    try {
      const parsed = marked.parse(markdownSource, { gfm: true, breaks: false });
      content.innerHTML = DOMPurify.sanitize(parsed, { USE_PROFILES: { html: true } });
    } catch (error) {
      console.error("Erro ao renderizar Markdown", error);
      notify("Ocorreu um erro ao ler o Markdown.");
      return;
    }

    // Links externos são abertos em outra aba com isolamento da página original.
    content.querySelectorAll("a[href]").forEach((link) => {
      if (/^https?:\/\//i.test(link.href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    });

    $("fileName").textContent = name;
    const words = (markdownSource.match(/\S+/g) || []).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    $("fileStats").replaceChildren();
    [`${fileSize(sizeBytes)}`, `${words.toLocaleString("pt-BR")} palavras`, `${minutes} min de leitura`].forEach((text) => {
      const item = document.createElement("span");
      item.textContent = text;
      $("fileStats").append(item);
    });

    buildTableOfContents();
    welcome.hidden = true;
    viewer.hidden = false;
    document.title = `${name} — md.`;
    history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function openFile(file) {
    if (!file) return;
    if (!ALLOWED_EXTENSION.test(file.name)) {
      notify("Selecione um arquivo .md, .markdown, .mdown ou .txt.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      notify("O arquivo deve ter no máximo 10 MB.");
      return;
    }
    try {
      showDocument(file.name, await file.text(), file.size);
    } catch (error) {
      console.error("Erro ao abrir arquivo", error);
      notify("Não foi possível abrir este arquivo.");
    }
  }

  function chooseFile() { input.click(); }
  $("headerOpenButton").addEventListener("click", chooseFile);
  $("changeButton").addEventListener("click", chooseFile);
  $("exampleButton").addEventListener("click", () => showDocument("exemplo.md", EXAMPLE, new Blob([EXAMPLE]).size));
  $("copyButton").addEventListener("click", async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(markdownSource);
      } else {
        const temporary = document.createElement("textarea");
        temporary.value = markdownSource;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.append(temporary);
        temporary.select();
        const copied = document.execCommand("copy");
        temporary.remove();
        if (!copied) throw new Error("A cópia foi recusada pelo navegador.");
      }
      notify("Markdown copiado.");
    } catch (error) {
      notify("Não foi possível copiar. Verifique a permissão do navegador.");
    }
  });
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    input.value = "";
    void openFile(file);
  });

  const dropzone = $("dropzone");
  dropzone.addEventListener("click", chooseFile);
  dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseFile();
    }
  });

  const hasFiles = (event) => [...(event.dataTransfer?.types || [])].includes("Files");
  function hideOverlay() { dragDepth = 0; overlay.hidden = true; }

  document.addEventListener("dragenter", (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth += 1;
    overlay.hidden = false;
  });
  document.addEventListener("dragover", (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });
  document.addEventListener("dragleave", (event) => {
    if (!hasFiles(event)) return;
    dragDepth -= 1;
    if (dragDepth <= 0) hideOverlay();
  });
  document.addEventListener("drop", (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    hideOverlay();
    void openFile(event.dataTransfer?.files?.[0]);
  });
  window.addEventListener("blur", hideOverlay);

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
      event.preventDefault();
      chooseFile();
    }
    if (event.key === "Escape") hideOverlay();
  });
})();
