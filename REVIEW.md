# SwissJob - 问题沉淀 & 经验总结

## 2026-02-22 已知问题梳理（从 CLAUDE.md 迁移）

### `/skills` 页面缺失

**问题**: Sidebar 中有 "Skill Tree" 入口指向 `/skills`，但页面不存在，访问 404
**原因**: 功能未实现，只建了入口
**解决**: 待创建 `/app/skills/page.tsx`

### Skill 表数据写入未确认

**问题**: `Skill` 表存在于 schema，但 JD 提取时可能未写入该表
**原因**: `Company.skills` 是 JSON 字符串，`Skill` 表可能为空
**待确认**: 检查 `/api/ai/extract-jd/route.ts` 是否写入 `Skill` 表

### Interview 状态枚举不完整

**问题**: `Interview.status` 默认值为 `"scheduled"`，无枚举约束
**影响**: 面试完成后的状态流转（passed/rejected）逻辑未实现

### 多轮面试 UI 不完整

**问题**: `Interview` 表支持多轮（`round` 字段），但详情页可能只展示最新一条
**影响**: 用户无法查看历史面试轮次

### next-intl 国际化未完全集成

**问题**: `next-intl` 已安装，`LanguageSwitcher` 组件存在，但未完全接入
**影响**: AI 分析结果语言与 UI 语言可能不一致

---

## 2026-02-16 Python → Next.js 迁移

**背景**: 从 Python + FastAPI 迁移到纯 Next.js API Routes
**决策**: 简化部署、统一技术栈
**设计文档**: `docs/plans/2026-02-16-nextjs-migration-design.md`
**教训**: Whisper 本地转录仍需 Python 脚本，完全去 Python 不现实，保留为可选功能
