# md. — Markdown Viewer

Um visualizador de Markdown minimalista com tema preto. Arraste um arquivo `.md` para a página e leia o conteúdo formatado imediatamente.

## Recursos

- Arrastar e soltar `.md`, `.markdown`, `.mdown` e `.txt` em qualquer lugar da página.
- Escolher arquivos pelo botão ou com `Ctrl + O` / `Cmd + O`.
- Exibir títulos, listas, tabelas, blocos de código, links, imagens e listas de tarefas (GFM).
- Índice automático dos títulos para navegar em documentos longos.
- Copiar o Markdown original, abrir outros arquivos e testar o exemplo integrado.
- Visualização local no navegador, sem upload para servidores.
- Layout responsivo e arquivos estáticos; não requer instalação, build ou backend.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie **todos os arquivos desta pasta** para a raiz do repositório, incluindo a pasta `vendor`.
3. Abra **Settings → Pages** no repositório.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha a branch `main`, a pasta **/(root)** e clique em **Save**.
6. Depois da publicação, acesse o endereço exibido pelo GitHub Pages.

Também é possível abrir `index.html` diretamente no navegador para usar localmente.

## Estrutura

```text
markdown-viewer/
├── index.html
├── styles.css
├── app.js
├── favicon.svg
├── vendor/
│   ├── marked.umd.js
│   ├── purify.min.js
│   ├── marked.LICENSE.md
│   └── dompurify.LICENSE
├── .nojekyll
└── README.md
```

As bibliotecas [Marked](https://github.com/markedjs/marked) (15.0.12) e [DOMPurify](https://github.com/cure53/DOMPurify) (3.4.17) estão incluídas em `vendor/`, junto com suas licenças, para que não sejam necessárias requisições a CDNs. O conteúdo dos arquivos é lido e renderizado localmente. Links e imagens externas presentes no Markdown podem fazer requisições quando acessados ou exibidos.

Limite por arquivo: **10 MB**.
