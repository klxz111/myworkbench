# myworkbench

> Personal Strategy & Research Workbench

myworkbench 是一个面向长期研究、职业战略与资本积累的个人工作台。

它不是 Todo List，也不是单纯的知识库。 它试图记录并连接：

**World → Evidence → Belief → Decision → Gate → Action → Result →
Capital → Profile → Option → Strategy**

核心目标是让个人能够持续回答六个问题：

1.  我现在在哪里？
2.  最近外部世界发生了什么变化？
3.  哪些证据改变了我的判断？
4.  当前最重要的决策是什么？
5.  现在最值得推进什么？
6.  我已经积累了什么资本？

------------------------------------------------------------------------

## 1. Core Philosophy

myworkbench 的核心不是记录更多信息，而是形成一个可回溯的反馈闭环：

**Evidence → Belief → Decision → Strategy → Execution → Result →
Evidence**

系统需要能够回答：

-   当时我知道什么？
-   当时我相信什么？
-   为什么做出了这个决策？
-   实际执行了什么？
-   后来发生了什么？
-   哪些判断被验证，哪些被证伪？
-   这些结果最终沉淀成了什么资本与选项？

因此，历史记录不是负担，而是系统的重要资产。

### 1.1 Allow me to forget

myworkbench 的一个重要原则：

> **It should allow you to forget.**

用户不需要长期记住所有讨论、判断、项目和机会。

系统应该保存：

**What was known → What was believed → What was decided → What
happened**

从而让过去的认知可以被重新调用、验证和修正。

------------------------------------------------------------------------

## 2. System Architecture

myworkbench 采用三层结构：

### L1 --- Strategy

负责回答：

**Where am I going?**

包含：

-   Strategy
-   Timeline & Gates
-   External Radar
-   Capital Dashboard

这一层关注长期方向、关键节点、外部环境变化与战略约束。

### L2 --- Knowledge

负责回答：

**What do I know and believe?**

包含：

-   Research
-   Evidence / Belief
-   Decisions
-   Frontier Radar
-   Opportunity Market
-   Network

这一层负责构建研究图谱、证据链、判断与外部世界认知。

### L3 --- Execution

负责回答：

**What am I doing now?**

包含：

-   Projects
-   Experiments
-   Profile
-   Next Actions
-   Exam / Project tracking

这一层把战略和判断转化为实际行动，并记录结果。

------------------------------------------------------------------------

## 3. Core Data Model

myworkbench 的页面不是彼此孤立的数据库。

所有重要信息都围绕一组核心实体连接：

-   Person
-   Organization
-   Research Topic
-   Paper
-   Experiment
-   Claim
-   Decision
-   Opportunity
-   Project
-   Event

Dashboard 是这些实体的不同视图，而不是新的信息孤岛。

### 3.1 Capital

Capital 是跨系统属性，而不是单独的财务模块。

主要包括：

-   Financial Capital
-   Academic Capital
-   Technical Capital
-   Research Capital
-   Industry Capital
-   Network Capital
-   Geographic Capital
-   Institutional Capital

一个项目、实验、合作关系或研究成果，都可能同时增加多个维度的资本。

------------------------------------------------------------------------

## 4. Research Model

研究系统必须区分：

### Research Identity

长期稳定的研究身份。

例如：

**Continual Learning + Hardware Alignment**

它定义：

-   长期核心问题
-   技术积累方向
-   可以跨越模型范式变化的研究主线

### Research Branch

随时间变化的具体技术载体。

例如：

-   LLM
-   MoE
-   VLA
-   Mamba
-   World Model
-   Coding Agent
-   ML Systems
-   Embodied AI

Branch 可以变化，Identity 不需要频繁变化。

这样可以避免把个人研究身份绑定在某一个具体模型范式上。

------------------------------------------------------------------------

## 5. Decision System

Decision 是 myworkbench 的核心对象之一。

每个重要 Decision 至少应包含：

-   Context
-   Question
-   Options
-   Evidence
-   Current Belief
-   Decision
-   Expected Outcome
-   Gate / Trigger
-   Review Date
-   Actual Result
-   Belief Update

Decision 不应该只是"我决定做 X"。

它应该成为一个可验证的预测单元。

### Decision Gate

对于重要战略选择，应设置 Gate：

-   What must become true?
-   What would invalidate this path?
-   When should I review?
-   What evidence would cause a pivot?

这样可以减少情绪驱动和路径依赖。

------------------------------------------------------------------------

## 6. Evidence & Belief

系统严格区分：

**Evidence = What happened?**

**Belief = What do I think it means?**

**Decision = What will I do?**

Evidence 可以来自：

-   Paper
-   News
-   Policy
-   Company movement
-   Research result
-   Experiment
-   Conversation
-   Market signal
-   Personal observation

Belief 则记录对 Evidence 的解释。

同一条 Evidence 可以支持多个 Beliefs。

同一个 Belief 也可能被后续 Evidence 更新或推翻。

------------------------------------------------------------------------

## 7. Frontier Radar

Frontier Radar 用于持续观察外部世界。

重点覆盖：

-   AI research
-   Frontier labs
-   Companies
-   Universities
-   Hardware
-   ML Systems
-   Robotics
-   Funding
-   Policy
-   Immigration / mobility
-   Research ecosystem

Radar 的目标不是收藏新闻。

目标是发现：

**What changed the strategic landscape?**

每条重要变化都应该最终能够连接到：

**Event → Evidence → Belief → Decision**

------------------------------------------------------------------------

## 8. Opportunity Market

Opportunity 不只是"职位列表"。

它表示任何可能改变未来路径的外部机会：

-   Research collaboration
-   Internship
-   Scholarship
-   Fellowship
-   PhD
-   Postdoc
-   Company
-   Lab
-   Advisor
-   Open-source project
-   Startup
-   Conference / community

每个 Opportunity 都应该能够评估：

-   Strategic Fit
-   Research Fit
-   Capital Gain
-   Option Value
-   Cost
-   Risk
-   Timing
-   Required Preparation

最终回答：

> **Does this opportunity increase my future option set?**

------------------------------------------------------------------------

## 9. Network

Network 记录人与组织之间的长期关系。

核心对象：

-   Person
-   Organization
-   Relationship
-   Interaction
-   Follow-up

一个联系人不应该只是通讯录条目。

需要知道：

-   Why this person matters
-   What we discussed
-   Shared research interests
-   Potential collaboration
-   Last interaction
-   Next useful interaction

------------------------------------------------------------------------

## 10. Experiment Registry

Experiment 是研究闭环中的执行单元。

每个 Experiment 应至少记录：

-   Hypothesis
-   Setup
-   Configuration
-   Dataset / Environment
-   Hardware
-   Result
-   Failure Mode
-   Interpretation
-   Follow-up

实验完成后应能够自动或手动影响：

**Research → Evidence → Belief → Capital**

失败实验同样是资产。

------------------------------------------------------------------------

## 11. Profile Compiler

Profile 不应该手工维护成多个版本。

系统底层只维护真实发生过的：

-   Research
-   Projects
-   Experiments
-   Publications
-   Technical Skills
-   People
-   Organizations
-   Capital
-   Results

Profile Compiler 根据目标生成不同的 profile：

-   Academic
-   MLSys
-   Embodied AI
-   Frontier AI
-   Industry
-   BOLD / Open-ended Learning

因此：

**Profile 是底层资本的 projection，而不是独立数据库。**

------------------------------------------------------------------------

## 12. Homepage

HOME 是系统入口。

优先级：

1.  Strategy
2.  Recent Changes
3.  Active Decisions
4.  Active Research
5.  Current Projects
6.  Capital
7.  Next Actions

Todo 不应该成为首页的中心。

任务只是执行层的一个结果。

首页真正需要展示的是：

**Where am I → What changed → What matters → What should I do**

------------------------------------------------------------------------

## 13. V0

第一版只实现最核心的六个实体：

-   Strategy
-   Research
-   Decisions
-   Projects
-   People
-   Evidence

目标：

**建立最小可用闭环。**

V0 不追求自动化，也不追求复杂 UI。

必须先证明：

**Evidence → Belief → Decision → Project → Result**

能够稳定运行。

------------------------------------------------------------------------

## 14. V1

V1 增加：

-   Opportunity
-   Experiment
-   Capital
-   Profile

形成完整系统：

**World → Evidence → Belief → Decision → Gate → Action → Result →
Capital → Profile → Option → Strategy**

此阶段开始建立真正的个人战略数据库。

------------------------------------------------------------------------

## 15. V2

V2 才考虑自动化：

-   Conversation ingestion
-   Automatic claim extraction
-   Decision impact analysis
-   Frontier Radar
-   Experiment result ingestion
-   Profile compilation
-   GitHub integration
-   Calendar integration
-   RSS / research feeds
-   Finance integration

原则：

> **Automation should compress maintenance, not replace thinking.**

------------------------------------------------------------------------

## 16. Product Principles

### 16.1 Database before Dashboard

Dashboard 是 View。

底层实体和关系才是系统。

### 16.2 Evidence before Interpretation

先记录发生了什么，再解释它意味着什么。

### 16.3 Decisions are first-class objects

重要决策必须可以被回溯和复盘。

### 16.4 Capital is cumulative

一次项目、一次实验、一次合作可能同时产生多种资本。

### 16.5 Identity is stable, branches are flexible

长期研究身份应跨越技术范式。

### 16.6 Option Value matters

当前收益不是唯一目标。

一个行动如果显著扩大未来选择空间，即使短期收益有限，也可能具有很高战略价值。

### 16.7 Do not overbuild

系统必须先能够使用，再逐步自动化。

### 16.8 The system should reduce cognitive load

最终目标不是让用户维护一个更复杂的系统。

目标是：

**让系统承担记忆，让人承担判断。**

------------------------------------------------------------------------

## 17. Initial Navigation

建议 V1 保持七个一级入口：

-   HOME
-   STRATEGY
-   RESEARCH
-   DECISIONS
-   RADAR
-   NETWORK
-   PROFILE

Projects、Evidence、Experiments、Capital 等作为底层对象或二级入口存在。

------------------------------------------------------------------------

## 18. Long-Term Vision

myworkbench 最终希望成为一个个人级的：

**Strategy OS + Research OS + Decision Journal + Capital Ledger +
Opportunity Graph**

它持续记录一个人的：

**世界认知 → 研究 → 决策 → 行动 → 结果 → 资本 → 选项**

并在多年之后仍然能够回答：

> 我为什么走到今天？

以及：

> 基于现在的信息，下一步最值得做什么？

------------------------------------------------------------------------

## 19. Status

Current stage:

**Initialization**

Current architecture:

**Fusion v1**

Immediate priority:

**Build the minimum viable workbench before adding automation.**
