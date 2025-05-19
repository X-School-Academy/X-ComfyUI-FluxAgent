import { app } from "/scripts/app.js";

// Ensure the app is available
if (app) {
    let nodeName = "X-FluxAgent.RichTextNode";
    app.registerExtension({
        name: nodeName, // Give your extension a unique name
        async beforeRegisterNodeDef(nodeType, nodeData, app) {
            // Check if this is the node definition for 'ExampleNode'
            // The 'nodeData.name' is the name ComfyUI uses internally,
            // which is usually the class name of your Python node.
            if (nodeData.name === nodeName) {
                console.log("Registering X-FluxAgent.RichTextNode");

                // Set default size
                const originalOnCreated = nodeType.prototype.onNodeCreated;
                
                // Override the onNodeCreated method
                nodeType.prototype.onNodeCreated = function() {

                    // Call the original onNodeCreated if it exists
                    if (originalOnCreated) {
                        originalOnCreated.apply(this, arguments);
                    }
                    
                    // Set initial width and height [width, height]
                    this.size = [300, 200]; 
                    
                    // Optional: set minimum size
                    this.computeSize = function() {
                        return [300, 200]; // Minimum size [width, height]
                    };
                };
                
                // In your node's JavaScript
                nodeType.prototype.onExecuted = function(details) {
                    const node = this;
                    // node.id is number, but details.node_id[0] is string
                    if (details.node_id[0] == node.id) {
                        for (const [widgetName, values] of Object.entries(details)) {
                            const widget = node.widgets.find(w => w.name.startsWith("X-FluxAgent."));
                            if (widget && widget.setValue) {
                                widget.setValue(values[0]); 
                            }
                        }
                        node.setDirtyCanvas(true, true);
                    }
                };
   
            }
        },
    });
} else {
    console.error("ComfyUI app instance not found. Cannot register ExampleNode button extension.");
}