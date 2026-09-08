# Agentic Chat 页面设计文档

> 状态：待实施 · 日期：2026-09-07

## 1. 目标

新增 web 端 agentic chat，让工作台从「静态记录」变为「可对话交互」。做 **L3 完整 agent**（读 + 写工作台数据），**流式回复**，**聊天历史持久化**。

`baseURL / apiKey / model` 全部走 `.env.local`，支持任意 OpenAI 兼容服务（Ollama / 通义 / Kimi / Moonshot / DeepSeek 等），换 provider 只改 env 不碰代码。

## 2. 架构（三层）

```
/chat 页面 ──useChat──> /api/chat ──streamText + tools──> OpenAI 兼容 LLM
                              │
                              └─ 工具层直接调用 src/lib/*（不绕 HTTP）
```

- **前端**：AI SDK 的 `useChat`（客户端 hook），天然流式
- **后端**：AI SDK 的 `streamText`，`maxSteps` 支持多轮工具调用（agentic 核心）
- **工具层**：复用现有 `src/lib/*` 函数，不重复造数据访问

## 3. 依赖

- `ai`（Vercel AI SDK：`streamText` + `useChat`）
- `@ai-sdk/openai`（OpenAI 兼容 adapter，`baseURL` 指向任意兼容服务）

## 4. env 配置（`.env.local`）

| 变量 | 说明 |
|------|------|
| `MYWORKBENCH_LLM_BASEURL` | 如 `http://localhost:11434/v1`（Ollama）或 DashScope / Kimi baseURL |
| `MYWORKBENCH_LLM_APIKEY` | Ollama 本地可留空；云端服务填 key |
| `MYWORKBENCH_LLM_MODEL` | 如 `qwen2.5` / `qwen-max` / `moonshot-v1-8k` |

缺配置时，`/api/chat` 返回友好错误提示（而非 500），引导用户填写 env。

## 5. 工具清单（L3）

### 只读工具（安全）
| 工具 | 复用函数 | 用途 |
|------|----------|------|
| `list_entities` | `listEntities(type)` | 列出某类实体 |
| `search_entities` | 抽 lib 版 FTS 搜索（`src/lib/search.ts` 新增） | 全文检索 |
| `get_entity` | `readEntity(type, slug)` | 读详情 |
| `get_dashboard` | dashboard 聚合逻辑 | 概览 |
| `get_due_items` | `collectDatedItems()` / `bucketDueItems()` | 到期事项 |

### 写工具（L3 核心）
| 工具 | 复用函数 | 用途 |
|------|----------|------|
| `create_entity` | `createEntity(type, slug, data)` | 记录决策/证据/想法等 |
| `create_relation` | relations 写回（frontmatter `relations` + `buildRelations`） | 「把 A 关联到 B」 |
| `complete_task` | `completeTaskPayload` | 完成/推进任务 |

### 默认不开放
- `delete_entity` / `remove_relation`（删除类，风险高，后续确认再加）

## 6. 聊天历史持久化

**存储选择**：SQLite 独立表（与 RSS 同样，聊天是「交互记录」而非「知识资产」——不参与 markdown sync、不进导出 zip）。

### 表结构（db.ts 新增，参照 rss_feeds/rss_entries）

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL DEFAULT '新对话',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 会话 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/chat/sessions` | GET | 会话列表（按 updated_at 倒序） |
| `/api/chat/sessions` | POST | 新建会话，返回 `{ id }` |
| `/api/chat/sessions/[id]` | GET | 会话消息列表 |
| `/api/chat/sessions/[id]` | DELETE | 删除会话（级联删除消息） |
| `/api/chat` | POST | 发送消息，流式返回，完成后落库 |

### 交互流程

1. 用户进入 `/chat` → 侧栏显示历史会话列表；无则新建会话
2. 发送消息 → `POST /api/chat`（带 `sessionId` + `messages`）
3. 服务端 `streamText` 流式返回（工具调用中间态在 UI 显示「正在查询/写入…」）
4. 结束后，把最终 user 消息 + assistant 回复写入 `chat_messages`，并更新 session 的 `title`（取首条用户消息前 ~30 字）与 `updated_at`

## 7. 文件改动清单

| 文件 | 内容 |
|------|------|
| `src/app/api/chat/route.ts` | **新建**：`streamText` + 工具注册 + provider 装配 |
| `src/app/api/chat/sessions/route.ts` | **新建**：会话列表 / 新建 |
| `src/app/api/chat/sessions/[id]/route.ts` | **新建**：读消息 / 删会话 |
| `src/lib/chat-tools.ts` | **新建**：8 个工具实现（封装现有 lib） |
| `src/lib/chat-system-prompt.ts` | **新建**：动态生成数据模型描述（读 `fields.ts` 的 `TYPE_SPECIFIC_FIELDS` 注入 16 类实体 + 字段 + 关系类型） |
| `src/lib/search.ts` | **新建**：抽离 search/route.ts 的 FTS + 中文 LIKE 逻辑为可复用函数 |
| `src/lib/db.ts` | 新增 `chat_sessions` / `chat_messages` 建表 |
| `src/app/chat/page.tsx` + `_components/*` | **新建**：聊天 UI（历史会话侧栏 + 消息气泡 + 流式 + 工具状态） |
| `src/components/Sidebar.tsx` | 加「对话」入口（思考组） |
| `.env.local` | 加 3 个 LLM 变量（vendor 待定） |

## 8. 安全考量

- **写工具走现有约束**：`createEntity`/`create_relation` 复用 `isValidSlug`/`safeJoin`/软删等既有防护，不引入新越权路径
- **删除类首期禁用**，避免 agent 误删数据
- **system prompt 不注入敏感数据**：仅注入 schema（实体类型/字段/关系类型），具体数据在工具调用时按需读取
- **provider 缺配置降级**：返回友好错误，不暴露 env 细节

## 9. 实施步骤

1. 装依赖 `ai` + `@ai-sdk/openai`
2. `db.ts` 建 chat 表 + 会话/消息 API
3. `src/lib/search.ts` 抽离 FTS 搜索
4. `chat-system-prompt.ts` + `chat-tools.ts`（先只读工具跑通，再加写工具）
5. `/api/chat` 流式 route + provider 装配
6. `/chat` 页面 + ChatClient（UI + 历史会话）
7. Sidebar 接入
8. 验证：tsc + 单测 + build + 浏览器实测（工具调用链路 + 历史持久化）

## 10. 前置依赖

**本文档实施前，需先完成「前端功能整理与收缩」**（2026-09-07，用户确认的前置任务），避免在未收敛的 UI 上叠加新页面。