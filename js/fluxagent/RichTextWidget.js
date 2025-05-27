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
        type: "X-FluxAgent.RichTextWidget",
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
            // Also update the node's serialization data immediately
            if (node && node.serialize_widgets) {
                app.graph.setDirtyCanvas(true, false);
            }
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

    // Add automatic serialization/deserialization for the widget
    const originalOnSerialize = node.onSerialize;
    node.onSerialize = function(o) {
        if (originalOnSerialize) {
            originalOnSerialize.apply(this, arguments);
        }
        // Find and serialize all RichTextWidget values
        const richTextWidgets = this.widgets?.filter(w => w.type === "X-FluxAgent.RichTextWidget") || [];
        if (richTextWidgets.length > 0) {
            o.rich_text_widgets = {};
            richTextWidgets.forEach(w => {
                o.rich_text_widgets[w.name] = w.value;
            });
        }
    };

    const originalOnConfigure = node.onConfigure;
    node.onConfigure = function(o) {
        if (originalOnConfigure) {
            originalOnConfigure.apply(this, arguments);
        }
        // Restore RichTextWidget values
        if (o.rich_text_widgets) {
            const restoreRichTextWidgets = () => {
                let allRestored = true;
                for (const [widgetName, widgetValue] of Object.entries(o.rich_text_widgets)) {
                    const richTextWidget = this.widgets?.find(w => 
                        w.type === "X-FluxAgent.RichTextWidget" && w.name === widgetName
                    );
                    if (richTextWidget) {
                        if (richTextWidget.setValue) {
                            richTextWidget.setValue(widgetValue);
                        } else {
                            // Fallback if setValue is not available at this stage
                            richTextWidget.value = widgetValue;
                            if (richTextWidget.editor) {
                                richTextWidget.editor.dispatch({
                                    changes: {
                                        from: 0,
                                        to: richTextWidget.editor.state.doc.length,
                                        insert: widgetValue
                                    }
                                });
                            }
                        }
                    } else {
                        allRestored = false;
                    }
                }
                
                // If not all widgets were found, try again after a short delay
                if (!allRestored) {
                    setTimeout(restoreRichTextWidgets, 100);
                }
            };
            
            // Try immediately first
            restoreRichTextWidgets();
        }
        
        // Backward compatibility: handle old single widget serialization format
        if (o.rich_text_value !== undefined) {
            const restoreOldFormat = () => {
                const richTextWidget = this.widgets?.find(w => w.type === "X-FluxAgent.RichTextWidget");
                if (richTextWidget) {
                    if (richTextWidget.setValue) {
                        richTextWidget.setValue(o.rich_text_value);
                    } else {
                        richTextWidget.value = o.rich_text_value;
                        if (richTextWidget.editor) {
                            richTextWidget.editor.dispatch({
                                changes: {
                                    from: 0,
                                    to: richTextWidget.editor.state.doc.length,
                                    insert: o.rich_text_value
                                }
                            });
                        }
                    }
                } else {
                    setTimeout(restoreOldFormat, 100);
                }
            };
            restoreOldFormat();
        }
    };

    return { widget };
}

ComfyWidgets["X-FluxAgent.RichTextWidget"] = createRichTextWidgetWidget;