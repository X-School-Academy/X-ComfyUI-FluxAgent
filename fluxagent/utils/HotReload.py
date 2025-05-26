"""
Refer to https://github.com/logtd/ComfyUI-HotReloadHack/blob/main/__init__.py

ComfyUI Hot Reload Module
A simplified hot reload system for ComfyUI custom nodes.
"""

import os
import sys
import logging
import importlib
import importlib.util
from collections import defaultdict

import folder_paths
#from fluxagent import load_custom_node
from comfy_execution import caching

# ==============================================================================
# === GLOBALS ===
# ==============================================================================

RELOADED_CLASS_TYPES: dict = {}  # Stores types of classes that have been reloaded.
CUSTOM_NODE_ROOT: list[str] = folder_paths.folder_names_and_paths["custom_nodes"][0]  # Custom Node root directory list.

# ==============================================================================
# === SUPPORT FUNCTIONS ===
# ==============================================================================

def dfs(item_list: list, searches: set) -> bool:
    """
    Performs a depth-first search to find items in a list.

    :param item_list: The list of items to search through.
    :param searches: The set of search items to look for.
    :return: True if any search item is found, False otherwise.
    """
    for item in item_list:
        if isinstance(item, (frozenset, tuple)) and dfs(item, searches):
            return True
        elif item in searches:
            return True
    return False

# ==============================================================================
# === CORE RELOAD FUNCTIONALITY ===
# ==============================================================================

def reload_module(module_name: str) -> bool:
    """
    Reloads a ComfyUI custom node module and clears relevant caches.

    :param module_name: The name of the module to reload.
    :return: True if reload was successful, False otherwise.
    """
    try:
        # Find all dependent modules that should be reloaded
        reload_modules: list[str] = [
            mod_name for mod_name in sys.modules.keys()
            if module_name in mod_name and mod_name != module_name
        ]

        # Unload dependent modules first
        for reload_mod in reload_modules:
            if reload_mod in sys.modules:
                del sys.modules[reload_mod]

        # Unload the main module
        if module_name in sys.modules:
            del sys.modules[module_name]

        # Reload the module
        module_path_init: str = os.path.join(CUSTOM_NODE_ROOT[0], module_name, '__init__.py')
        
        if not os.path.exists(module_path_init):
            logging.error(f"Module init file not found: {module_path_init}")
            return False

        spec = importlib.util.spec_from_file_location(module_name, module_path_init)
        if spec is None:
            logging.error(f"Could not create spec for module: {module_name}")
            return False

        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)

        # Mark reloaded class types for cache clearing
        if hasattr(module, 'NODE_CLASS_MAPPINGS'):
            for key in module.NODE_CLASS_MAPPINGS.keys():
                RELOADED_CLASS_TYPES[key] = 3

        # Load the custom node
        module_path: str = os.path.join(CUSTOM_NODE_ROOT[0], module_name)
        #load_custom_node(module_path)
        
        logging.info(f'[ComfyUI-HotReload] Successfully reloaded module: {module_name}')
        return True

    except Exception as e:
        logging.error(f"[ComfyUI-HotReload] Failed to reload module {module_name}: {e}")
        return False

# ==============================================================================
# === MONKEY PATCHING ===
# ==============================================================================

# Store original function to avoid multiple patches
_original_set_prompt = None

def monkeypatch():
    """Apply necessary monkey patches for hot reloading cache management."""
    global _original_set_prompt
    
    # Only patch once
    if _original_set_prompt is not None:
        return
    
    _original_set_prompt = caching.HierarchicalCache.set_prompt

    def set_prompt(self, dynprompt, node_ids, is_changed_cache):
        """
        Custom set_prompt function to handle cache clearing for hot reloading.

        :param dynprompt: Dynamic prompt to set.
        :param node_ids: Node IDs to process.
        :param is_changed_cache: Boolean flag indicating if cache has changed.
        """
        if not hasattr(self, 'cache_key_set'):
            RELOADED_CLASS_TYPES.clear()
            return _original_set_prompt(self, dynprompt, node_ids, is_changed_cache)

        # Find cache keys that need to be cleared due to reloaded classes
        found_keys = []
        for key, item_list in self.cache_key_set.keys.items():
            if dfs(item_list, RELOADED_CLASS_TYPES):
                found_keys.append(key)

        # Decrement reload counters and clean up
        if len(found_keys):
            for value_key in list(RELOADED_CLASS_TYPES.keys()):
                RELOADED_CLASS_TYPES[value_key] -= 1
                if RELOADED_CLASS_TYPES[value_key] == 0:
                    del RELOADED_CLASS_TYPES[value_key]

        # Clear the cache for affected keys
        for key in found_keys:
            cache_key = self.cache_key_set.get_data_key(key)
            if cache_key and cache_key in self.cache:
                del self.cache[cache_key]
                del self.cache_key_set.keys[key]
                del self.cache_key_set.subcache_keys[key]
        
        return _original_set_prompt(self, dynprompt, node_ids, is_changed_cache)

    caching.HierarchicalCache.set_prompt = set_prompt

# ==============================================================================
# === PUBLIC API ===
# ==============================================================================

def reloadModule(module_name: str) -> bool:
    """
    Public API to hot reload a ComfyUI custom node module.
    
    :param module_name: The name of the module to reload.
    :return: True if reload was successful, False otherwise.
    """
    # Apply monkey patch if not already applied
    monkeypatch()
    
    # Reload the module
    return reload_module(module_name)