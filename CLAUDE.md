# SwissJob - 开发笔记 & 问题汇总

## 项目概述

AI 驱动的求职面试管理平台。核心目标：管理面试进度 + 提升面试者能力。

- **Tech Stack**: Next.js 14, TypeScript, Prisma + SQLite, Tailwind CSS, OpenAI SDK
- **PRD**: `tasks/prd-interview-management.md`

---

## 已实现功能

| 功能 | 状态 | 路径 |
|------|------|------|
| Kanban 看板（投递管理） | ✅ 完成 | `/companies` |
| AI 提取 JD 信息 | ✅ 完成 | `/companies/new` |
| 面试分析（音频/文本） | ✅ 完成 | `/companies/[id]/interview` |
| 简历上传与解析 | ✅ 完成 | `/resume` |
| AI 设置（API Key 等） | ✅ 完成 | `/settings` |
| 自定义 Kanban 状态 | 🔄 设计完成，待实现 | `docs/plans/2026-02-19-*` |
| 技能树页面 | ❌ 未实现 | `/skills`（Sidebar 有入口） |
| 面试日历 | ❌ 未实现 | `/calendar` |

---

## 已知问题

### 1. `/skills` 页面缺失
Sidebar 中有 "Skill Tree" 入口指向 `/skills`，但该页面不存在，访问会 404。
**需要**: 创建 `/app/skills/page.tsx`

### 2. Skill 表数据写入未确认
`Skill` 表存在于 schema，但不确定 JD 提取时是否实际写入该表。
`Company.skills` 是 JSON 字符串，`Skill` 表可能为空。
**需要**: 检查 `/api/ai/extract-jd/route.ts` 是否写入 `Skill` 表。

### 3. 开发服务器未运行时无法做浏览器验证
使用 chrome-devtools-mcp 验证 UI 时，需要先手动启动开发服务器：
```bash
cd frontend && npm run dev
```

### 4. Interview 状态枚举不完整
`Interview.status` 默认值为 `"scheduled"`，但没有明确的枚举约束。
面试完成后的状态流转（passed/rejected）逻辑未实现。

### 5. 多轮面试 UI 不完整
`Interview` 表支持多轮（`round` 字段），但公司详情页的 UI 可能只展示最新一条面试记录。

### 6. next-intl 未完全集成
`next-intl` 已安装，`LanguageSwitcher` 组件存在，但国际化未完全接入。
AI 分析结果语言与 UI 语言可能不一致。

---

## 架构决策记录

### 为什么用 SQLite 而不是 Notion/其他云数据库？
- 本地优先，无需网络，保护隐私
- 零配置，开箱即用
- 用户自己管理数据

### Notion MCP 集成方案（待讨论）
用户提出可以用 Notion MCP 辅助存储。建议方案：
- **不迁移主存储**，保留 SQLite
- 新增"导出到 Notion"功能：将面试总结、技能分析推送到用户的 Notion workspace
- 通过 Notion MCP 实现，用户需要配置 Notion API Token

### 为什么不用 Python 后端？
已从 Python + FastAPI 迁移到纯 Next.js API Routes（见 `docs/plans/2026-02-16-nextjs-migration-design.md`）。
Whisper 本地转录仍需 Python 脚本（`scripts/`），但为可选功能。

---

## 开发规范

- 所有 AI 调用通过 `lib/app-settings.ts` 的 `createOpenAIClient()` 获取客户端
- JSON 解析使用 `lib/parse-json.ts` 的 `parseJSON()` 函数（处理 AI 返回的 markdown 代码块）
- Kanban 状态通过 `lib/use-kanban-statuses.ts` hook 管理
- 数据库操作通过 `lib/prisma.ts` 的单例 Prisma 客户端

---

## 待办事项（优先级排序）

1. 实现 `/skills` 技能树页面（修复 404）
2. 实现自定义 Kanban 状态列（设计文档已完成）
3. 实现面试日历视图 `/calendar`
4. 完善面试状态流转（scheduled → completed → passed/rejected）
5. 优化面试分析 AI 总结结构（结构化 JSON 输出）
6. 评估 Notion MCP 导出功能可行性
