---
id: "decision-0001"
type: Decision
title: "以 opencode 作为 myworkbench 的核心交互层"
status: active
tags:
  - architecture
  - opencode
  - integration
created_at: "2025-01-02"
updated_at: "2025-01-02"

context: >
  myworkbench 需要一个人机交互层，用于日常记录、复盘、规划和检索。
  现有方案包括：独立 Web UI、CLI 工具、Notion/Obsidian 等。

question: "以何种工具作为 myworkbench 的核心交互入口？"

options:
  - label: "完全独立 Web UI"
    pros:
      - "完全可控的 UI/UX"
      - "多端访问"
    cons:
      - "开发成本高"
      - "AI 集成需要额外工作"
  - label: "opencode CLI 嵌入"
    pros:
      - "成熟的 AI agent 能力"
      - "文件系统原生访问"
      - "技能和命令可扩展"
    cons:
      - "CLI 学习曲线"
      - "可视化能力有限"

evidence:
  - "evidence-0001"
  - "evidence-0002"

current_belief: "opencode 提供了足够的灵活性，可以通过命令和技能弥补 CLI 的不足。"

decision: "adopt"
expected_outcome: "用户在 opencode 中完成 90% 的录入和复盘工作，Web UI 仅用于总览浏览。"

gate:
  invalidate_if: "opencode 无法稳定访问本地文件系统"
  review_date: "2025-03-01"
  pivot_signals:
    - "用户频繁反馈 CLI 操作繁琐"
    - "Web UI 需求超过预期"

actual_result: null
belief_update: null
---

## 复盘记录

待 Phase 3 完成后补充实际使用反馈。
