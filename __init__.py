import os
import importlib.util
import glob
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
load_dotenv(os.path.join(current_dir, '.env'), override=True)

# Get the directory of the current file
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

# Path to the extension's directory
extension_dir = os.path.dirname(os.path.realpath(__file__))

# Path to the JavaScript directory
WEB_DIRECTORY = os.path.join(extension_dir, "js")

# Auto-discovery and loading of all Python files in the fluxagent and nodes directories
def load_nodes():
    # Directories to scan for node files
    scan_dirs = ["fluxagent", "user"]
    
    for dir_name in scan_dirs:
        target_dir = os.path.join(extension_dir, dir_name)
        if not os.path.exists(target_dir):
            continue
            
        # Recursively get all Python files in the directory and subdirectories (excluding __init__.py)
        node_files = glob.glob(os.path.join(target_dir, "**", "*.py"), recursive=True)
        node_files = [f for f in node_files if not f.endswith("__init__.py")]
        
        for file_path in node_files:
            try:
                # Create a unique module name using the relative path
                rel_path = os.path.relpath(file_path, extension_dir)
                module_name = rel_path.replace(os.sep, ".")[:-3]  # Remove .py extension and use dots
                
                spec = importlib.util.spec_from_file_location(module_name, file_path)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # If the module defines NODE_CLASS_MAPPINGS, update our mappings
                if hasattr(module, "NODE_CLASS_MAPPINGS"):
                    NODE_CLASS_MAPPINGS.update(module.NODE_CLASS_MAPPINGS)
                # If the module defines NODE_DISPLAY_NAME_MAPPINGS, update our mappings
                if hasattr(module, "NODE_DISPLAY_NAME_MAPPINGS"):
                    NODE_DISPLAY_NAME_MAPPINGS.update(module.NODE_DISPLAY_NAME_MAPPINGS)
                    
            except Exception as e:
                print(f"Warning: Failed to load node file {file_path}: {e}")

# Auto-load nodes when the extension is imported
load_nodes()

# This is what ComfyUI will use to register our nodes
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
