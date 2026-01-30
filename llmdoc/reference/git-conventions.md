# Git 规范

本文档定义了 PrintProxy 项目的 Git 工作流程和提交规范。

## 1. 核心摘要

项目采用 `main` 作为主分支，功能开发在独立分支进行。提交消息遵循 Conventional Commits 规范，使用 `feat:`、`fix:` 等前缀标识变更类型。

## 2. 分支策略

### 主分支

- `main`: 稳定的生产分支，所有功能最终合并至此

### 功能分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 功能开发 | `feat/<feature-name>` | `feat/printer-sync` |
| 重构 | `refactor/<scope>` | `refactor/frontend` |
| 修复 | `fix/<issue-name>` | `fix/login-error` |

## 3. 提交消息规范

### 格式

```
<type>: <description>
```

### 常用前缀

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feat:` | 新功能 | `feat: Add print job management page` |
| `fix:` | 修复问题 | `fix bugs` |
| `docs:` | 文档更新 | `docs: update README` |
| `refactor:` | 代码重构 | `refactor: 重构前端` |

### 语言

- 英文或中文均可
- 保持描述简洁明了

## 4. 工作流程

1. 从 `main` 创建功能分支
2. 在功能分支上进行开发和提交
3. 完成后推送至远程并创建 PR
4. 代码审查通过后合并至 `main`

## 5. 信息来源

- **提交历史:** `git log --oneline -30`
- **分支列表:** `git branch -a`
