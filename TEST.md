# 本地测试指南

## 前置条件

```bash
npm link          # 全局链接（仅首次）
npm run build     # 构建最新代码
```

## CLI 命令

```bash
# 基础
cc-config --version
cc-config --help

# 列表
cc-config list
cc-config list --json
cc-config config list
cc-config config list --json

# 状态
cc-config current
cc-config current --json

# 扫描
cc-config scan ~/code
cc-config scan ~/code --json

# 注册 (需 .claude/ 目录)
cc-config register ~/code/P07_CCAPISwitch
cc-config register ~/code/P07_CCAPISwitch -t glm-5

# 切换
cc-config switch P07_CCAPISwitch glm-5

# 撤销
cc-config undo

# 取消注册
cc-config unregister P07_CCAPISwitch
cc-config unregister P07_CCAPISwitch --force

# 导入导出
cc-config export --stdout > /tmp/cc-export.json
cc-config import /tmp/cc-export.json

# 错误处理
cc-config import /nonexistent/file.json    # 友好错误
cc-config register /tmp                     # 拒绝无 .claude/
cc-config config remove nonexistent         # 配置不存在
```

## TUI 交互

```bash
cc-config
```

| 操作 | 按键 |
|------|------|
| 导航 | ↑↓ 或 j/k |
| 选择 | Enter |
| 取消/返回 | Escape |
| 模糊搜索 | / 或 f |
| 撤销(U) | U |
| 扫描(S) | S |

## 环境变量

```bash
NO_COLOR=1 cc-config list   # 禁用颜色
```

## 模拟用户安装

```bash
npm pack
mkdir -p /tmp/cc-test && cd /tmp/cc-test
npm init -y
npm install /Users/lihaoxuan/code/P07_CCAPISwitch/cc-config-switch-0.2.0.tgz
npx cc-config --version
```

## 清理

```bash
npm unlink -g cc-config-switch
rm cc-config-switch-0.2.0.tgz
```
