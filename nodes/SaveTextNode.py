import os
import folder_paths

class SaveTextNode:
    """
    A custom ComfyUI node that accepts a string input and saves it to a file on disk.
    """
    
    def __init__(self):
        self.output_dir = folder_paths.get_output_directory()
        self.type = "output"  # Identifies this node as an output node
        
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("STRING", {"forceInput": True}),  # The string content to save
                "filename": ("STRING", {"default": "output.txt"}),  # Default filename
                "append": (["False", "True"], {"default": "False"}),  # Option to append instead of overwrite
            },
            "optional": {
                "subfolder": ("STRING", {"default": ""}),  # Optional subfolder within output directory
            }
        }
    
    RETURN_TYPES = () 
    FUNCTION = "save_string"
    CATEGORY = "X-FluxAgent"  # Category the node appears under in UI
    OUTPUT_NODE = True  # Indicates this is an output node
    
    def save_string(self, text, filename, append, subfolder=""):
        # Create the subfolder if provided and doesn't exist
        if subfolder:
            save_dir = os.path.join(self.output_dir, subfolder)
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)
        else:
            save_dir = self.output_dir
        
        # Full path to the file
        file_path = os.path.join(save_dir, filename)
        
        # Determine write mode (append or overwrite)
        mode = "a" if append == "True" else "w"
        
        # Write the string to the file
        try:
            with open(file_path, mode, encoding="utf-8") as f:
                f.write(text)
            print(f"Successfully saved string to {file_path}")
        except Exception as e:
            print(f"Error saving string to file: {e}")
            
        # Return the file path
        return ()

# Register the node in ComfyUI
NODE_CLASS_MAPPINGS = {
    "X-FluxAgent.SaveTextNode": SaveTextNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "X-FluxAgent.SaveTextNode": "Save Text To File"
}
