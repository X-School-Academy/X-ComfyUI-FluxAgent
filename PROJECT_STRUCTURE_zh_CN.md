# 📁 X-FluxAgent 项目结构指南

[English Version](PROJECT_STRUCTURE.md)

本文档为希望为项目做出贡献的开发者提供了 X-FluxAgent 项目结构的全面概述。理解这个结构对于有效的开发和贡献至关重要。

## 🎯 项目概述

X-FluxAgent 是一个 ComfyUI 扩展，将 ComfyUI 转换为通用 AI 编码代理。项目采用模块化结构，分离了核心功能、用户生成内容和支持库。

## 📂 根目录结构

```
X-ComfyUI-Extension/
├── __init__.py                 # 主入口点 - 自动从 fluxagent/ 和 nodes/ 加载节点
├── requirements.txt            # Python 依赖
├── LICENSE                     # AGPL-3.0 许可证
├── README.md                   # 主项目文档（英文）
├── README_zh_CN.md            # 主项目文档（中文）
├── CONTRIBUTION_TERM.md        # 贡献条款和版权转让
├── PROJECT_STRUCTURE.md       # 项目结构指南（英文）
├── PROJECT_STRUCTURE_zh_CN.md # 本文件 - 项目结构指南（中文）
└── .env                       # 环境变量（不在仓库中）
```

## 🧩 核心目录

### 📦 `/fluxagent/` - 核心扩展代码
**用途**: 包含主要的 X-FluxAgent 功能和内置节点

```
fluxagent/
├── __init__.py              # 包初始化
├── README.md               # "X-FluxAgent source code directory"
├── AICodeGenNode.py        # AI 驱动的代码生成节点
├── OpenaiChatNode.py       # OpenAI/LLM 集成节点
├── RichTextNode.py         # 富文本编辑和显示节点
├── SaveTextNode.py         # 文本文件保存功能
└── utils/                  # 核心工具和助手
    ├── __init__.py
    ├── AnyType.py          # ComfyUI 类型处理工具
    └── HotReload.py        # 开发热重载功能
```

**贡献者须知**: 
- 在此添加新的核心节点
- 遵循命名约定：`[功能]Node.py`
- 确保每个节点导出 `NODE_CLASS_MAPPINGS` 和 `NODE_DISPLAY_NAME_MAPPINGS`

### 🌐 `/js/` - 前端 JavaScript 代码
**用途**: 包含自定义 ComfyUI 小部件的所有前端 JavaScript 代码

```
js/
├── fluxagent/              # 核心 X-FluxAgent 前端组件
│   ├── README.md          # "X-FluxAgent js source code directory"
│   ├── AICodeGenNode.js   # AI 代码生成前端
│   ├── codemirror_bundle.js # 打包的 CodeMirror 编辑器
│   ├── RichTextNode.js    # 富文本编辑前端
│   └── RichTextWidget.js  # 富文本小部件实现
└── user/                  # 用户生成的前端代码
    └── README.md          # "User-created node js files will be placed here"
```

**贡献者须知**:
- JavaScript 文件名要与对应的 Python 文件匹配
- 使用现代 ES6+ 语法
- 遵循 ComfyUI 小部件约定

### 👤 `/user/` - 用户生成内容
**用途**: 用户创建的节点和 AI 生成内容的目录

```
user/
├── __init__.py             # 使目录成为 Python 包
├── README.md              # "User-created node files will be placed here"
└── generated/             # AI 生成节点目录
    ├── __init__.py
    └── README.md          # "Nodes created by x-fluxagent automatically"
```

**贡献者须知**:
- 此目录由系统自动管理
- 用户的自定义节点将放置在此处
- AI 生成的节点放在 `generated/` 子目录中

### 📝 `/nodes/` - 附加节点目录
**用途**: ComfyUI 节点的替代位置（目前为空但受支持）

```
nodes/                      # 目前为空，但被 load_nodes() 扫描
```

**贡献者须知**:
- 作为 `/fluxagent/` 的替代方案来组织节点
- 有助于对不同类型的功能进行分类

## 🛠 支持目录

### 📚 `/libs/` - 外部库和工具
**用途**: 包含外部库和构建工具

```
libs/
└── codemirror/            # CodeMirror 编辑器设置和构建工具
    ├── package.json       # CodeMirror 的 npm 依赖
    ├── READEME.md        # 构建 CodeMirror 的设置说明
    └── src/
        └── index.js       # 用于打包的 CodeMirror 入口点
```

**贡献者须知**:
- 在此添加第三方 JavaScript 库
- 在 README 文件中包含构建说明
- 将打包文件保存在适当的目录中

### 💬 `/prompts/` - AI 提示集合
**用途**: 存储用于代码生成的 AI 提示

```
prompts/
└── README.md              # "AI prompts for coding will be placed here"
```

**贡献者须知**:
- 在此添加可重用的 AI 提示
- 按功能或节点类型组织
- 记录提示用法和参数

### 🎨 `/assets/` - 项目资源
**用途**: 包含图像、演示和其他静态资源

```
assets/
├── demo.png               # 主要演示截图
└── demo-cfg.png          # 配置演示截图
```

**贡献者须知**:
- 在此添加截图、图表和文档图像
- 使用描述性文件名
- 为文档优化图像

### 🔬 `/research/` - 研究和实验
**用途**: 测试和研究代码（非生产环境）

```
research/
└── README.md              # "This folder is used for testing and research only"
```

**贡献者须知**:
- 实验性代码放在这里
- 不包含在主要功能中
- 记录研究发现

### 🧪 `/test/` - 测试用例
**用途**: 单元测试和集成测试

```
test/
└── README.md              # "This folder is used for test cases"
```

**贡献者须知**:
- 为您的节点添加单元测试
- 遵循 Python 测试约定
- 包含工作流的集成测试

## 🔄 系统工作原理

### 节点加载过程 (`__init__.py`)
1. **自动发现**: 递归扫描 `/fluxagent/` 和 `/nodes/` 目录
2. **模块加载**: 导入所有 `.py` 文件（除了 `__init__.py`）
3. **注册**: 收集 `NODE_CLASS_MAPPINGS` 和 `NODE_DISPLAY_NAME_MAPPINGS`
4. **集成**: 使节点对 ComfyUI 可用

### 文件命名约定
- **Python 节点**: `[功能]Node.py` (例如：`AICodeGenNode.py`)
- **JavaScript 小部件**: `[功能]Node.js` (匹配 Python 名称)
- **README 文件**: 每个目录中总是 `README.md`
- **工具类**: 使用 PascalCase 的描述性名称

### 开发工作流
1. **核心开发**: 在 `/fluxagent/` 目录中工作
2. **前端组件**: 在 `/js/fluxagent/` 中添加相应的 JavaScript
3. **测试**: 在 `/test/` 目录中添加测试
4. **文档**: 更新相关的 README 文件

## 🎯 贡献者关键文件

### 需要理解的重要文件
- `__init__.py` - 主入口点和节点加载逻辑
- `fluxagent/[任意]Node.py` - 节点实现示例
- `js/fluxagent/[任意]Node.js` - 前端小部件示例
- `fluxagent/utils/AnyType.py` - ComfyUI 类型系统工具

### 配置文件
- `requirements.txt` - Python 依赖
- `libs/codemirror/package.json` - JavaScript 依赖
- `.env` - 环境变量（本地创建）

## 🚀 贡献者入门指南

1. **克隆仓库** 到您的 ComfyUI `custom_nodes/` 目录
2. **安装依赖**: `pip install -r requirements.txt`
3. **研究现有节点** 在 `/fluxagent/` 目录中
4. **阅读主 README** 了解项目背景和目标
5. **查看 CONTRIBUTION_TERM.md** 了解贡献指南

## 🔮 未来结构考虑

随着项目的发展，考虑：
- **按功能分类节点**
- **第三方节点的插件系统**
- **节点开发的 API 文档**
- **自动化测试** 流水线
- **JavaScript 打包的构建系统**

---

**贡献愉快！🎉**

如有关于项目结构的问题，请加入我们的 Discord 社区或在 GitHub 上提出 issue。
