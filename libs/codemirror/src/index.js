// src/index.js
// codemirror version 6
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";
import { keymap, lineNumbers } from "@codemirror/view";
import { history, indentWithTab } from "@codemirror/commands";

export function createRichEditor(parent, initialContent = "", options = {}) {
  const { onUpdate, language, showLineNumbers } = options;

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged && onUpdate) {
      onUpdate(update.state.doc.toString());
    }
  });

  let extensions = [
    basicSetup,
    EditorView.lineWrapping,
    history(),
    keymap.of([indentWithTab]),
    updateListener,
    // Add CSS to make the editor fill its container
    EditorView.theme({
      "&": {
        height: "100%",
        width: "100%"
      },
      ".cm-scroller": {
        overflow: "auto"
      }
    })
  ]

  if (language == 'python') {
    extensions.push(python());
  } else if (language == 'javascript') {
    extensions.push(javascript());
  }  else {
    extensions.push(markdown());
  }

  if (showLineNumbers) {
    extensions.push(lineNumbers());
  }

  return new EditorView({
    doc: initialContent,
    extensions,
    parent
  });
}