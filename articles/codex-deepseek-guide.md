# dsv4-cc-proxy v2.0：让 Codex 用上 DeepSeek V4 —— Responses API 协议翻译完全指南

> dsv4-cc-proxy v2.0 重大更新：新增 OpenAI Responses API ↔ DeepSeek Chat Completions 协议翻译引擎，让 Codex CLI 零侵入接入 DeepSeek V4 国内模型。本文深度剖析协议转换的 5 层处理流水线、模型名映射策略，以及国内模型在 Codex 中的正确显示方案。

---

## 一、dsv4-cc-proxy 回顾

[dsv4-cc-proxy](https://github.com/hosheali/dsv4-cc-proxy) 是一个轻量级本地代理（Starlette + httpx，核心代码不到 700 行），最初为解决 Claude Code 与 DeepSeek V4 Anthropic 兼容 API 之间的 3 个协议差异而生：

| # | 问题 | 修复方式 |
|---|------|---------|
| 1 | tool_use 消息缺少 thinking 块导致 400 | 请求端自动注入空 thinking 块 |
| 2 | DeepSeek 无条件返回 thinking SSE 事件导致 Tool result missing | 响应端剥离 thinking 事件 |
| 3 | Claude Code 默认 `thinking.type=adaptive` 不被 DeepSeek 支持 | 标准化为 `disabled`/`enabled` |

代理监听 `localhost:16889`，Claude Code 只需设置 `ANTHROPIC_BASE_URL=http://localhost:16889` 即可使用。

---

## 二、v2.0 全新功能：Codex 协议翻译引擎

### 2.1 为什么需要这个功能

Claude Code 可以集成 Codex CLI 作为子智能体执行复杂任务。Codex 使用 OpenAI 的 **Responses API**（`POST /v1/responses`），而 DeepSeek 仅提供 **Chat Completions API**（`POST /chat/completions`）。两种 API 在以下维度完全不兼容：

| 差异维度 | Responses API (Codex) | Chat Completions (DeepSeek) |
|---------|----------------------|---------------------------|
| **端点** | `/v1/responses` | `/chat/completions` |
| **请求体结构** | `input[]` 数组 + `instructions` | `messages[]` 数组 + `system` |
| **工具调用格式** | 扁平 `{type, name, description, parameters}` | 嵌套 `{type, function: {name, description, parameters}}` |
| **工具调用历史** | `function_call` + `function_call_output` item | `tool_calls` 附加到 assistant + `tool` role |
| **推理内容** | `reasoning` item 类型 | `reasoning_content` 字段嵌入 assistant |
| **SSE 事件体系** | `response.output_text.delta` 等专属事件 | 标准 `choices[0].delta` 格式 |
| **模型名** | OpenAI 模型名（gpt-5-codex 等） | DeepSeek 模型名（deepseek-v4-pro 等） |

直接配置无法工作。dsv4-cc-proxy v2.0 在同一个代理进程中内置了完整的 **Responses API ↔ Chat Completions 协议翻译引擎**，让 Codex 可以通过代理无缝使用 DeepSeek V4。

### 2.2 架构全景

```
┌──────────┐     POST /v1/responses     ┌─────────────────────┐     POST /chat/completions    ┌──────────────┐
│  Codex   │ ─────────────────────────→ │   dsv4-cc-proxy     │ ────────────────────────────→ │  DeepSeek    │
│  CLI     │                            │   localhost:16889    │                               │  V4 API      │
│          │ ←───────────────────────── │                      │ ←──────────────────────────── │              │
└──────────┘     Responses API SSE/JSON │  5 层处理流水线       │     Chat Completions 响应     └──────────────┘
                                        └──────────────────────┘
                                                  │
                              ┌───────────────────┼───────────────────┐
                              │                   │                   │
                              ▼                   ▼                   ▼
                         translate.py          tools.py            sse.py
                        (请求翻译引擎)      (工具格式转换)      (SSE 状态机)
                              │                   │                   │
                              └───────────────────┼───────────────────┘
                                                  │
                                                  ▼
                                            config.py
                                         (模型名映射策略)
```

**代理在 `/v1/responses` 路由处拦截请求，经过 5 层顺序处理**：

```
Responses API 请求
    │
    ▼
[1] translate_request()       ← 请求体结构翻译
    │
    ▼
[2] convert_tools()           ← 工具定义格式转换 + Schema 清理
    │
    ▼
[3] resolve_model()           ← 模型名映射（CODEX_MODEL_MAP）
    │
    ▼
[4] 发送到 DeepSeek Chat Completions
    │
    ▼
[5] translate_sse_stream()    ← SSE 事件流翻译（流式）
    或 _translate_chat_to_responses()  ← JSON 翻译（非流式）
```

---

## 三、5 层处理流水线详解

### 第 1 层：请求体结构翻译 (`translate.py`)

将 Responses API 的 `input[]` 数组翻译为 Chat Completions 的 `messages[]` 数组。

**核心翻译规则**：

```python
# translate_request() 处理流程

输入: Responses API 请求体
{
  "instructions": "你是一个编程助手",    # ① 提取并合并到 system
  "input": [
    {"type": "message", "role": "developer", "content": "..."},  # ② → system
    {"type": "message", "role": "user", "content": "分析这个文件"},
    {"type": "message", "role": "assistant", "content": "好的"},
    {"type": "function_call", "id": "fc_1", "name": "read_file", "arguments": "{\"path\":\"main.py\"}"},
    {"type": "function_call_output", "call_id": "fc_1", "output": "print('hello')"},
    {"type": "reasoning", "content": [{"type": "reasoning_text", "text": "用户想要..."}]}
  ],
  "tools": [...],
  "model": "claude-sonnet-4-6",
  "reasoning": {"effort": "medium"}
}

输出: Chat Completions 请求体
{
  "messages": [
    {"role": "system", "content": "你是一个编程助手\n\n..."},   # instructions + developer 合并
    {"role": "user", "content": "分析这个文件"},
    {"role": "assistant", "content": "好的", "tool_calls": [      # function_call → tool_calls 附加
      {"id": "fc_1", "type": "function", "function": {"name": "read_file", "arguments": "..."}}
    ], "reasoning_content": "用户想要..."},                       # reasoning → reasoning_content
    {"role": "tool", "tool_call_id": "fc_1", "content": "..."}    # function_call_output → tool role
  ],
  "tools": [...],                   # 经 convert_tools() 转换后
  "model": "deepseek-v4-pro",       # resolve_model() 映射后
  "thinking": {"type": "enabled"}   # reasoning.effort → thinking
}
```

**关键处理细节**：

- **instructions + developer role 合并**：两条路径的内容用 `\n\n` 连接为单条 system 消息
- **function_call → tool_calls**：找到前一条 assistant 消息，将 `function_call` 的 id/name/arguments 附加到其 `tool_calls` 列表中；如果前方没有 assistant，则创建合成 assistant 消息
- **reasoning → reasoning_content**：收集所有 `reasoning_text` 块，拼接后注入到最后一条 assistant 消息的 `reasoning_content` 字段
- **后处理**：确保所有含 `tool_calls` 的 assistant 消息都包含 `reasoning_content` 字段（DeepSeek 的硬性要求），缺失则注入空字符串

### 第 2 层：工具格式转换 (`tools.py`)

Codex 发送的工具定义使用 Responses API 的**扁平格式**，DeepSeek 需要 **嵌套格式**。同时 DeepSeek 对 JSON Schema 字段有严格限制。

```python
# 格式转换
输入 (Responses API 扁平格式):
{"type": "function", "name": "read_file", "description": "...", "parameters": {...}}

输出 (Chat Completions 嵌套格式):
{"type": "function", "function": {"name": "read_file", "description": "...", "parameters": {...}}}

# Schema 清理：递归剥离 8 个不兼容字段
REMOVED_KEYS = {default, readOnly, writeOnly, examples, minLength, maxLength, minItems, maxItems}

# 非 function 类型工具直接过滤
# 如 namespace、web_search 等 → DeepSeek 不支持，过滤并记录日志
```

### 第 3 层：模型名映射 (`config.py`)

Codex 发送的模型名（如 `claude-sonnet-4-6`、`gpt-5-codex` 等）需要映射为 DeepSeek 模型名。代理实现了**四层解析策略**：

```
resolve_model("claude-sonnet-4-6")
  │
  ├─ 1. 已是 deepseek-* 开头的原生模型名？ → 直接透传
  │   例: "deepseek-v4-pro" → "deepseek-v4-pro"
  │
  ├─ 2. CODEX_MODEL_MAP 精确匹配
  │   例: CODEX_MODEL_MAP='{"claude-sonnet-4-6":"deepseek-v4-pro"}'
  │   "claude-sonnet-4-6" → "deepseek-v4-pro"
  │
  ├─ 3. 最长前缀匹配
  │   例: CODEX_MODEL_MAP='{"claude-sonnet":"deepseek-v4-flash"}'
  │   "claude-sonnet-4-6" → "deepseek-v4-flash"
  │
  └─ 4. 回退到 CODEX_DEFAULT_MODEL（默认 deepseek-v4-pro）
```

**配置方式**：

```bash
# 精确映射：特定模型名 → DeepSeek 对应模型
export CODEX_MODEL_MAP='{"claude-sonnet-4-6":"deepseek-v4-pro","gpt-5-codex":"deepseek-v4-flash"}'

# 前缀批量映射：claude-sonnet 系列统一 → deepseek-v4-flash
export CODEX_MODEL_MAP='{"claude-sonnet":"deepseek-v4-flash"}'

# 默认模型（映射失败时的兜底）
export CODEX_DEFAULT_MODEL="deepseek-v4-pro"
```

### 第 4 层：发送到 DeepSeek

翻译完成的请求通过 httpx 异步客户端发送到 DeepSeek Chat Completions API。

### 第 5 层：响应翻译

**流式响应**：通过 `sse.py` 的**有状态翻译引擎**将 Chat Completions SSE delta 事件转换为 Responses API 标准事件序列。

```
DeepSeek SSE 流                          Codex 接收的 Responses API SSE
═══════════════                          ════════════════════════════════
                                          event: response.created
                                          event: response.in_progress

data: {"choices":[{"delta":              event: response.output_item.added
  {"reasoning_content":"..."}}]}         event: response.reasoning_text.delta (×N)
                                          event: response.output_item.done

data: {"choices":[{"delta":              event: response.output_item.added
  {"content":"Hello"}}]}                 event: response.content_part.added
                                          event: response.output_text.delta (×N)
                                          event: response.output_item.done

data: {"choices":[{"delta":              event: response.output_item.added
  {"tool_calls":[{"index":0,...}]}}]}    event: response.function_call_arguments.delta (×N)
                                          event: response.function_call_arguments.done
                                          event: response.output_item.done

data: {"choices":[{"finish_reason":      event: response.completed
  "stop"}],"usage":{...}}}
```

**关键设计**：

- **类型转换追踪**：状态机追踪当前输出类型（reasoning/text/tool_call），在类型切换时自动插入 `output_item.done` + `output_item.added` 事件
- **多工具并行**：通过 `_ToolCallState` 追踪多个活跃工具调用的独立事件流，每个工具调用有独立的 item_id 和 output_index
- **finish_reason 幂等保护**：防止重复发送 `response.completed`
- **异常优雅降级**：翻译异常时仍发送 `response.completed` 保证 SSE 流正常关闭

**非流式响应**：直接将 Chat Completions JSON 翻译为 Responses API 格式的 JSON body，包括 usage 字段名翻译（`prompt_tokens` → `input_tokens`）。

---

## 四、国内模型在 Codex 中的正确显示

Codex CLI 通过 `/v1/models` 或 `model_catalog_json` 文件获知可用模型列表。直连 DeepSeek 时，Codex 无法获取国内模型信息，导致 `/model` 命令显示异常或无法切换。

dsv4-cc-proxy v2.0 内置了**模型目录系统**，提供两种格式的模型列表：

### 4.1 `/v1/models` 端点（OpenAI 标准格式）

```
GET /v1/models → 返回 OpenAI 标准模型列表
```

```json
{
  "object": "list",
  "data": [
    {"id": "deepseek-v4-pro", "object": "model", "created": ..., "owned_by": "deepseek"},
    {"id": "deepseek-v4-flash", "object": "model", "created": ..., "owned_by": "deepseek"}
  ]
}
```

Codex 配置中指定 `OPENAI_BASE_URL=http://localhost:16889` 后，Codex 会自动从该端点拉取模型列表，`/model` 命令即可显示 DeepSeek 模型。

### 4.2 `/model-catalog` 端点（Codex 专属格式）

```
GET /model-catalog → 返回 Codex model_catalog_json 格式
```

该端点返回 Codex CLI 原生支持的模型目录 JSON，包含完整的能力声明和定价信息：

```json
{
  "models": [{
    "slug": "deepseek-v4-pro",
    "display_name": "DeepSeek V4 Pro",
    "provider": "deepseek-proxy",
    "context_window": 131072,
    "max_output": 16384,
    "capabilities": {
      "function_calling": true,
      "parallel_tool_calls": true,
      "extended_thinking": true
    },
    "supported_reasoning_levels": [
      {"effort": "low", "description": "快速响应，轻度推理"},
      {"effort": "medium", "description": "速度与推理深度的平衡"},
      {"effort": "high", "description": "更深推理，适合复杂问题"}
    ],
    "pricing": {"input": 2.19, "output": 8.76}
  }]
}
```

**使用方式**：

```bash
# 方式一：在 Codex config.toml 中引用代理端点
# Codex 启动时自动拉取

# 方式二：导出为静态 JSON 文件
curl http://localhost:16889/model-catalog > ~/.codex/models.json

# 在 ~/.codex/config.toml 中引用
# model_catalog_json = "/Users/you/.codex/models.json"
```

### 4.3 预定义模型清单

| slug | display_name | 适用场景 | 上下文 | 最大输出 | 支持思考 |
|------|-------------|---------|--------|---------|---------|
| `deepseek-v4-pro` | DeepSeek V4 Pro | 复杂编码、架构设计、深度分析 | 128K | 16K | ✅ |
| `deepseek-v4-flash` | DeepSeek V4 Flash | 日常编码、批量请求、高性价比 | 128K | 16K | ❌ |

> 模型定义在 `dsv4_cc_proxy/codex/models.py` 的 `MODEL_DEFINITIONS` 中，作为**唯一数据源**同时驱动 `/v1/models` 和 `/model-catalog` 两个端点。需要添加更多模型（如 deepseek-reasoner）时，只需在 `MODEL_DEFINITIONS` 中追加一个字典即可。

---

## 五、Codex 完整配置指南

### 5.1 启动代理

```bash
# pip 安装（推荐）
pip install dsv4-cc-proxy
dsv4-cc-proxy

# Homebrew（macOS）
brew install hosheali/tap/dsv4-cc-proxy
brew services start hosheali/tap/dsv4-cc-proxy

# Docker
docker run -d -p 16889:16889 --name dsv4-cc-proxy hosheali/dsv4-cc-proxy:latest
```

### 5.2 配置环境变量（可选）

```bash
# 默认模型（Codex 请求中未指定模型时使用）
export CODEX_DEFAULT_MODEL="deepseek-v4-pro"

# 模型名映射表（JSON 格式）
export CODEX_MODEL_MAP='{"claude-sonnet-4-6":"deepseek-v4-pro","claude-haiku-4-5":"deepseek-v4-flash"}'

# 上游 API 地址
export CODEX_UPSTREAM="https://api.deepseek.com/v1"
```

### 5.3 配置 Codex CLI

编辑 `~/.codex/config.toml`：

```toml
# 使用 deepseek-v4-pro 作为默认模型
model = "deepseek-v4-pro"
model_provider = "deepseek-proxy"

[model_providers."deepseek-proxy"]
name = "DeepSeek V4 (via dsv4-cc-proxy)"
api_base_url = "http://127.0.0.1:16889/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"

# 引用模型目录（使 /model 命令正确显示模型信息）
model_catalog_json = "http://127.0.0.1:16889/model-catalog"
```

**关键配置说明**：

- `wire_api = "responses"` 必须设置——Codex 只认这个值，协议转换由代理完成
- `api_base_url` 指向代理的 `127.0.0.1:16889/v1`
- `OPENAI_API_KEY` 环境变量设置为 DeepSeek API Key
- `model_catalog_json` 指向代理的 `/model-catalog` 端点，或先导出为本地 JSON 文件

### 5.4 设置 API Key

```bash
# 方式一：环境变量
export OPENAI_API_KEY="sk-your-deepseek-api-key"

# 方式二：通过 cc-switch-config 管理（推荐多项目场景）
npm install -g cc-switch-config
cc-config config add
# → 名称: "deepseek-codex"
# → 提供商类型: 自定义
# → OPENAI_BASE_URL: http://localhost:16889
# → OPENAI_API_KEY: sk-your-deepseek-api-key
```

### 5.5 验证

```bash
# 1. 确认代理运行
curl http://localhost:16889/health
# → {"status":"ok","version":"2.0.0","upstream":"https://api.deepseek.com/anthropic"}

# 2. 检查模型列表
curl http://localhost:16889/v1/models
# → {"object":"list","data":[{"id":"deepseek-v4-pro",...},{"id":"deepseek-v4-flash",...}]}

# 3. 启动 Codex，执行 /model 命令
codex
/model
# 应显示：deepseek-v4-pro (DeepSeek V4 Pro) — 当前活跃

# 4. 测试工具调用
# 输入："帮我读取当前目录下所有 .py 文件并汇总行数"
# Codex 应能正常调用 bash 工具并返回结果
```

---

## 六、Codex 配置 cc-switch-config 实现多项目管理

如果同时维护多个 Codex 项目，每个可能需要不同的 DeepSeek 模型或 API Key，手动修改 `config.toml` 会很繁琐。[cc-switch-config](https://github.com/HosheaLi/cc-switch-config)（npm 包，仅 135 KB）可以大幅简化：

```bash
# 安装
npm install -g cc-switch-config

# 创建 Codex 配置模板
cc-config config add
# → 名称: "codex-deepseek-pro"
# → 模式: 独立模式 (granular)
# → OPENAI_BASE_URL: http://localhost:16889
# → OPENAI_API_KEY: sk-xxxxx

cc-config config add
# → 名称: "codex-deepseek-flash"
# → OPENAI_BASE_URL: http://localhost:16889
# → OPENAI_API_KEY: sk-xxxxx

# 应用到项目
cc-config codex-deepseek-pro     # 切到 Pro
cc-config codex-deepseek-flash   # 切到 Flash
```

dsv4-cc-proxy 解决**协议翻译**问题，cc-switch-config 解决**配置切换**问题——两者互补。

---

## 七、与非代理方案的对比

| 方案 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **dsv4-cc-proxy v2.0** | 本地代理，双向协议翻译 | 对 Claude Code/Codex 完全透明；一个代理服务两端（Anthropic API + Responses API）；模型名正确显示 | 需本地运行代理进程 |
| CC-Switch 本地路由 | GUI 工具内置协议转换 | 多工具管理（Claude Code + Codex + Cursor） | 安装体积大（Electron）；链路黑盒；不开源核心逻辑 |
| 独立桥接脚本 | 社区 Python/Node.js 脚本 | 轻量、代码可见 | 功能单一；无模型目录支持；维护不稳定 |
| 直接改 base_url | 指向 DeepSeek 官方地址 | 零额外组件 | 协议完全不兼容，Agent spawn 场景不可用 |

**dsv4-cc-proxy 的独特优势**：

- **同时服务于两个工具**：同一代理进程，Claude Code 走 Anthropic 修复逻辑，Codex 走 Responses API 翻译逻辑
- **模型名原生显示**：内置 `/v1/models` 和 `/model-catalog` 端点，Codex 的 `/model` 命令可直接显示 "DeepSeek V4 Pro" 而非乱码
- **纯函数设计**：翻译模块 (`translate.py` / `tools.py` / `sse.py`) 均为纯函数设计，deepcopy 保护输入，不产生副作用
- **测试覆盖充分**：Codex 模块 88 个单元测试，覆盖率 92%+

---

## 八、常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| Codex 报 `connection refused` | 代理未启动 | `dsv4-cc-proxy` 启动代理；`curl localhost:16889/health` 验证 |
| Codex `/model` 看不到 DeepSeek | 模型目录未配置 | `curl localhost:16889/v1/models` 验证端点；确认 `OPENAI_BASE_URL` 指向代理 |
| 模型名显示为 `gpt-5-codex` 等 | 模型名未被 CODEX_MODEL_MAP 命中 | 添加精确映射或前缀映射；也可在 Codex 中直接 `/model deepseek-v4-pro` |
| 工具调用报 400 | JSON Schema 包含不兼容字段 | 代理已自动剥离 default/readOnly/writeOnly 等 8 个字段，确认代理版本 ≥ 2.0.0 |
| usage 显示异常 | DeepSeek 字段名与 Responses API 不同 | 代理已自动翻译 prompt_tokens→input_tokens，确认代理版本 ≥ 2.0.0 |
| DeepSeek 返回 401 | API Key 错误 | 检查 `OPENAI_API_KEY` 环境变量；确认 Key 有余额 |

---

## 九、总结

dsv4-cc-proxy v2.0 将能力从单一的 Claude Code Anthropic API 修复，扩展为**同时支持 Anthropic Messages API 和 OpenAI Responses API 的双协议代理**。升级后，同一代理实例即可让 **Claude Code + Codex 双工具**都稳定运行在 DeepSeek V4 上。

| 项目 | 地址 | 用途 |
|------|------|------|
| dsv4-cc-proxy | https://github.com/hosheali/dsv4-cc-proxy | 协议兼容代理（支持 Claude Code + Codex） |
| cc-switch-config | https://github.com/HosheaLi/cc-switch-config | API 配置管理 CLI/TUI 工具 |

两个项目均在 GitHub 开源（MIT 协议），欢迎 Star、Issue 和 PR。

---

*参考资料：*
- *[DeepSeek Thinking Mode 官方文档](https://api-docs.deepseek.com/guides/thinking_mode)*
- *[OpenAI Responses API 参考](https://platform.openai.com/docs/api-reference/responses)*
- *[Codex CLI 官方文档](https://platform.openai.com/docs/guides/codex)*
- *[dsv4-cc-proxy 项目仓库](https://github.com/hosheali/dsv4-cc-proxy)*
- *[cc-switch-config 项目仓库](https://github.com/HosheaLi/cc-switch-config)*
