# myworkbench

个人战略与研究治理工作台（Personal Strategy & Research Workbench）。以 **Markdown 文件为权威源**、**SQLite(FTS5) 为索引缓存**，把证据、信念、决策、项目、机会、资本、人脉等沉淀为可追溯、可复盘的单一知识体系。

## 功能全景

### 实体体系（16 类）
`strategy / research / decision / project / experiment / person / evidence / belief / opportunity / radar / capital / profile / event / organization / task / idea`，每类拥有专属字段表单、详情页结构化展示、列表页搜索/过滤/排序/分页。

### 知识闭环
- **关系系统**：7 种关系类型（supports / contradicts / derives_from / depends_on / related_to / member_of / works_at）+ `linked_*` 字段，自动构建证据链
- **证据链图谱**：DAG 力导向图（自动布局 + 点击跳转）
- **反向链接 + Wiki 链接**：正文 `[[entity-id|别名]]` 双向引用解析
- **决策门控**：review_date / invalidate_if / pivot_signals，到期提醒 + 结果反哺信念

### 研究工作流
- **RSS 订阅**：服务端抓取（代理感知）、分类、已读态、一键存为证据
- **论文阅读流水线**：RSS/手动 → 文献笔记（六段模板）→ 待读队列 → 已读归档
- **研究想法看板**：idea 实体五阶段生命周期看板
- **实验对比**：多选实验并排对比视图
- **知识树**：智源 AI 知识树（323 节点力导向图 + 实体定位）

### 执行层
- **任务（task）**：状态流转 + 循环任务（daily/weekly/biweekly/monthly/yearly，月末 clamp）
- **今日视图 / 日历 / 看板**：统一收集五类日期项，拖拽改期、就地完成
- **周回顾**：周活动聚合

### 个人化
- **首页工作台**：9 个可定制 widget（隐藏/排序/置顶）
- **设置中心**：主题三态、起始页、编辑器模式、个人印记、首页布局
- **数据画像**：12 周活动热力图、完成率、资产计数
- **命令面板**：Ctrl+K 全局跳转/新建/搜索
- **Profile 编译器**：Academic / MLSys / Industry / BOLD 四版本档案投影

### 数据安全
- **软删回收站**：实体与工作台笔记均软删，可恢复/彻底删除
- **导入导出**：ZIP（含附件）/ JSON（含关系）
- **8 维资本雷达图**（金融/学术/技术/研究/产业/人脉/地理/机构）

### 写作工作台（/workspace）
- CodeMirror 6 编辑器 + 分栏实时预览 + 代码高亮 + KaTeX 公式
- 全文搜索、图片粘贴直传、文档大纲、字数统计、跨文件待办回写

## 技术栈

- **框架**：Next.js 16（App Router, Turbopack）+ React 19 + TypeScript
- **样式**：Tailwind CSS v4 + @tailwindcss/typography
- **数据**：better-sqlite3（含 FTS5 全文检索）+ gray-matter
- **编辑器/渲染**：CodeMirror 6、marked + marked-highlight、highlight.js、katex
- **可视化**：自研力导向图（force-graph）、recharts、@dagrejs/dagre
- **网络**：rss-parser + undici

## 快速开始

```bash
# 开发（绑定 127.0.0.1）
HOST=127.0.0.1 npm run dev

# 生产构建
npm run build

# 单元测试（数据层纯函数）
npm test

# CLI
npm run cli
```

访问 `http://127.0.0.1:3000`。

## 数据模型

**权威源 = Markdown 文件**，`entities/<dir>/<slug>.md`，格式：

```markdown
---
id: decision-0001
type: decision
title: 标题
status: active
tags: [researc, important]
context: 背景
question: 问题
relations:
  - { to: evidence-0001, type: supports }
---

正文内容，支持 [[entity-id|别名]] wiki 链接。
```

- 实体目录映射见 `src/lib/markdown.ts` 的 `ENTITY_DIRS`
- 专属字段定义见 `src/lib/fields.ts`（表单与详情页共用）
- 关系存 frontmatter `relations`（`{to, type}`）或 `linked_*`，`buildRelations` 全量重建 SQLite 关系表
- 内容指纹唯一公式：`sync.ts` 的 `stableHash(frontmatter 不含 content, content)`，create/PUT/sync 三处共用

## 目录结构

```
myworkbench-app/
├── src/
│   ├── app/            # 页面（route 目录）+ API 路由
│   ├── components/     # 通用 UI + 实体组件
│   └── lib/            # 数据层（markdown/sync/rss/due-items/date-utils/...）
├── entities/           # 实体 markdown 文件（权威源）
├── workspace/          # 自由笔记 + attachments（图片附件）
└── .myworkbench/       # 本机配置（launcher.json，不进数据导出）
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `MYWORKBENCH_RSS_PROXY` | RSS 抓取代理（如 `http://127.0.0.1:7890`） |

## 已知注意事项（WSL / Linux）

1. **原生二进制**：Tailwind v4 底层（lightningcss / @tailwindcss/oxide）依赖平台原生二进制。若 `node_modules` 曾在 Windows 侧安装，Linux 下 `npm run build` 会报 `Cannot find module ../lightningcss.linux-x64-gnu.node`——用 `npm ci` 按 lock 精确重装即可根治。
2. **字体下载**：`next/font/google` 的 Geist 在 build 时需联网，代理环境需设置 `HTTPS_PROXY`。
3. **Turbopack 热重载**：改服务端 / 页面代码后热重载可能不生效，`rm -rf .next && npm run dev` 重启最稳妥。