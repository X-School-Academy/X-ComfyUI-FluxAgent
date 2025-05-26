import { app } from "/scripts/app.js";
import { ComfyWidgets } from "/scripts/widgets.js";
import { createRichEditor } from "./codemirror_bundle.js"


function createRichTextWidgetWidget(node, inputName, inputData) {
    // Create a custom widget for the RichTextNode
    const htmlElement = document.createElement("div");

    // Save data to workflow forced!
    function saveValue() {
        app?.extensionManager?.workflow?.activeWorkflow?.changeTracker?.checkState();
    }

    function getPosition(node, ctx, w_width, y, n_height) {
        const margin = 5;

        const rect = ctx.canvas.getBoundingClientRect();
        const transform = new DOMMatrix()
            .scaleSelf(rect.width / ctx.canvas.width, rect.height / ctx.canvas.height)
            .multiplySelf(ctx.getTransform())
            .translateSelf(margin, margin + y);
        const scale = new DOMMatrix().scaleSelf(transform.a, transform.d);

        return {
            transformOrigin: "0 0",
            transform: scale,
            left: `${transform.a + transform.e + rect.left}px`,
            top: `${transform.d + transform.f + rect.top}px`,
            maxWidth: `${w_width - margin * 2}px`,
            maxHeight: `${n_height - margin * 2 - y - 15}px`,
            width: `${w_width - margin * 2}px`,
            height: "90%",
            position: "absolute",
            scrollbarColor: "var(--descrip-text) var(--bg-color)",
            scrollbarWidth: "thin",
            zIndex: app.graph._nodes.indexOf(node),
        };
    }

    const widget = {
        type: "X-FluxAgent.RichTextNode",
        name: inputName,
        options: { hideOnZoom: true },
        value: inputData[1]?.default || "",
        htmlElement: htmlElement,
        editor: null,
        lastDimensions: { width: 0, height: 0 },
        draw(ctx, node, widget_width, y, widget_height) {
            const hidden =
                node.flags?.collapsed ||
                (!!widget.options.hideOnZoom && app.canvas.ds.scale < 0.5) ||
                widget.type === "converted-widget" ||
                widget.type === "hidden";

            widget.htmlElement.hidden = hidden;

            if (hidden) {
                widget.options.onHide?.(widget);
                return;
            }

            const position = getPosition(node, ctx, widget_width, y, node.size[1]);
            Object.assign(this.htmlElement.style, position);

            // Update editor size if dimensions changed
            if (this.editor && (
                this.lastDimensions.width !== parseInt(position.width) ||
                this.lastDimensions.height !== parseInt(position.height)
            )) {
                this.lastDimensions.width = parseInt(position.width);
                this.lastDimensions.height = parseInt(position.height);
                // Force CodeMirror to update its size
                this.editor.requestMeasure();
            }
        },
        setValue(value) {
            this.value = value;
            if (this.editor) {
                // Update CodeMirror content
                this.editor.dispatch({
                    changes: {
                        from: 0,
                        to: this.editor.state.doc.length,
                        insert: value
                    }
                });
            }
            saveValue();
        }
    };

    widget.editor = createRichEditor(htmlElement, widget.value, {
        language: "markdown",
        showLineNumbers: false,
        onUpdate: (value) => {
            widget.value = value;
            saveValue();
        }
    });

    // block LiteGraph shortcuts while the cursor is inside the editor
    ["keydown", "keyup", "keypress"].forEach(type =>
        widget.editor.dom.addEventListener(type, e => {
            e.stopPropagation();        // keeps the event inside CodeMirror
            // you can also preventDefault() here for ↑/↓ etc. if needed
        })
    );

    widget.htmlElement.hidden = true;

    const collapse = node.collapse;
    node.collapse = function () {
        collapse.apply(this, arguments);
        if (this.flags?.collapsed) {
            widget.htmlElement.hidden = true;
        } else {
            if (this.flags?.collapsed === false) {
                widget.htmlElement.hidden = false;
            }
        }
    };

    node.onRemoved = function () {
        for (const w of node?.widgets) {
            if (w?.htmlElement) w.htmlElement.remove();
        }
    };

    document.body.appendChild(widget.htmlElement);
    node.addCustomWidget(widget);

    return { widget };
}

ComfyWidgets["X-FluxAgent.RichTextWidget"] = createRichTextWidgetWidget;