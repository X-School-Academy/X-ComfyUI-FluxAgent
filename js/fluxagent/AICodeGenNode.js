import { app } from "/scripts/app.js";

// Custom node for dynamic input/output management
class AICodeGenNode {
    constructor(comfyNode = null) { // MODIFIED: Accept and store comfyNode
        this.comfyNode = comfyNode;   // MODIFIED: Store the ComfyUI node reference
        this.serialize_widgets = true;
        this.isVirtualNode = false;
        this.config = {
            input: [],
            output: [{ name: "result", type: "string" }],
        };
    }

    // Placeholder: Load configuration from backend
    async loadConfig() {
        try {
            // TODO: Replace with actual API call to load configuration
            // const response = await api.fetchApi(`/ai_codegen_node/config`, {
            //     method: 'GET'
            // });
            // if (response.ok) {
            //     this.config = await response.json();
            // }

            // Placeholder: Load from localStorage for now
            //const savedConfig = localStorage.getItem('ai_codegen_node_config');
            //if (savedConfig) {
            //    this.config = JSON.parse(savedConfig);
            //}
        } catch (error) {
            console.log('Using default config:', error);
        }
    }

    // Placeholder: Save configuration to backend
    async saveConfig(config) {
        try {
            // TODO: Replace with actual API call to save configuration
            // const response = await api.fetchApi(`/ai_codegen_node/config`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(config)
            // });
            // if (response.ok) {
            //     this.config = config;
            //     this.updateNodeStructure();
            //     return true;
            // }

            // Placeholder: Save to localStorage for now
            //localStorage.setItem('ai_codegen_node_config', JSON.stringify(config));
            this.config = config;
            this.updateNodeStructure(); // Calls updateNodeStructure which will use this.comfyNode
            return true;
        } catch (error) {
            console.error('Failed to save config:', error);
        }
        return false;
    }

    // Update node structure based on configuration
    updateNodeStructure(comfyNode = null) {
        // If called from ComfyUI node context, use the passed node reference
        // Otherwise, use the stored reference (this.comfyNode set in constructor)
        const targetNode = comfyNode || this.comfyNode;

        if (!targetNode) {
            console.warn('No ComfyUI node reference available for updateNodeStructure');
            return;
        }

        const config = this.config;

        const preservedWidgets = [];
        const existingWidgets = targetNode.widgets || [];

        const manageButton = existingWidgets.find(w => w.name === "manage_inputs_outputs");
        if (manageButton) {
            preservedWidgets.push(manageButton);
        }

        const richTextWidgetInstance = existingWidgets.find(w => w.name === "rich_text");
        if (richTextWidgetInstance) {
            preservedWidgets.push(richTextWidgetInstance);
        }
        targetNode.widgets = preservedWidgets;

        // Store existing connections before modifying inputs/outputs
        const existingInputConnections = {};
        const existingOutputConnections = {};

        // Store input connections
        if (targetNode.inputs) {
            targetNode.inputs.forEach((input, index) => {
                if (input.link) {
                    existingInputConnections[input.name] = {
                        link: input.link,
                        type: input.type
                    };
                }
            });
        }

        // Store output connections
        if (targetNode.outputs) {
            targetNode.outputs.forEach((output, index) => {
                if (output.links && output.links.length > 0) {
                    existingOutputConnections[output.name] = {
                        links: [...output.links],
                        type: output.type
                    };
                }
            });
        }

        // Clear inputs/outputs
        targetNode.inputs = [];
        targetNode.outputs = [];

        // Add configured inputs
        config.input.forEach(field => {
            const inputIndex = targetNode.addInput(field.name, this.mapTypeToComfyUI(field.type));
            // Restore connection if it existed
            if (existingInputConnections[field.name]) {
                const input = targetNode.inputs[inputIndex];
                if (input) {
                    input.link = existingInputConnections[field.name].link;
                    
                    // Make sure this connection is properly reflected in the graph
                    if (app.graph && input.link !== null) {
                        const linkedNode = app.graph.getNodeById(app.graph.links[input.link].origin_id);
                        if (linkedNode) {
                            const outputIndex = app.graph.links[input.link].origin_slot;
                            const output = linkedNode.outputs[outputIndex];
                            if (output && output.links && !output.links.includes(input.link)) {
                                output.links.push(input.link);
                            }
                        }
                    }
                }
            }
        });

        // Add configured outputs
        config.output.forEach(field => {
            const outputIndex = targetNode.addOutput(field.name, this.mapTypeToComfyUI(field.type));
            // Restore connections if they existed
            if (existingOutputConnections[field.name]) {
                const output = targetNode.outputs[outputIndex];
                if (output) {
                    output.links = existingOutputConnections[field.name].links;
                    
                    // Make sure these connections are properly reflected in the graph
                    if (app.graph && output.links && output.links.length > 0) {
                        output.links.forEach(linkId => {
                            if (app.graph.links[linkId]) {
                                const targetNodeId = app.graph.links[linkId].target_id;
                                const targetNode = app.graph.getNodeById(targetNodeId);
                                if (targetNode) {
                                    const inputIndex = app.graph.links[linkId].target_slot;
                                    const input = targetNode.inputs[inputIndex];
                                    if (input && input.link !== linkId) {
                                        input.link = linkId;
                                    }
                                }
                            }
                        });
                    }
                }
            }
        });

        // Update node size
        targetNode.setSize(targetNode.computeSize());

        // Mark as modified
        if (app.graph && app.graph.setDirtyCanvas) {
            app.graph.setDirtyCanvas(true, true);
        }
    }

    // Map configuration types to ComfyUI types
    mapTypeToComfyUI(type) {
        const typeMap = {
            'string': 'STRING',
            'int': 'INT',
            'float': 'FLOAT',
            'boolean': 'BOOLEAN',
            'combo': 'COMBO',
            'image': 'IMAGE',
            'audio': 'AUDIO',
            'json': 'JSON' // Assuming JSON is a custom type or handled as STRING
        };
        return typeMap[type] || 'STRING';
    }

    // Create the configuration modal
    createConfigModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">AI CodeGen Node Configuration</h2>
                </div>

                <div class="modal-tabs">
                    <button class="tab-button active" data-tab="input">Input</button>
                    <button class="tab-button" data-tab="output">Output</button>
                </div>

                <div class="modal-content">
                    <div id="input-fields" class="field-list active">
                        <div id="input-container"></div>
                        <button class="add-field-button" data-type="input">+ Add Input Field</button>
                    </div>

                    <div id="output-fields" class="field-list">
                        <div id="output-container"></div>
                        <button class="add-field-button" data-type="output">+ Add Output Field</button>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="cancel-button">Cancel</button>
                    <button class="save-button">Save</button>
                </div>
            </div>
        `;

        // Add modal styles
        if (!document.getElementById('ai-codegen-node-styles')) {
            const styles = document.createElement('style');
            styles.id = 'ai-codegen-node-styles';
            styles.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                }

                .modal {
                    background-color: #3a3a3a;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                }

                .modal-header {
                    background-color: #4a4a4a;
                    padding: 20px;
                    border-bottom: 1px solid #555;
                }

                .modal-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #ffffff;
                    margin: 0;
                }

                .modal-tabs {
                    display: flex;
                    background-color: #404040;
                    border-bottom: 1px solid #555;
                }

                .tab-button {
                    flex: 1;
                    padding: 15px 20px;
                    background: none;
                    border: none;
                    color: #cccccc;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-bottom: 3px solid transparent;
                }

                .tab-button:hover {
                    background-color: #4a4a4a;
                    color: #ffffff;
                }

                .tab-button.active {
                    background-color: #5a5a5a;
                    color: #ffffff;
                    border-bottom-color: #007acc;
                }

                .modal-content {
                    padding: 20px;
                    overflow-y: auto; /* Allow content to scroll */
                    flex-grow: 1; /* Allow content to take available space */
                }

                .field-list {
                    display: none;
                }

                .field-list.active {
                    display: block;
                }

                .field-item {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    margin-bottom: 10px;
                    background-color: #444444;
                    border-radius: 6px;
                    border: 1px solid #555;
                }

                .field-name {
                    flex: 1;
                    margin-right: 15px;
                }

                .field-name input {
                    width: 100%;
                    padding: 8px 12px;
                    background-color: #555555;
                    border: 1px solid #666666;
                    border-radius: 4px;
                    color: #ffffff;
                    font-size: 14px;
                }

                .field-name input:focus {
                    outline: none;
                    border-color: #007acc;
                }

                .field-type {
                    margin-right: 15px;
                }

                .field-type select {
                    padding: 8px 12px;
                    background-color: #555555;
                    border: 1px solid #666666;
                    border-radius: 4px;
                    color: #ffffff;
                    font-size: 14px;
                    cursor: pointer;
                }

                .field-type select:focus {
                    outline: none;
                    border-color: #007acc;
                }

                .field-actions button {
                    padding: 6px 12px;
                    background-color: #d32f2f;
                    border: none;
                    border-radius: 4px;
                    color: #ffffff;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background-color 0.3s ease;
                }

                .field-actions button:hover {
                    background-color: #f44336;
                }

                .add-field-button {
                    width: 100%;
                    padding: 12px;
                    background-color: #007acc;
                    border: none;
                    border-radius: 6px;
                    color: #ffffff;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 15px;
                    transition: background-color 0.3s ease;
                }

                .add-field-button:hover {
                    background-color: #005a9e;
                }

                .modal-footer {
                    padding: 20px;
                    background-color: #404040;
                    border-top: 1px solid #555;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }

                .modal-footer button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }

                .cancel-button {
                    background-color: #666666;
                    color: #ffffff;
                }

                .cancel-button:hover {
                    background-color: #777777;
                }

                .save-button {
                    background-color: #4caf50;
                    color: #ffffff;
                }

                .save-button:hover {
                    background-color: #45a049;
                }

            `;
            document.head.appendChild(styles);
        }

        return modal;
    }

    // Populate modal with current configuration
    populateModal(modal) {
        // Populate input fields
        const inputContainer = modal.querySelector('#input-container');
        inputContainer.innerHTML = '';
        this.config.input.forEach(field => {
            const fieldElement = this.createFieldElement(field, 'input');
            inputContainer.appendChild(fieldElement);
        });

        // Populate output fields
        const outputContainer = modal.querySelector('#output-container');
        outputContainer.innerHTML = '';
        this.config.output.forEach(field => {
            const fieldElement = this.createFieldElement(field, 'output');
            outputContainer.appendChild(fieldElement);
        });

    }

    // Create field element
    createFieldElement(field, type) {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'field-item';
        // Use textContent for setting value in input to prevent XSS with field.name if it somehow contained HTML
        const fieldNameInput = document.createElement('input');
        fieldNameInput.type = 'text';
        fieldNameInput.value = field.name; // field.name is assumed to be safe here, but be cautious if from untrusted sources
        fieldNameInput.placeholder = 'Field name';


        fieldDiv.innerHTML = `
            <div class="field-name">
                ${/* Placeholder for input, will be replaced by DOM manipulation */''}
            </div>
            <div class="field-type">
                <select>
                    <option value="string" ${field.type === 'string' ? 'selected' : ''}>string</option>
                    <option value="int" ${field.type === 'int' ? 'selected' : ''}>int</option>
                    <option value="float" ${field.type === 'float' ? 'selected' : ''}>float</option>
                    <option value="boolean" ${field.type === 'boolean' ? 'selected' : ''}>boolean</option>
                    <option value="combo" ${field.type === 'combo' ? 'selected' : ''}>combo</option>
                    <option value="image" ${field.type === 'image' ? 'selected' : ''}>image</option>
                    <option value="audio" ${field.type === 'audio' ? 'selected' : ''}>audio</option>
                    <option value="json" ${field.type === 'json' ? 'selected' : ''}>json (custom)</option>
                </select>
            </div>
            <div class="field-actions">
                <button type="button">Delete</button>
            </div>
        `;
        fieldDiv.querySelector('.field-name').appendChild(fieldNameInput);

        // Add delete handler to avoid inline JS
        const deleteButton = fieldDiv.querySelector('.field-actions button');
        deleteButton.addEventListener('click', () => {
            fieldDiv.remove();
        });

        return fieldDiv;
    }

    // Setup modal event handlers
    setupModalHandlers(modal) {
        // Store reference to this AICodeGenNode instance
        const aiCodeGenNode = this;

        // Tab switching
        const tabButtons = modal.querySelectorAll('.tab-button');
        const fieldLists = modal.querySelectorAll('.field-list');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;

                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update active field list
                fieldLists.forEach(list => list.classList.remove('active'));
                modal.querySelector(`#${tab}-fields`).classList.add('active');
            });
        });

        // Add field buttons
        const addButtons = modal.querySelectorAll('.add-field-button');
        addButtons.forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                const container = modal.querySelector(`#${type}-container`);
                const newField = aiCodeGenNode.createFieldElement({ name: 'new_field', type: 'string' }, type);
                container.appendChild(newField);

                // Focus on new field
                const input = newField.querySelector('input');
                input.focus();
                input.select();
            });
        });

        // Cancel button
        modal.querySelector('.cancel-button').addEventListener('click', () => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
        });

        // Save button
        modal.querySelector('.save-button').addEventListener('click', async () => {
            const newConfig = aiCodeGenNode.collectModalData(modal);
            // MODIFIED: Corrected function call
            const success = await aiCodeGenNode.saveConfig(newConfig);

            if (success) {
                if (modal.parentNode) {
                    document.body.removeChild(modal);
                }
                // Show success message if dialog is available
                if (app.ui && app.ui.dialog && app.ui.dialog.show) {
                    app.ui.dialog.show("Configuration saved successfully!");
                } else {
                    console.log("Configuration saved successfully!");
                }
            } else {
                // Show error message if dialog is available
                if (app.ui && app.ui.dialog && app.ui.dialog.show) {
                    app.ui.dialog.show("Failed to save configuration!");
                } else {
                    console.error("Failed to save configuration!");
                }
            }
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (modal.parentNode) {
                    document.body.removeChild(modal);
                }
            }
        });
    }

    // Collect data from modal
    collectModalData(modal) {
        const config = {
            input: [],
            output: []
        };

        // Collect input fields
        const inputFields = modal.querySelectorAll('#input-container .field-item');
        const inputNames = new Set();
        inputFields.forEach(field => {
            const nameInput = field.querySelector('.field-name input');
            const name = nameInput ? nameInput.value.trim() : '';
            const typeSelect = field.querySelector('.field-type select');
            const type = typeSelect ? typeSelect.value : 'string';

            if (name) {
                // Check for duplicate names
                if (inputNames.has(name)) {
                    console.warn(`Duplicate input field name: ${name}. Skipping.`);
                     if (app.ui && app.ui.dialog && app.ui.dialog.show) {
                        app.ui.dialog.show(`Error: Duplicate input field name "${name}". Please use unique names.`);
                    }
                    // Consider not adding this field or adding with a modified name
                    return; // Skip this field
                }
                // Validate field name (basic check for valid identifier)
                if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
                    console.warn(`Invalid field name: ${name}. Field names should be valid identifiers. Skipping.`);
                    if (app.ui && app.ui.dialog && app.ui.dialog.show) {
                        app.ui.dialog.show(`Error: Invalid input field name "${name}". Must be a valid identifier (e.g., 'my_var', not 'my-var' or '123var').`);
                    }
                    return; // Skip this field
                }
                inputNames.add(name);
                config.input.push({ name, type });
            }
        });

        // Collect output fields
        const outputFields = modal.querySelectorAll('#output-container .field-item');
        const outputNames = new Set();
        outputFields.forEach(field => {
            const nameInput = field.querySelector('.field-name input');
            const name = nameInput ? nameInput.value.trim() : '';
            const typeSelect = field.querySelector('.field-type select');
            const type = typeSelect ? typeSelect.value : 'string';

            if (name) {
                // Check for duplicate names
                if (outputNames.has(name)) {
                    console.warn(`Duplicate output field name: ${name}. Skipping.`);
                    if (app.ui && app.ui.dialog && app.ui.dialog.show) {
                        app.ui.dialog.show(`Error: Duplicate output field name "${name}". Please use unique names.`);
                    }
                    return; // Skip this field
                }
                // Validate field name
                if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
                    console.warn(`Invalid field name: ${name}. Field names should be valid identifiers. Skipping.`);
                     if (app.ui && app.ui.dialog && app.ui.dialog.show) {
                        app.ui.dialog.show(`Error: Invalid output field name "${name}". Must be a valid identifier.`);
                    }
                    return; // Skip this field
                }
                outputNames.add(name);
                config.output.push({ name, type });
            }
        });

        return config;
    }

    // Open configuration modal
    async openConfigModal() {
        await this.loadConfig();
        const modal = this.createConfigModal();
        this.populateModal(modal);
        this.setupModalHandlers(modal);
        document.body.appendChild(modal);
    }
}

// Node configuration
let nodeName = "X-FluxAgent.AICodeGenNode";

// Register the custom node with ComfyUI
app.registerExtension({
    name: nodeName,
    async beforeRegisterNodeDef(nodeType, nodeData, appInstance) { // Renamed app to appInstance to avoid conflict
        if (nodeData.name === nodeName) {
            console.log("Registering X-FluxAgent.AICodeGenNode");
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () { // 'this' is the ComfyUI node instance
                const result = onNodeCreated?.apply(this, arguments);

                // Initialize AI CodeGen node functionality, passing the ComfyUI node instance
                this.aiCodeGenNode = new AICodeGenNode(this); // 'this' is the ComfyUI node

                // Handle connection changes to ensure they're saved
                const onConnectionsChange = this.onConnectionsChange;
                this.onConnectionsChange = function(type, index, connected, link_info) {
                    const result = onConnectionsChange?.apply(this, arguments);
                    
                    // Mark the workflow as modified whenever connections change
                    if (app?.extensionManager?.workflow?.activeWorkflow?.changeTracker?.checkState) {
                        app.extensionManager.workflow.activeWorkflow.changeTracker.checkState();
                    }
                    
                    return result;
                };

                // Add manage button widget
                const manageWidget = this.addWidget(
                    "button",
                    "manage_inputs_outputs",
                    "Manage Inputs/Outputs",
                    () => {
                        this.aiCodeGenNode.openConfigModal();
                    }
                );
                manageWidget.label = "Manage Inputs/Outputs";
                // Ensure the widget is associated with this node instance if needed by ComfyUI's internals
                manageWidget.node = this;


                // Load and apply initial configuration
                this.aiCodeGenNode.loadConfig().then(() => {
                    // Only update if config has actual content and the node instance is valid
                    if (this.aiCodeGenNode && (this.aiCodeGenNode.config.input.length > 0 || this.aiCodeGenNode.config.output.length > 0)) {
                        this.aiCodeGenNode.updateNodeStructure(this); // Pass 'this' (ComfyUI node) explicitly
                    }
                }).catch(error => {
                    console.warn('Failed to load initial config for AICodeGenNode:', error);
                });

                // Set initial width and height [width, height]
                this.size = [300, 200]; 
                
                // Optional: set minimum size
                this.computeSize = function() {
                    return [300, 200]; // Minimum size [width, height]
                };

                // Track size changes for serialization
                const onResized = this.onResized;
                this.onResized = function(size) {
                    const result = onResized?.apply(this, arguments);
                    
                    // Save the new size for later serialization
                    this.size = size || this.size;
                    
                    // Mark workflow as dirty when node is resized
                    if (app?.extensionManager?.workflow?.activeWorkflow?.changeTracker?.checkState) {
                        app.extensionManager.workflow.activeWorkflow.changeTracker.checkState();
                    }
                    
                    // Ensure the canvas is redrawn
                    app.graph.setDirtyCanvas(true, false);
                    
                    return result;
                };
            };

            // Handle serialization
            const onSerialize = nodeType.prototype.onSerialize;
            nodeType.prototype.onSerialize = function(o) {
                // Call original onSerialize if it exists
                onSerialize?.apply(this, arguments); // o is modified by reference by LiteGraph
                if (this.aiCodeGenNode) {
                    o.ai_codegen_config = this.aiCodeGenNode.config;
                }
                o.size = this.size; // Save node size
                
                // Save connections for inputs and outputs
                o.input_connections = {};
                if (this.inputs) {
                    this.inputs.forEach((input, index) => {
                        if (input.link !== null) {
                            o.input_connections[input.name] = {
                                link: input.link,
                                type: input.type
                            };
                        }
                    });
                }
                
                o.output_connections = {};
                if (this.outputs) {
                    this.outputs.forEach((output, index) => {
                        if (output.links && output.links.length > 0) {
                            o.output_connections[output.name] = {
                                links: [...output.links],
                                type: output.type
                            };
                        }
                    })
                }
                
                // Save all widget values including rich text
                if (this.widgets) {
                    o.widgets_values = {};
                    this.widgets.forEach(widget => {
                        if (widget.name && widget.value !== undefined && widget.type !== "button") {
                            o.widgets_values[widget.name] = widget.value;
                        }
                    });
                }
                // No explicit return needed as o is modified by reference in LiteGraph
            };

            // Handle deserialization (configure)
            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function(o) {
                // Call original onConfigure if it exists
                onConfigure?.apply(this, arguments);
                
                // Clean up legacy data format - remove button widgets from widgets_values
                if (o.widgets_values && typeof o.widgets_values === 'object') {
                    if (o.widgets_values.manage_inputs_outputs) {
                        delete o.widgets_values.manage_inputs_outputs;
                    }
                }
                if (o.ai_codegen_config && this.aiCodeGenNode) {
                    this.aiCodeGenNode.config = JSON.parse(JSON.stringify(o.ai_codegen_config)); // Deep copy
                    // Defer update until node is fully set up, or ensure it's safe to call here
                    // Update is typically called after onNodeCreated or when properties change
                    // For now, let's assume onNodeCreated will handle initial update if needed.
                    // If values are present, it's good to update.
                     if (this.aiCodeGenNode.config.input.length > 0 || this.aiCodeGenNode.config.output.length > 0) {
                        // Store serialized connection information to be used after updateNodeStructure
                        const savedInputConnections = o.input_connections || {};
                        const savedOutputConnections = o.output_connections || {};
                        
                        this.aiCodeGenNode.updateNodeStructure(this);
                        
                        // Restore saved connections after structure update
                        setTimeout(() => {
                            // Restore input connections
                            if (this.inputs) {
                                this.inputs.forEach((input, index) => {
                                    if (savedInputConnections[input.name]) {
                                        input.link = savedInputConnections[input.name].link;
                                    }
                                });
                            }
                            
                            // Restore output connections
                            if (this.outputs) {
                                this.outputs.forEach((output, index) => {
                                    if (savedOutputConnections[output.name]) {
                                        output.links = [...savedOutputConnections[output.name].links];
                                    }
                                });
                            }
                            
                            // Update graph to reflect restored connections
                            if (app.graph) {
                                app.graph.setDirtyCanvas(true, true);
                            }
                        }, 100);
                    }
                }
                if (o.size) { // Restore node size
                    this.size = o.size;
                    // Force recomputation of node's size
                    setTimeout(() => {
                        if (this.setSize) {
                            this.setSize(this.size);
                            // Ensure the graph is redrawn
                            if (app.graph) {
                                app.graph.setDirtyCanvas(true, true);
                            }
                        }
                    }, 50);
                }
                
                // Restore all widget values including rich text
                if (o.widgets_values && this.widgets && typeof o.widgets_values === 'object') {
                    // Use setTimeout to defer widget restoration until after node is fully configured
                    setTimeout(() => {
                        if (this.widgets) {
                            this.widgets.forEach(widget => {
                                if (widget && widget.name && o.widgets_values[widget.name] !== undefined && widget.type !== "button") {
                                    try {
                                        if (widget.setValue && typeof widget.setValue === 'function') {
                                            widget.setValue(o.widgets_values[widget.name]);
                                        } else {
                                            widget.value = o.widgets_values[widget.name];
                                        }
                                    } catch (error) {
                                        console.warn(`Failed to restore widget value for ${widget.name}:`, error);
                                        // Fallback to direct assignment
                                        try {
                                            widget.value = o.widgets_values[widget.name];
                                        } catch (e) {
                                            console.warn(`Failed to restore widget value fallback for ${widget.name}:`, e);
                                        }
                                    }
                                }
                            });
                        }
                    }, 100);
                }
                 // It's important that onNodeCreated has already run and set up aiCodeGenNode
                // If onConfigure is called before onNodeCreated, this.aiCodeGenNode might not exist yet.
                // However, typical LiteGraph flow is onNodeCreated -> onConfigure (if serialized data exists)
                // So this should be fine.
            };

             // Optional: Override onRemoved if you need to clean up (e.g., remove event listeners from document.body)
            // const onRemoved = nodeType.prototype.onRemoved;
            // nodeType.prototype.onRemoved = function() {
            //     if (this.aiCodeGenNode && this.aiCodeGenNode.modal && this.aiCodeGenNode.modal.parentNode) {
            //         document.body.removeChild(this.aiCodeGenNode.modal);
            //         this.aiCodeGenNode.modal = null; // Clear reference
            //     }
            //     onRemoved?.apply(this, arguments);
            // };
        }
    }
});

// Export for use in other modules (if needed, typically not for ComfyUI extensions directly like this)
// export { AICodeGenNode };