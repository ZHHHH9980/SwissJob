# PRD: 面试管理工具 (SwissJob)

## Introduction

SwissJob 是一个 AI 驱动的求职面试管理平台，帮助求职者系统化管理面试流程、积累面试经验、提升面试能力。核心价值：**管理面试进度 + 提升面试者能力**。

目前已实现：Kanban 看板、JD 提取、面试分析（音频/文本）、简历上传、AI 设置。
本 PRD 聚焦于**尚未实现或需要完善的功能**。

---

## Goals

- 支持完整的面试生命周期管理（投递 → 面试 → 结果）
- 提供面试日历视图，直观展示面试安排
- 支持上传和管理面试经验（文本/录音），并生成 AI 总结
- 通过技能树和历史分析，帮助用户识别薄弱点并持续提升
- 支持自定义 Kanban 状态列，适配不同求职流程

---

## User Stories

### US-001: 面试日历视图
**Description:** As a job seeker, I want to see all my scheduled interviews on a calendar so that I can manage my time and avoid conflicts.

**Acceptance Criteria:**
- [ ] 新增 `/calendar` 页面，Sidebar 增加 Calendar 入口
- [ ] 以月视图展示所有 Interview 记录（基于 `scheduledAt` 字段）
- [ ] 每个日历事件显示：公司名、职位、面试轮次
- [ ] 点击事件可跳转到对应公司详情页
- [ ] 支持导出 .ics 文件（可选，见 Non-Goals）
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: 自定义 Kanban 状态列
**Description:** As a job seeker, I want to customize the Kanban board columns to match my personal job search workflow.

**Acceptance Criteria:**
- [ ] 用户可在设置页添加/删除/重命名状态列
- [ ] 自定义状态持久化到 `AppSettings` 或新的 `KanbanStatus` 表
- [ ] Kanban 看板动态渲染自定义列（不再硬编码 3 列）
- [ ] 拖拽功能在自定义列间正常工作
- [ ] 删除状态列时，该列下的公司移至默认列（如 "active"）
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: 面试经验上传与管理
**Description:** As a job seeker, I want to upload and organize my interview experiences so that I can review and learn from them later.

**Acceptance Criteria:**
- [ ] 在公司详情页可为每轮面试上传文本笔记或录音文件
- [ ] 录音文件通过 Whisper 转录为文字
- [ ] 每条面试记录显示：时间、轮次、状态、是否有录音/文本
- [ ] 支持查看历史面试记录列表（当前只有最新一条）
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: 面试问答 AI 总结
**Description:** As a job seeker, I want AI to summarize my interview Q&A so that I can quickly review key points and identify areas for improvement.

**Acceptance Criteria:**
- [ ] 面试分析页生成结构化总结：问题列表、回答质量评分、改进建议
- [ ] 总结结果持久化保存到 `Interview.aiAnalysis` 字段
- [ ] 支持跨多次面试的横向对比（同一公司不同轮次）
- [ ] 总结内容支持导出为 Markdown 文本
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: 技能树页面
**Description:** As a job seeker, I want to see a visual skill tree showing which skills appear most in JDs I've applied to, so I can prioritize learning.

**Acceptance Criteria:**
- [ ] 实现 `/skills` 页面（Sidebar 已有入口但页面不存在）
- [ ] 展示技能频率排行（基于 `Skill` 表的 `frequency` 字段）
- [ ] 按类别分组展示技能（如：编程语言、框架、工具）
- [ ] 显示每个技能首次/最近出现时间
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: 面试进度状态管理
**Description:** As a job seeker, I want to update interview status (scheduled/completed/passed/rejected) so that I can track where I am in each process.

**Acceptance Criteria:**
- [ ] Interview 记录支持状态流转：scheduled → completed → passed/rejected
- [ ] 公司详情页显示当前面试轮次和状态
- [ ] 状态变更时可添加备注
- [ ] Kanban 卡片显示最近一次面试的状态和时间
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- FR-1: 新增 `/calendar` 路由，渲染月历视图，数据来源为 `Interview` 表的 `scheduledAt`
- FR-2: `AppSettings` 或新表支持存储自定义 Kanban 状态列（顺序、名称、颜色）
- FR-3: 每个 Company 可关联多条 Interview 记录，支持按轮次查看
- FR-4: AI 分析结果以结构化 JSON 存储，包含：questions[]、scores{}、suggestions[]
- FR-5: `/skills` 页面从 `Skill` 表读取数据并可视化展示
- FR-6: Interview 状态字段支持：scheduled | in_progress | completed | passed | rejected
- FR-7: 面试分析支持导出 Markdown 格式

---

## Non-Goals（本期不做）

- .ics 日历文件导出（可后续迭代）
- 多用户/团队协作功能
- 移动端 App
- 邮件/日历提醒通知
- 与招聘平台（LinkedIn、Boss直聘）的自动同步

---

## Design Considerations

- 日历组件推荐使用轻量库如 `react-big-calendar` 或 `@fullcalendar/react`
- 技能树可用简单的卡片网格，不需要复杂的树形图
- 自定义 Kanban 状态的设计文档已存在：`docs/plans/2026-02-19-custom-kanban-statuses-design.md`

---

## Technical Considerations

- 日历视图直接查询 `Interview` 表，无需新增 API，可复用 `/api/companies` 数据
- 自定义 Kanban 状态可存储在 `AppSettings.kanbanStatuses`（JSON 字段）或新建 `KanbanStatus` 表
- `lib/use-kanban-statuses.ts` 已存在，可作为自定义状态的 hook 基础
- 面试分析 AI 提示词需要优化，确保返回结构化 JSON（`lib/parse-json.ts` 已有解析工具）
- 当前 `Interview` 表已有 `status` 字段，需确认枚举值是否需要迁移

---

## Success Metrics

- 用户可在 3 步内完成一次面试记录的创建和分析
- 日历视图正确展示所有已安排的面试
- 技能树页面加载并展示已提取的技能数据
- 自定义 Kanban 列在刷新后持久化

---

## Open Questions

1. **Notion MCP 存储**：是否考虑将面试记录同步到 Notion？当前使用 SQLite，迁移成本高。建议方案：保留 SQLite 为主存储，新增"导出到 Notion"功能，通过 Notion MCP 将面试总结推送到用户的 Notion workspace。这样两全其美。

2. **多轮面试管理**：当前 `Interview.round` 是数字，是否需要支持自定义轮次名称（如"HR面"、"技术面"、"总监面"）？

3. **面试日历的数据范围**：日历是否只显示当前用户的面试，还是支持多账户？（当前无登录系统）

4. **AI 总结的语言**：面试分析结果是否需要支持中英文切换？（next-intl 已安装但未完全集成）

5. **技能树的数据来源**：`Skill` 表目前是否有数据？需要确认 JD 提取时是否已在写入 `Skill` 表，还是只写入 `Company.skills` JSON 字段。

6. **本地开发服务器**：PRD 编写时 `localhost:3000` 无法访问，无法通过 chrome-devtools-mcp 做 UI 验证。需要先启动开发服务器（`npm run dev`）再进行浏览器验证。
