class AICodeGenNode:

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
            },
            "optional": {
                "rich_text": ("X-FluxAgent.RichTextWidget", {"default": "Your code", "readOnly": True}),
            },
            "hidden": {
                "node_id": "UNIQUE_ID",
                "prompt": "PROMPT", 
                "extra_pnginfo": "EXTRA_PNGINFO",
            }
        }
    
    RETURN_TYPES = ("STRING",)

    FUNCTION = "process"
    CATEGORY = "X-FluxAgent"
    OUTPUT_NODE = True

    def process(self, **kw):
        # the dynamically created input data will be in the dictionary kwargs
        node_id = kw.get('node_id', 0)
        print(f'Processing AICodeGenNode with node_id: {node_id}')

        #for k, v in kw.items():
        #    print(f'{k} => {v}')
        
        inputs = []
        outputs = []

        extra_pnginfo = kw.get('extra_pnginfo', {})
        
        
        # Parse outputs from workflow data
        if extra_pnginfo and 'workflow' in extra_pnginfo:
            workflow = extra_pnginfo['workflow']
            if 'nodes' in workflow:
                for node in workflow['nodes']:
                    if str(node.get('id')) == node_id:
                        node_inputs = node.get('inputs', [])
                        for input in node_inputs:
                            inputs.append({
                                "name": input.get('name', ''),
                                "type": input.get('type', 'ANY')
                            })
                        node_outputs = node.get('outputs', [])
                        for output in node_outputs:
                            outputs.append({
                                "name": output.get('name', ''),
                                "type": output.get('type', 'ANY')
                            })
                        break
        
        print(f"inputs => {inputs}")
        print(f"outputs => {outputs}")
        
        # This is a placeholder for the actual code generation logic
        # You can implement your own code generation logic here
        generated_code = "Generated code goes here"
        
        # Return the generated code as a string
        return (generated_code,)
    
    # Node registration
NODE_CLASS_MAPPINGS = {
    "X-FluxAgent.AICodeGenNode": AICodeGenNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "X-FluxAgent.AICodeGenNode": "AI CodeGen Node"
}