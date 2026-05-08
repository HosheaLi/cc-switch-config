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
├── lib/types/index.ts                   # 类型导出
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
  /** 是否未注册（已在 ProjectIndex 中） */
  isNew: boolean;
  /** 相对于扫描根目录的层级（根目录下第一层 depth=1） */
  depth: number;
  /** 配置状态 */
  configStatus: 'new' | 'unconfigured' | 'configured';
  /** 父项目路径（子项目才有，通过路径包含关系识别） */
  parentPath?: string;
  /** 当前使用的 provider 名称（从 settings.json apiProvider 字段读取） */
  activeProvider?: string;
}
```

**depth 计算规则：**
- depth = 扫描根目录后的路径层级数
- 例如：扫描 `~/code`，发现 `~/code/A` (depth=1)，`~/code/A/B` (depth=2)
- 多个扫描目录时，每个目录独立计算（`~/code/A` depth=1，`~/projects/B` depth=1）

**迁移计划：**
1. 创建 `src/lib/types/scan-result.ts`
2. 在 `src/lib/types/index.ts` 中导出
3. 更新 `project-service.ts` 导入：`import { ScanResult } from '../types/index.js'`

## 详细设计

### 1. 扫描逻辑增强

#### ProjectService 新增方法

```typescript
/**
 * 检查项目的配置状态
 * 读取 .claude/settings.json 判断是否已有 apiProvider 配置
 * 
 * @param projectPath - 项目路径
 * @returns 配置状态和当前 provider（如有）
 */
async checkConfigStatus(projectPath: string): Promise<{
  status: 'new' | 'unconfigured' | 'configured';
  activeProvider?: string;
}> {
  const settingsPath = path.join(projectPath, '.claude', 'settings.json');
  
  // 配置文件不存在 → 未配置
  if (!await fs.pathExists(settingsPath)) {
    return { status: 'unconfigured' };
  }
  
  try {
    const settings = await fs.readJson(settingsPath);
    
    // 验证 apiProvider 是否为有效字符串
    if (settings.apiProvider && typeof settings.apiProvider === 'string' && settings.apiProvider.trim()) {
      return {
        status: 'configured',
        activeProvider: settings.apiProvider.trim(),
      };
    }
    
    return { status: 'unconfigured' };
  } catch (error) {
    // 文件读取失败或 JSON 解析错误，视为未配置
    if (error instanceof Error) {
      console.error(`无法读取配置文件 ${settingsPath}: ${error.message}`);
    }
    return { status: 'unconfigured' };
  }
}

/**
 * 查找项目的父项目路径
 * 通过路径包含关系判断父子关系
 * 
 * @param projectPath - 当前项目路径
 * @param allPaths - 所有扫描到的项目路径
 * @returns 父项目路径或 undefined
 */
private findParentPath(
  projectPath: string,
  allPaths: string[]
): string | undefined {
  // 从当前路径向上逐级检查是否有父项目
  const parts = projectPath.split('/');
  for (let i = parts.length - 2; i >= 0; i--) {
    const candidatePath = parts.slice(0, i + 1).join('/');
    // 排除自身，查找是否存在
    if (candidatePath !== projectPath && allPaths.includes(candidatePath)) {
      return candidatePath;
    }
  }
  return undefined;
}
```

#### scanProjects() 改动

```typescript
async scanProjects(maxDepth?: number, overrideDirs?: string[]): Promise<ScanResult[]> {
  const rootDirs = overrideDirs ?? this.appState.get('scanDirectories');
  const depth = maxDepth ?? this.defaultMaxDepth;
  const results: ScanResult[] = [];  // 改为 ScanResult[]
  const skipDirs = this.getSkipDirectories();
  
  // ... 目录验证逻辑 ...
  
  // 扫描每个根目录
  for (const rootDir of validDirs) {
    const expanded = this.expandPath(rootDir);
    await this.walkDirectory(expanded, 1, depth, results, skipDirs, expanded);
  }
  
  // 后处理：检查注册状态 + 配置状态 + 父项目关系
  const allPaths = results.map(r => r.path);
  
  // 按路径长度排序，确保父项目先处理
  results.sort((a, b) => a.path.length - b.path.length);
  
  for (const result of results) {
    // 检查是否已注册
    const existing = await this.projectIndex.getByPath(result.path);
    result.isNew = existing === null;
    
    // 检查配置状态
    const configInfo = await this.checkConfigStatus(result.path);
    result.configStatus = result.isNew ? 'new' : configInfo.status;
    result.activeProvider = configInfo.activeProvider;
    
    // 查找父项目
    result.parentPath = this.findParentPath(result.path, allPaths);
  }
  
  return results;
}
```

#### walkDirectory() 改动

```typescript
/**
 * 递归扫描目录查找 .claude 项目
 * 
 * @param dir - 当前扫描目录
 * @param currentDepth - 当前层级（从 1 开始）
 * @param maxDepth - 最大深度限制
 * @param results - 扫描结果累积器
 * @param skipDirs - 跳过的目录名列表
 * @param rootDir - 扫描根目录（用于 depth 计算）
 */
private async walkDirectory(
  dir: string,
  currentDepth: number,
  maxDepth: number,
  results: ScanResult[],
  skipDirs: string[],
  rootDir: string
): Promise<void> {
  if (currentDepth > maxDepth) return;
  
  // 检查是否有 .claude 配置
  const claudeDir = path.join(dir, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const localSettingsPath = path.join(claudeDir, 'settings.local.json');
  
  if (await fs.pathExists(settingsPath) || await fs.pathExists(localSettingsPath)) {
    // 添加基础信息（完整信息在 scanProjects 后处理）
    results.push({
      path: dir,
      isNew: false,  // 临时值，后续填充
      depth: currentDepth,
      configStatus: 'new',  // 临时值，后续填充
    });
  }
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    const subdirs = entries
      .filter(e => e.isDirectory())
      .filter(e => !skipDirs.includes(e.name))
      .filter(e => !e.name.startsWith('.'))
      .map(e => path.join(dir, e.name));
    
    // 并行扫描子目录
    await Promise.all(
      subdirs.map(async (subdir) => {
        try {
          await this.walkDirectory(subdir, currentDepth + 1, maxDepth, results, skipDirs, rootDir);
        } catch (err) {
          if (err instanceof Error) {
            console.error(`Scan skipped ${subdir}: ${err.message}`);
          }
        }
      })
    );
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Scan skipped ${dir}: ${err.message}`);
    }
  }
}
```

**性能考虑：**
- 预估每次 settings.json 读取 < 5ms
- 100 项目约 500ms（可接受）
- 如需优化：Promise.all 并行检查配置状态

### 2. 选择组件增强（全选功能）

#### selectFromScanResults() 改动

```typescript
export async function selectFromScanResults(
  results: ScanResult[],
  message: string = '选择要注册的项目'
): Promise<string[] | null> {
  // 过滤已配置项目
  const configurableProjects = results.filter(
    r => r.configStatus !== 'configured'
  );
  
  if (configurableProjects.length === 0) {
    console.log('所有项目都已配置。');
    return null;
  }
  
  // 构建选项列表
  const choices: Choice[] = [
    // 全选选项
    {
      title: '━━━ [全选所有项目] ━━━',
      value: '__SELECT_ALL__',
      description: `选中所有 ${configurableProjects.length} 个可配置项目`,
    },
    // 项目选项
    ...configurableProjects.map(r => ({
      title: formatScanResultTitle(r),
      value: r.path,
      description: formatScanResultDescription(r),
    })),
  ];
  
  const result = await prompts(
    {
      type: 'multiselect',
      name: 'paths',
      message,
      choices,
      instructions: true,  // 显示快捷键提示
    },
    { onCancel: defaultOnCancel }
  );
  
  // 处理全选逻辑
  if (result.paths?.includes('__SELECT_ALL__')) {
    return configurableProjects.map(r => r.path);
  }
  
  return result.paths ?? null;
}
```

#### 格式化函数

```typescript
// src/cli/prompts/utils/format-choices.ts

export function formatScanResultTitle(result: ScanResult): string {
  const indent = result.depth > 1 ? '  '.repeat(result.depth - 1) : '';
  const marker = result.parentPath ? ' [子项目]' : '';
  const name = result.path.split('/').pop() || result.path;
  
  const statusIcon: Record<ScanResult['configStatus'], string> = {
    'new': '○',
    'unconfigured': '◐',
    'configured': '●',
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

**快捷键提示说明：**
- `instructions: true` 显示：`↑/↓` 导航、`space` 选择、`a` 全选、`r` 反选、`enter` 确认

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
- `○ 新项目` - 绿色 (colors.success)
- `◐ 未配置` - 黄色 (colors.warning)
- `● 已配置` - 灰色 (colors.muted)

汇总改为三状态统计。

## 数据流

```
扫描目录
  ↓
walkDirectory (递归，累积基础信息)
  ↓
scanProjects (后处理：注册检查 + 配置检查 + 父项目识别)
  ↓
ScanResult[] (完整信息)
  ↓
selectFromScanResults (过滤已配置 + 全选选项)
  ↓
用户选择
  ↓
批量注册
```

## 测试要点

### 单元测试

1. `checkConfigStatus`：
   - 配置文件不存在 → 'unconfigured'
   - 配置文件存在但无 apiProvider → 'unconfigured'
   - 配置文件存在且有有效 apiProvider → 'configured'
   - 配置文件格式错误 → 'unconfigured' + 错误日志

2. `findParentPath`：
   - 无父项目 → undefined
   - 单层父项目 → 父路径
   - 多层嵌套（A/B/C） → 直接父路径 B
   - 多个候选父项目 → 最近的父项目

3. `walkDirectory`：
   - depth 正确传递和累积
   - 扫描根目录 depth=1
   - 子目录 depth 递增

### 集成测试

1. 扫描含父子项目的目录：
   - `~/code/A` 和 `~/code/A/B` 同时存在
   - 正确识别父子关系
   - depth 分别为 1 和 2

2. 嵌套三层项目：
   - `~/code/A/B/C`
   - depth 正确为 3
   - parentPath 为 `~/code/A/B`

3. 多个扫描目录：
   - `~/code` 和 `~/projects`
   - 两个目录的 depth 独立计算

### E2E 测试

1. 全选功能：
   - 选中全选选项 → 返回所有可配置项目
   - 快捷键 `a` → 全选
   - 已配置项目不在选项列表

2. 输出表格：
   - 层级缩进显示正确
   - 状态颜色正确
   - 三状态汇总正确

## 实现优先级

1. **P0：** 类型定义 + ProjectService 改动（核心逻辑）
2. **P1：** 选择组件增强（全选功能）
3. **P2：** 输出表格增强（视觉体验）

## 迁移步骤

**Phase 1: 类型扩展（无破坏性改动）**
- 创建 `src/lib/types/scan-result.ts`
- 扩展 ScanResult 类型（新字段可选/默认值）
- 保持 `scanProjects()` 返回类型兼容

**Phase 2: 选择组件增强**
- 更新 `selectFromScanResults()` 支持新字段
- 参数向后兼容（接受旧 ScanResult，使用 isNew 字段）

**Phase 3: 输出增强**
- 更新 `scan` 命令输出表格
- 新增字段显示

**受影响的调用方：**
- `src/cli/commands/scan.ts` - 输出逻辑
- `src/cli/prompts/components/select-project.ts` - 选择逻辑
- `src/cli/prompts/wizards/scan-wizard.ts` - Wizard 流程

## 兼容性

- **向后兼容：** 新字段可选或提供默认值
- **现有代码：** 使用 `isNew` 字段的代码继续工作
- **渐进增强：** 不强制使用新字段，按需适配