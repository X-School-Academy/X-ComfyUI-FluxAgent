
import { app } from "/scripts/app.js";

/**
 * X-FluxAgent.AICodeGenNode
 *
 * A ComfyUI node whose inputs / outputs are managed directly on the
 * node itself.  No separate "config" object is kept: we always query
 * the node’s current inputs / outputs and operate on those.
 *
 * – Adding an input/output from the management UI calls addInput /
 *   addOutput immediately.
 * – Deleting or renaming updates the corresponding slot on the node.
 * – All connections are left for ComfyUI to manage natively.
 */

const NODE_NAME = "X-FluxAgent.AICodeGenNode";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function mapTypeToComfy(type) {
    switch (type) {
        case "string":   return "STRING";
        case "number":   return "INT";
        case "image":    return "IMAGE";
        case "vector":   return "VECTOR";
        case "boolean":  return "BOOLEAN";
        case "json":     return "JSON";
        case "any":      return "ANY";
        default:         return "STRING";
    }
}

function comfyTypeToSelect(type) {
    const t = (type || "").toUpperCase();
    switch (t) {
        case "STRING":  return "string";
        case "INT":
        case "NUMBER":  return "number";
        case "IMAGE":   return "image";
        case "VECTOR":  return "vector";
        case "BOOLEAN": return "boolean";
        case "JSON":    return "json";
        case "ANY":     return "any";
        default:        return "string";
    }
}

/* ------------------------------------------------------------------ */
/* Node class                                                         */
/* ------------------------------------------------------------------ */

class AICodeGenNode {

    constructor(comfyNode) {
        this.node = comfyNode;
        // Make sure the node has at least one default output so it can
        // be dropped on the canvas without breaking anything.
        if (!this.node.outputs || this.node.outputs.length === 0) {
            this.node.addOutput("result", "STRING");
        }
    }

    /* --------------------------------------------- UI -------------- */

    openManager() {
        const modal = this._buildModal();
        document.body.appendChild(modal);
    }

    _buildModal() {
        /* ----------- scaffold HTML ----------- */
        const modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">Manage Inputs / Outputs</h2>
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

            <style>
                .modal-overlay{
                    position:fixed;top:0;left:0;width:100%;height:100%;
                    background:rgba(0,0,0,.7);display:flex;align-items:center;
                    justify-content:center;z-index:10000;
                }
                .modal{
                    background:#333;width:90%;max-width:600px;max-height:80vh;
                    overflow:hidden;border-radius:8px;display:flex;
                    flex-direction:column;
                }
                .modal-header{padding:20px;border-bottom:1px solid #555}
                .modal-title{margin:0;font-size:20px;color:#fff}
                .modal-tabs{display:flex}
                .tab-button{
                    flex:1;padding:10px 0;background:#444;border:none;color:#ccc;
                    cursor:pointer;font-size:14px;border-bottom:3px solid transparent
                }
                .tab-button.active{background:#555;color:#fff;
                    border-bottom-color:#007acc}
                .modal-content{padding:20px;overflow:auto;flex:1}
                .field-list{display:none}
                .field-list.active{display:block}
                .field-item{display:flex;align-items:center;margin-bottom:8px}
                .field-item input{flex:1;margin-right:8px;padding:4px 6px;
                    border-radius:4px;border:none;background:#555;color:#fff}
                .field-item select{margin-right:8px;background:#555;border:none;
                    color:#fff;padding:4px 6px;border-radius:4px}
                .field-actions button{
                    background:#d32f2f;border:none;color:#fff;padding:4px 8px;
                    border-radius:4px;cursor:pointer
                }
                .add-field-button{
                    width:100%;padding:10px;background:#007acc;border:none;
                    border-radius:6px;color:#fff;cursor:pointer;
                    margin-top:10px
                }
                .modal-footer{padding:15px;border-top:1px solid #555;
                    display:flex;justify-content:flex-end}
                .modal-footer button{
                    padding:8px 16px;border:none;border-radius:4px;cursor:pointer}
                .cancel-button{background:#777;color:#fff;margin-right:10px}
                .save-button{background:#007acc;color:#fff}
            </style>
        `;

        /* -------- populate current slots -------- */
        const inputContainer  = modal.querySelector("#input-container");
        const outputContainer = modal.querySelector("#output-container");
        
        // Clear containers first
        inputContainer.innerHTML = '';
        outputContainer.innerHTML = '';
        
        // Populate inputs only in input container
        this.node.inputs?.forEach((inp) => {
            inputContainer.appendChild(
                this._createFieldElement({name:inp.name, type:comfyTypeToSelect(inp.type)}, "input")
            );
        });
        
        // Populate outputs only in output container
        this.node.outputs?.forEach((out) => {
            outputContainer.appendChild(
                this._createFieldElement({name:out.name, type:comfyTypeToSelect(out.type)}, "output")
            );
        });

        /* -------- tab switching -------- */
        modal.querySelectorAll(".tab-button").forEach(btn=>{
            btn.addEventListener("click",()=>{
                modal.querySelectorAll(".tab-button").forEach(b=>b.classList.remove("active"));
                modal.querySelectorAll(".field-list").forEach(l=>l.classList.remove("active"));
                btn.classList.add("active");
                modal.querySelector(`#${btn.dataset.tab}-fields`).classList.add("active");
            });
        });

        /* -------- add-field buttons -------- */
        modal.querySelectorAll(".add-field-button").forEach(btn=>{
            btn.addEventListener("click",()=>{
                const dest = modal.querySelector(`#${btn.dataset.type}-container`);
                const timestamp = Date.now();
                const newFieldElement = this._createFieldElement({name:`${btn.dataset.type}_${timestamp}`, type:"string"}, btn.dataset.type);
                dest.appendChild(newFieldElement);
                
                // Focus and select the input field for easy editing
                const input = newFieldElement.querySelector("input");
                if (input) {
                    input.focus();
                    input.select();
                }
            });
        });

        /* -------- footer buttons -------- */
        modal.querySelector(".cancel-button").addEventListener("click",()=>{
            modal.remove();
        });

        modal.querySelector(".save-button").addEventListener("click",()=>{
            const config = this._collect(modal);
            if (this._applyChanges(config)) {
                modal.remove();
            }
        });

        return modal;
    }

    _createFieldElement(field, ioType) {
        const div = document.createElement("div");
        div.className = "field-item";
        div.innerHTML = `
            <input type="text" value="${field.name}" placeholder="name">
            <select>
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
                <option value="image">image</option>
                <option value="vector">vector</option>
                <option value="any">any</option>
                <option value="json">json</option>
            </select>
            <div class="field-actions">
                <button>&times;</button>
            </div>
        `;
        div.querySelector("select").value = field.type;
        div.querySelector(".field-actions button").addEventListener("click",()=>{
            div.remove();
        });
        return div;
    }

    _collect(modal){
        const data = {input:[], output:[]};
        modal.querySelectorAll("#input-container .field-item").forEach(item=>{
            const name = item.querySelector("input").value.trim();
            const type = item.querySelector("select").value;
            if(name) data.input.push({name, type});
        });
        modal.querySelectorAll("#output-container .field-item").forEach(item=>{
            const name = item.querySelector("input").value.trim();
            const type = item.querySelector("select").value;
            if(name) data.output.push({name, type});
        });
        return data;
    }

    /* --------------------- apply to node --------------------------- */

    _applyChanges(conf){
        const node = this.node;
        if(!node) return false;

        /* ---- validate duplicates ---- */
        const allNames = new Set();
        for(const f of [...conf.input, ...conf.output]){
            if(allNames.has(f.name)){
                alert(`Duplicate field name: ${f.name}`);
                return false;
            }
            allNames.add(f.name);
        }

        /* ---- Inputs ---- */
        // remove / update
        for(let i=node.inputs.length-1; i>=0; i--){
            const fieldConf = conf.input.find(f=>f.name===node.inputs[i].name);
            if(!fieldConf){
                node.removeInput(i);
            }else{
                // update type if changed
                const newType = mapTypeToComfy(fieldConf.type);
                if(node.inputs[i].type !== newType){
                    node.inputs[i].type = newType;
                }
            }
        }
        // add new
        conf.input.forEach(f=>{
            if(!node.inputs.find(inp=>inp.name===f.name)){
                node.addInput(f.name, mapTypeToComfy(f.type));
            }
        });

        /* ---- Outputs ---- */
        for(let i=node.outputs.length-1; i>=0; i--){
            const fieldConf = conf.output.find(f=>f.name===node.outputs[i].name);
            if(!fieldConf){
                node.removeOutput(i);
            }else{
                const newType = mapTypeToComfy(fieldConf.type);
                if(node.outputs[i].type !== newType){
                    node.outputs[i].type = newType;
                }
            }
        }

        conf.output.forEach(f=>{
            if(!node.outputs.find(out=>out.name===f.name)){
                node.addOutput(f.name, mapTypeToComfy(f.type));
            }
        });

        /* ---- refresh canvas / mark dirty ---- */
        if(node?.graph?.setDirtyCanvas){
            node.graph.setDirtyCanvas(true, true);
        }
        if(app?.extensionManager?.workflow?.activeWorkflow?.changeTracker?.checkState){
            app.extensionManager.workflow.activeWorkflow.changeTracker.checkState();
        }

        return true;
    }
}

app.registerExtension({
    name: NODE_NAME,
    async beforeRegisterNodeDef(nodeType, nodeData){
        if(nodeData.name !== NODE_NAME) return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function(){
            origCreated?.apply(this, arguments);

            // attach helper class
            this.aiCodeGen = new AICodeGenNode(this);

            // add management widget
            const widget = this.addWidget("button", "Manage Inputs/Outputs", null, () => {
                this.aiCodeGen.openManager();
            });
            widget.node = this; // keep reference for ComfyUI

            // mark graph dirty when connections change
            const origConn = this.onConnectionsChange;
            this.onConnectionsChange = function(){
                origConn?.apply(this, arguments);
                if(app?.extensionManager?.workflow?.activeWorkflow?.changeTracker?.checkState){
                    app.extensionManager.workflow.activeWorkflow.changeTracker.checkState();
                }
            };

            // Set initial width and height [width, height]
            this.size = [300, 200]; 

            // Track size changes for serialization
            const onResized = this.onResized;
            this.onResized = function(size) {
                const result = onResized?.apply(this, arguments);
                // Mark workflow as dirty when node is resized
                if (app?.extensionManager?.workflow?.activeWorkflow?.changeTracker?.checkState) {
                    app.extensionManager.workflow.activeWorkflow.changeTracker.checkState();
                }
                return result;
            };
        };
    }
});
