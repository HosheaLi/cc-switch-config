# 项目扫描功能增强设计

**日期：** 2026-05-08  
**状态：** Draft

## 问题背景

用户在使用项目扫描功能时发现三个问题：

1. **路径重复显示：** 扫描 `~/code` 时，`P01_quantitySmoke` 和其子项目 `quantitysmoke_app` 都显示，但无法区分父子关系
2. **缺少全选功能：** 选择项目注册时没有批量选择选项，手动逐个选择效率低
3. **无法识别已有配置：** 已有 API provider 配置的项目仍显示在列表中，可能被重复配置

## 设计目标

1. 清晰展示父子项目关系，用层级标记和视觉区分
2. 提供"全选"选项和快捷键提示，支持批量选择
3. 自动识别项目配置状态，三状态显示（新/未配置/已配置）

## 架构概览

### 改动范围

```
src/
├── lib/services/project-service.ts      # 扫描逻辑增强
├── lib/types/scan-result.ts (新增)     # ScanResult 类型定义集中
├── cli/prompts/components/select-project.ts  # 选择组件增强
├── cli/prompts/utils/format-choices.ts  # 格式化函数
└── cli/commands/scan.ts                 # 输出表格增强
```

### 类型定义

```typescript
// src/lib/types/scan-result.ts
export interface ScanResult {
  /** 项目路径 */
  path: string;
  /** 是否未注册 */
  isNew: boolean;
  /** 相对于扫描根目录的层级 */
  depth: number;
  /** 配置状态 */
  configStatus: 'new' | 'unconfigured' | 'configured';
  /** 父项目路径（子项目才有） */
  parentPath?: string;
  /** 当前使用的 provider 名称 */
  activeProvider?: string;
}
```

## 详细设计

### 1. 扫描逻辑增强

#### ProjectService 新增方法

```typescript
/**
 * 检查项目的配置状态
 */
private async checkConfigStatus(projectPath: string): Promise<{
  status: 'new' | 'unconfigured' | 'configured';
  activeProvider?: string;
}> {
  const settingsPath = path.join(projectPath, '.claude', 'settings.json');
  
  if (!await fs.pathExists(settingsPath)) {
    return { status: 'unconfigured' };
  }
  
  const settings = await fs.readJson(settingsPath);
  
  if (settings.apiProvider) {
    return {
      status: 'configured',
      activeProvider: settings.apiProvider,
    };
  }
  
  return { status: 'unconfigured' };
}
```

#### scanProjects() 改动

- `walkDirectory` 传递 `depth` 和 `rootDir` 信息
- 扫描结果填充完整 `ScanResult` 信息
- 计算父项目路径（查找同扫描结果中是否存在父路径）

#### walkDirectory() 改动

- 新增 `results` 累积器（直接累积完整结果）
- 传递 `currentDepth` 和 `rootDir` 用于计算相对层级

### 2. 选择组件增强（全选功能）

#### selectFromScanResults() 改动

- 过滤已配置项目（`configStatus !== 'configured'`）
- 选项列表顶部添加 `[全选所有项目]` 特殊选项
- 分隔线区分全选选项和项目列表
- 启用 `instructions: true` 显示快捷键提示（包括 `a` 全选快捷键）
- 处理全选逻辑：选中特殊选项时返回所有可配置项目路径

#### 新增格式化函数

```typescript
// src/cli/prompts/utils/format-choices.ts

export function formatScanResultTitle(result: ScanResult): string {
  const indent = result.depth > 1 ? '  '.repeat(result.depth - 1) : '';
  const marker = result.parentPath ? ' [子项目]' : '';
  const name = result.path.split('/').pop() || result.path;
  
  const statusIcon = {
    'new': '○',
    'unconfigured': '◐',
  };
  
  return `${indent}${statusIcon[result.configStatus]} ${name}${marker}`;
}

export function formatScanResultDescription(result: ScanResult): string {
  const parts = [result.path];
  if (result.activeProvider) {
    parts.push(`当前: ${result.activeProvider}`);
  }
  return parts.join(' | ');
}
```

### 3. 输出表格增强

#### outputScanTable() 改动

表格列扩展为 4 列：

| 列名 | 宽度 | 内容 |
|------|------|------|
| 项目 | 40 | 带层级缩进的名称 + `[子]` 标记 |
| 层级 | 10 | `L{depth}` 格式 |
| 配置状态 | 15 | 三状态图标 + 文字 |
| Provider | 20 | 当前 provider 或 `-` |

状态图标颜色：
- `○ 新项目` - 绿色
- `◐ 未配置` - 黄色
- `● 已配置` - 灰色

汇总信息改为三状态统计。

## 数据流

```
扫描目录
  ↓
walkDirectory (递归)
  ↓
checkConfigStatus (每个项目)
  ↓
ScanResult[] (完整信息)
  ↓
selectFromScanResults (过滤 + 全选)
  ↓
用户选择
  ↓
批量注册
```

## 测试要点

1. 扫描逻辑：父子项目正确识别，depth 计算正确
2. 配置检测：正确读取 settings.json 的 apiProvider
3. 选择组件：全选选项功能正确，快捷键提示显示
4. 输出表格：层级缩进正确，状态颜色正确
5. 边界情况：空目录、无配置文件、嵌套多层子项目

## 实现优先级

1. **P0：** 类型定义 + ProjectService 改动（核心逻辑）
2. **P1：** 选择组件增强（全选功能）
3. **P2：** 输出表格增强（视觉体验）

## 兼容性

- 向后兼容：现有 `ScanResult` 扩展字段，不影响现有代码
- 新字段可选：`depth`、`parentPath`、`activeProvider` 为可选或默认值