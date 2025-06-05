class RichTextNode:
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
                "required": {
                    "text_input": ("STRING", {
                        'forceInput': True,
                    }),
                },
                "optional": {
                    "rich_text": ("X-FluxAgent.RichTextWidget", {"default": "\n\n", "readOnly": True}),
                },
                "hidden": {
                    "node_id": "UNIQUE_ID"
                }
    
        }

    RETURN_TYPES = ("STRING",)
    FUNCTION = "process"
    CATEGORY = "X-FluxAgent"

    def process(self, text_input, node_id, rich_text = None):
        print(f"Processing text input for node_id: {node_id}")
        
        # data in ui is required to use array, node_id is a string, but it is number in js code
        return {"ui": {"node_id":  [node_id], "rich_text": [text_input]}, "result": (text_input, )}

# Register the node
NODE_CLASS_MAPPINGS = {
    "X-FluxAgent.RichTextNode": RichTextNode
}

# Set a display name for the node
NODE_DISPLAY_NAME_MAPPINGS = {
    "X-FluxAgent.RichTextNode": "Rich Text Node"
}