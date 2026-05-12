# Claude Code 多项目 API 配置管理实践

## 背景

Claude Code 的项目级配置文件 `.claude/settings.json` 中包含 API 提供商相关的环境变量。当同时维护多个项目，每个项目使用不同的 API 提供商（Anthropic 直连、OpenRouter 代理、自建转发等）时，每次切换项目都需要手动修改这些配置。这个过程重复且容易出错。

## 现状分析

Claude Code 使用以下环境变量控制 API 行为：

- `ANTHROPIC_BASE_URL` — API 端点地址
- `ANTHROPIC_AUTH_TOKEN` — 认证令牌
- `ANTHROPIC_MODEL` — 主模型
- `ANTHROPIC_DEFAULT_SONNET_MODEL` — Sonnet 默认模型
- `ANTHROPIC_DEFAULT_HAIKU_MODEL` — Haiku 默认模型
- `ANTHROPIC_DEFAULT_OPUS_MODEL` — Opus 默认模型
- `ANTHROPIC_REASONING_MODEL` — 推理模型
- `CLAUDE_CODE_SUBAGENT_MODEL` — Subagent 模型

这些变量写在 `.claude/settings.json` 或 `.claude/settings.local.json` 的 `env` 块中。不同项目对这些变量的取值各不相同，手动维护成本较高。

## 工具：cc-switch-config

基于上述场景，我写了一个 CLI/TUI 工具：[cc-switch-config](https://github.com/HosheaLi/cc-switch-config)。核心思路是：将 API 配置抽象为模板，按需应用到项目。

```bash
# 安装
npm install -g cc-switch-config

# 使用
cd ~/team-project && cc-config anthropic-direct
cd ~/personal-project && cc-config openrouter-proxy
```

### 设计原则

**精确替换**：只修改 `.claude/settings.local.json` 中的 `env` 和 `model` 字段，`permissions`、`hooks`、`mcpServers` 等其他配置完全保留。这样可以隔离 API 配置变更与其他项目配置的副作用。

> 注：cc-switch-config 始终写入 `settings.local.json`，包括目标为 `~/.claude` 目录时。这是 Claude Code 的项目级覆盖文件，读取优先级高于 `settings.json`。这样可以隔离 API 配置变更与 hooks、permissions 等其他配置。

**原子写入**：通过 write-rename 模式保证配置文件不会处于中间状态。每次操作前自动备份，支持 `cc-config undo` 回滚。

**安全约束**：API Key 以 password 类型输入，显示时脱敏，不传入 CLI 参数，不写入日志。

### 数据流

```
~/.config/cc-config/templates.json  ← 全局配置模板
  └── cc-config switch → 精确替换 .claude/settings.local.json 的 env/model 字段

~/.local/share/cc-config/backups/   ← 操作前自动备份
  └── cc-config undo → 恢复最近一次备份
```

### 使用流程

```bash
# 1. 创建配置模板
cc-config config add
# 可选统一模式（单模型名自动映射 6 个 env var）或独立模式（逐项指定）

# 2. 注册项目
cc-config register /path/to/project
# 或批量扫描
cc-config scan ~/code --register

# 3. 切换
cc-config switch <project> <config>
```

### 设计决策

1. **为什么不用环境变量覆盖**: 有的场景需要持久化配置（如团队共享 settings.json），有的是因为 `.claude/settings.json` 中的 env 优先级更高。直接写文件适用于所有场景。

2. **为什么不改其他字段**: 配置隔离——API 提供商变更不应影响权限、钩子、MCP 服务器等独立配置。最小修改原则降低了出问题的面和排查成本。

3. **为什么不做单文件全量替换**: 备份 + 精确字段替换 + 撤销的组合提供了足够的回退能力，全量替换反而增加了意外覆盖的风险。

### Shell 集成

```zsh
auto_cc_config() {
  [[ -f .claude/settings.json ]] && cc-config auto-check 2>/dev/null
}
chpwd_functions+=(auto_cc_config)
```

目录切换时自动校验配置是否正确。

## 适用场景

- 维护多个 Claude Code 项目，使用不同 API 提供商
- 团队需要共享配置模板
- 在直连、代理、转发间频繁切换
- 希望将 API 配置纳入版本控制或团队分发流程

## 链接

- GitHub: [github.com/HosheaLi/cc-switch-config](https://github.com/HosheaLi/cc-switch-config)
- npm: [www.npmjs.com/package/cc-switch-config](https://www.npmjs.com/package/cc-switch-config)
- 使用文档: [USAGE.md](https://github.com/HosheaLi/cc-switch-config/blob/main/USAGE.md)
