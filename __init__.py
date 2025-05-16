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

# Auto-discovery and loading of all Python files in the nodes directory
def load_nodes():
    nodes_dir = os.path.join(extension_dir, "nodes")
    # Get all Python files in the nodes directory (excluding __init__.py)
    node_files = glob.glob(os.path.join(nodes_dir, "*.py"))
    node_files = [f for f in node_files if not f.endswith("__init__.py")]
    
    for file_path in node_files:
        module_name = os.path.basename(file_path)[:-3]  # Remove .py extension
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # If the module defines NODE_CLASS_MAPPINGS, update our mappings
        if hasattr(module, "NODE_CLASS_MAPPINGS"):
            NODE_CLASS_MAPPINGS.update(module.NODE_CLASS_MAPPINGS)
        # If the module defines NODE_DISPLAY_NAME_MAPPINGS, update our mappings
        if hasattr(module, "NODE_DISPLAY_NAME_MAPPINGS"):
            NODE_DISPLAY_NAME_MAPPINGS.update(module.NODE_DISPLAY_NAME_MAPPINGS)

# Auto-load nodes when the extension is imported
load_nodes()

# This is what ComfyUI will use to register our nodes
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
