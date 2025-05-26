# 📁 X-FluxAgent Project Structure Guide

[中文版本](PROJECT_STRUCTURE_zh_CN.md)

This document provides a comprehensive overview of the X-FluxAgent project structure for developers who want to contribute to the project. Understanding this structure is essential for effective development and contribution.

## 🎯 Project Overview

X-FluxAgent is a ComfyUI extension that transforms ComfyUI into a universal AI coding agent. The project follows a modular structure that separates core functionality, user-generated content, and supporting libraries.

## 📂 Root Directory Structure

```
X-ComfyUI-Extension/
├── __init__.py                 # Main entry point - auto-loads nodes from fluxagent/ and nodes/
├── requirements.txt            # Python dependencies
├── LICENSE                     # AGPL-3.0 license
├── README.md                   # Main project documentation (English)
├── README_zh_CN.md            # Main project documentation (Chinese)
├── CONTRIBUTION_TERM.md        # Contribution terms and copyright assignment
├── PROJECT_STRUCTURE.md       # This file - project structure guide (English)
├── PROJECT_STRUCTURE_zh_CN.md # Project structure guide (Chinese)
└── .env                       # Environment variables (not in repo)
```

## 🧩 Core Directories

### 📦 `/fluxagent/` - Core Extension Code
**Purpose**: Contains the main X-FluxAgent functionality and built-in nodes

```
fluxagent/
├── __init__.py              # Package initialization
├── README.md               # "X-FluxAgent source code directory"
├── AICodeGenNode.py        # AI-powered code generation node
├── OpenaiChatNode.py       # OpenAI/LLM integration node
├── RichTextNode.py         # Rich text editing and display node
├── SaveTextNode.py         # Text file saving functionality
└── utils/                  # Core utilities and helpers
    ├── __init__.py
    ├── AnyType.py          # Type handling utilities for ComfyUI
    └── HotReload.py        # Development hot-reload functionality
```

**For Contributors**: 
- Add new core nodes here
- Follow the naming convention: `[Feature]Node.py`
- Ensure each node exports `NODE_CLASS_MAPPINGS` and `NODE_DISPLAY_NAME_MAPPINGS`

### 🌐 `/js/` - Frontend JavaScript Code
**Purpose**: Contains all frontend JavaScript code for custom ComfyUI widgets

```
js/
├── fluxagent/              # Core X-FluxAgent frontend components
│   ├── README.md          # "X-FluxAgent js source code directory"
│   ├── AICodeGenNode.js   # Frontend for AI code generation
│   ├── codemirror_bundle.js # Bundled CodeMirror editor
│   ├── RichTextNode.js    # Frontend for rich text editing
│   └── RichTextWidget.js  # Rich text widget implementation
└── user/                  # User-generated frontend code
    └── README.md          # "User-created node js files will be placed here"
```

**For Contributors**:
- Match JavaScript filenames with their Python counterparts
- Use modern ES6+ syntax
- Follow ComfyUI widget conventions

### 👤 `/user/` - User-Generated Content
**Purpose**: Directory for user-created nodes and AI-generated content

```
user/
├── __init__.py             # Makes directory a Python package
├── README.md              # "User-created node files will be placed here"
└── generated/             # AI-generated nodes directory
    ├── __init__.py
    └── README.md          # "Nodes created by x-fluxagent automatically"
```

**For Contributors**:
- This directory is automatically managed
- Users' custom nodes will be placed here
- AI-generated nodes go in the `generated/` subdirectory

### 📝 `/nodes/` - Additional Node Directory
**Purpose**: Alternative location for ComfyUI nodes (currently empty but supported)

```
nodes/                      # Currently empty but scanned by load_nodes()
```

**For Contributors**:
- Alternative to `/fluxagent/` for organizing nodes
- Useful for categorizing different types of functionality

## 🛠 Supporting Directories

### 📚 `/libs/` - External Libraries and Tools
**Purpose**: Contains external libraries and build tools

```
libs/
└── codemirror/            # CodeMirror editor setup and build tools
    ├── package.json       # npm dependencies for CodeMirror
    ├── READEME.md        # Setup instructions for building CodeMirror
    └── src/
        └── index.js       # CodeMirror entry point for bundling
```

**For Contributors**:
- Add third-party JavaScript libraries here
- Include build instructions in README files
- Keep bundled files in appropriate directories

### 💬 `/prompts/` - AI Prompts Collection
**Purpose**: Stores AI prompts used for code generation

```
prompts/
└── README.md              # "AI prompts for coding will be placed here"
```

**For Contributors**:
- Add reusable AI prompts here
- Organize by functionality or node type
- Document prompt usage and parameters

### 🎨 `/assets/` - Project Assets
**Purpose**: Contains images, demos, and other static assets

```
assets/
├── demo.png               # Main demo screenshot
└── demo-cfg.png          # Configuration demo screenshot
```

**For Contributors**:
- Add screenshots, diagrams, and documentation images here
- Use descriptive filenames
- Optimize images for documentation

### 🔬 `/research/` - Research and Experiments
**Purpose**: Testing and research code (not production)

```
research/
└── README.md              # "This folder is used for testing and research only"
```

**For Contributors**:
- Experimental code goes here
- Not included in main functionality
- Document research findings

### 🧪 `/test/` - Test Cases
**Purpose**: Unit tests and integration tests

```
test/
└── README.md              # "This folder is used for test cases"
```

**For Contributors**:
- Add unit tests for your nodes
- Follow Python testing conventions
- Include integration tests for workflows

## 🔄 How the System Works

### Node Loading Process (`__init__.py`)
1. **Auto-discovery**: Scans `/fluxagent/` and `/nodes/` directories recursively
2. **Module loading**: Imports all `.py` files (except `__init__.py`)
3. **Registration**: Collects `NODE_CLASS_MAPPINGS` and `NODE_DISPLAY_NAME_MAPPINGS`
4. **Integration**: Makes nodes available to ComfyUI

### File Naming Conventions
- **Python nodes**: `[Feature]Node.py` (e.g., `AICodeGenNode.py`)
- **JavaScript widgets**: `[Feature]Node.js` (matching Python names)
- **README files**: Always `README.md` in each directory
- **Utilities**: Descriptive names in PascalCase

### Development Workflow
1. **Core development**: Work in `/fluxagent/` directory
2. **Frontend components**: Add corresponding JavaScript in `/js/fluxagent/`
3. **Testing**: Add tests in `/test/` directory
4. **Documentation**: Update relevant README files

## 🎯 Key Files for Contributors

### Essential Files to Understand
- `__init__.py` - Main entry point and node loading logic
- `fluxagent/[Any]Node.py` - Example node implementations
- `js/fluxagent/[Any]Node.js` - Frontend widget examples
- `fluxagent/utils/AnyType.py` - ComfyUI type system utilities

### Configuration Files
- `requirements.txt` - Python dependencies
- `libs/codemirror/package.json` - JavaScript dependencies
- `.env` - Environment variables (create locally)

## 🚀 Getting Started for Contributors

1. **Clone the repository** into your ComfyUI `custom_nodes/` directory
2. **Install dependencies**: `pip install -r requirements.txt`
3. **Study existing nodes** in `/fluxagent/` directory
4. **Read the main README** for project context and goals
5. **Check CONTRIBUTION_TERM.md** for contribution guidelines

## 🔮 Future Structure Considerations

As the project grows, consider:
- **Node categorization** by functionality
- **Plugin system** for third-party nodes
- **API documentation** for node development
- **Automated testing** pipeline
- **Build system** for JavaScript bundling

---

**Happy Contributing! 🎉**

For questions about the project structure, join our Discord community or open an issue on GitHub.
