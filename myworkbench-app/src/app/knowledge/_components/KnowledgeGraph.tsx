'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ForceSimulation, SimNode } from '@/lib/force-graph';

export interface KTCategory {
  name: string;
  color: string;
}

export interface KTNode {
  id: string;
  name: string;
  category: number;
  heat: number;
  notionId: string | null;
  size: number;
}

export interface KnowledgeTreeData {
  meta: { source: string; extractedAt: string; note: string };
  categories: KTCategory[];
  nodes: KTNode[];
  links: [string, string][];
}

export interface MyPosition {
  type: string;
  id: string;
  title: string;
  href: string;
  nodes: string[];
}

const TYPE_LABELS: Record<string, string> = {
  research: '研究',
  profile: '档案',
  opportunity: '机会',
  task: '任务',
  evidence: '文献',
};

/** 一级领域节点按 size 判定（300/200），其余按热度开方铺开 */
function nodeRadius(n: KTNode): number {
  if (n.size >= 300) return 20;
  if (n.size >= 200) return 15;
  return Math.max(4, Math.min(12, 4 + Math.sqrt(n.heat) / 18));
}

export function KnowledgeGraph({ tree, myPositions }: KnowledgeGraphProps) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selected, setSelected] = useState<KTNode | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [transform, setTransform] = useState({ tx: 0, ty: 0, scale: 1 });

  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<ForceSimulation | null>(null);
  const rafRef = useRef<number>(0);
  const dragNodeRef = useRef<string | null>(null);
  const dragModeRef = useRef<'none' | 'pan' | 'node'>('none');
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const nodeDownRef = useRef({ x: 0, y: 0, moved: 0 });
  const didFitRef = useRef(false);

  /* ---- 展示数据：领域过滤 ---- */
  const display = useMemo(() => {
    if (activeCat === null) {
      return { nodes: tree.nodes, links: tree.links };
    }
    const ids = new Set(tree.nodes.filter((n) => n.category === activeCat).map((n) => n.id));
    return {
      nodes: tree.nodes.filter((n) => ids.has(n.id)),
      links: tree.links.filter(([s, t]) => ids.has(s) && ids.has(t)),
    };
  }, [tree, activeCat]);

  const nodeById = useMemo(() => new Map(tree.nodes.map((n) => [n.id, n])), [tree]);
  const catByIndex = useMemo(() => tree.categories, [tree]);

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const [s, t] of tree.links) {
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s)!.add(t);
      map.get(t)!.add(s);
    }
    return map;
  }, [tree]);

  /** 同领域热度排名（1 = 最热） */
  const heatRank = useMemo(() => {
    const byCat = new Map<number, KTNode[]>();
    for (const n of tree.nodes) {
      const arr = byCat.get(n.category) || [];
      arr.push(n);
      byCat.set(n.category, arr);
    }
    const rank = new Map<string, number>();
    for (const arr of byCat.values()) {
      arr.sort((a, b) => b.heat - a.heat);
      arr.forEach((n, i) => rank.set(n.id, i + 1));
    }
    return rank;
  }, [tree]);

  /** 名称 → 候选节点（同名时定位到 size 更大的一级节点） */
  const nameToNode = useMemo(() => {
    const m = new Map<string, KTNode>();
    for (const n of tree.nodes) {
      const prev = m.get(n.name);
      if (!prev || n.size > prev.size) m.set(n.name, n);
    }
    return m;
  }, [tree]);

  /** 我的定位：节点 id → 指向它的实体 */
  const myMatch = useMemo(() => {
    const map = new Map<string, MyPosition[]>();
    for (const p of myPositions) {
      for (const name of p.nodes) {
        const node = nameToNode.get(name);
        if (!node) continue;
        const arr = map.get(node.id) || [];
        arr.push(p);
        map.set(node.id, arr);
      }
    }
    return map;
  }, [myPositions, nameToNode]);

  /** 我的定位未命中的节点名（提示反馈） */
  const unmatchedNames = useMemo(() => {
    const set = new Set<string>();
    for (const p of myPositions) {
      for (const name of p.nodes) {
        if (!nameToNode.has(name)) set.add(name);
      }
    }
    return [...set];
  }, [myPositions, nameToNode]);

  /* ---- 仿真布局 ---- */
  const categoryOf = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of tree.nodes) m.set(n.id, n.category);
    return m;
  }, [tree]);

  const prevPositionsRef = useRef(new Map<string, { x: number; y: number }>());
  useEffect(() => {
    const prev = prevPositionsRef.current;
    const sim = new ForceSimulation(
      display.nodes.map((n) => n.id),
      display.links.map(([s, t]) => ({ source: s, target: t })),
      {
        // 大图参数：中等斥力 + 弱全局向心 + 强领域分组向心 → 按领域聚成星团
        linkDistance: 42,
        repulsion: 3200,
        gravity: 0.018,
        groupOf: (id) => categoryOf.get(id),
        groupGravity: 0.12,
      },
      activeCat === null ? prev : undefined
    );
    simRef.current = sim;
    sim.reheat(1);
    for (let i = 0; i < 600 && sim.alpha >= 0.02; i++) {
      sim.step();
    }
    const map: Record<string, { x: number; y: number }> = {};
    for (const n of sim.nodes) map[n.id] = { x: n.x, y: n.y };
    prevPositionsRef.current = new Map(sim.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
    setPositions(map);

    const tick = () => {
      const s = simRef.current;
      if (s && s.alpha >= 0.02) {
        s.step();
        const next: Record<string, { x: number; y: number }> = {};
        for (const n of s.nodes) next[n.id] = { x: n.x, y: n.y };
        prevPositionsRef.current = new Map(s.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
        setPositions(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [display, activeCat]);

  // 首次布局完成后自动适应视图
  useEffect(() => {
    if (!didFitRef.current && Object.keys(positions).length > 0) {
      didFitRef.current = true;
      const timer = setTimeout(fitView, 50);
      return () => clearTimeout(timer);
    }
  }, [positions]);

  const queryMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      tree.nodes.filter((n) => n.name.toLowerCase().includes(q)).map((n) => n.id)
    );
  }, [query, tree]);

  const focusSet = useMemo(() => {
    if (hoverId) return new Set([hoverId, ...(adjacency.get(hoverId) || [])]);
    if (queryMatches) return queryMatches;
    return null;
  }, [hoverId, queryMatches, adjacency]);

  const nodeOpacity = (id: string): number => {
    if (!focusSet) return 1;
    return focusSet.has(id) ? 1 : 0.12;
  };
  const edgeOpacity = ([s, t]: [string, string]): number => {
    if (!focusSet) return 0.2;
    return focusSet.has(s) && focusSet.has(t) ? 0.7 : 0.04;
  };

  /* ---- 缩放 / 平移 / 拖拽（与 NetworkGraph 同一套已验证实现） ---- */
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const { tx, ty, scale } = transformRef.current;
    return {
      x: (clientX - rect.left - tx) / scale,
      y: (clientY - rect.top - ty) / scale,
    };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setTransform((t) => {
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const scale = Math.min(6, Math.max(0.2, t.scale * factor));
      const applied = scale / t.scale;
      return {
        scale,
        tx: px - (px - t.tx) * applied,
        ty: py - (py - t.ty) * applied,
      };
    });
  }, []);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    const nodeId = target.getAttribute('data-node-id');
    if (nodeId) {
      dragModeRef.current = 'node';
      dragNodeRef.current = nodeId;
      nodeDownRef.current = { x: e.clientX, y: e.clientY, moved: 0 };
      const sim = simRef.current;
      const node = sim?.nodes.find((n) => n.id === nodeId);
      if (node) {
        const w = toWorld(e.clientX, e.clientY);
        node.fx = w.x;
        node.fy = w.y;
      }
      simRef.current?.reheat(0.4);
      try {
        svgRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // 合成事件（自动化）无真实 pointer，忽略
      }
    } else {
      dragModeRef.current = 'pan';
      panStartRef.current = { x: e.clientX, y: e.clientY, tx: transformRef.current.tx, ty: transformRef.current.ty };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragModeRef.current === 'pan') {
      const start = panStartRef.current;
      setTransform((t) => ({ ...t, tx: start.tx + (e.clientX - start.x), ty: start.ty + (e.clientY - start.y) }));
    } else if (dragModeRef.current === 'node' && dragNodeRef.current) {
      const sim = simRef.current;
      if (!sim) return;
      const start = nodeDownRef.current;
      start.moved += Math.abs(e.movementX) + Math.abs(e.movementY);
      const node = sim.nodes.find((n) => n.id === dragNodeRef.current);
      if (node) {
        const w = toWorld(e.clientX, e.clientY);
        node.fx = w.x;
        node.fy = w.y;
        sim.step();
        const next: Record<string, { x: number; y: number }> = {};
        for (const n of sim.nodes) next[n.id] = { x: n.x, y: n.y };
        prevPositionsRef.current = new Map(sim.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
        setPositions(next);
        sim.reheat(0.3);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const wasNode = dragModeRef.current === 'node';
    const moved = nodeDownRef.current.moved;
    const nodeId = dragNodeRef.current;
    dragModeRef.current = 'none';
    dragNodeRef.current = null;
    const sim = simRef.current;
    const node = sim?.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.fx = undefined;
      node.fy = undefined;
    }
    if (wasNode && nodeId && moved < 6) {
      const found = nodeById.get(nodeId);
      if (found) setSelected(found);
      simRef.current?.reheat(0.2);
    }
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // 忽略合成 pointerId
    }
  };

  function fitView() {
    const pts = Object.values(positions);
    if (pts.length === 0 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const minX = Math.min(...pts.map((p) => p.x)) - 60;
    const maxX = Math.max(...pts.map((p) => p.x)) + 60;
    const minY = Math.min(...pts.map((p) => p.y)) - 60;
    const maxY = Math.max(...pts.map((p) => p.y)) + 60;
    const scale = Math.min(2.5, Math.max(0.2, Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY))));
    setTransform({
      scale,
      tx: rect.width / 2 - ((minX + maxX) / 2) * scale,
      ty: rect.height / 2 - ((minY + maxY) / 2) * scale,
    });
  }

  /* ---- 侧栏：领域热度概览 ---- */
  const categoryStats = useMemo(() => {
    const stats = tree.categories.map((c, i) => {
      const nodes = tree.nodes.filter((n) => n.category === i);
      const heat = nodes.reduce((s, n) => s + n.heat, 0);
      return { index: i, name: c.name, color: c.color, count: nodes.length, heat };
    });
    return stats.sort((a, b) => b.heat - a.heat);
  }, [tree]);
  const maxCatHeat = Math.max(...categoryStats.map((c) => c.heat), 1);

  const neighbors = useMemo(() => {
    if (!selected) return [];
    return [...(adjacency.get(selected.id) || [])]
      .map((id) => nodeById.get(id))
      .filter((n): n is KTNode => !!n)
      .sort((a, b) => b.heat - a.heat);
  }, [selected, adjacency, nodeById]);

  const selectedMyEntities = selected ? myMatch.get(selected.id) || [] : [];

  return (
    <div className="space-y-3">
      {/* 工具条 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索领域 / 研究方向..."
          className="w-56 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <button
          onClick={fitView}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          适应视图
        </button>
        <button
          onClick={() => setTransform({ tx: 0, ty: 0, scale: 1 })}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          重置
        </button>
        {activeCat !== null && (
          <button
            onClick={() => setActiveCat(null)}
            className="px-3 py-1.5 text-sm border border-accent-300 dark:border-accent-700 rounded-lg text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30"
          >
            取消隔离：{tree.categories[activeCat]?.name} ✕
          </button>
        )}
        <span className="text-xs text-gray-400">
          {display.nodes.length} 节点 · {display.links.length} 连边 · 16 领域 · 数据快照 {tree.meta.extractedAt.slice(0, 10)}
        </span>
      </div>

      {/* 领域图例（点击隔离） */}
      <div className="flex flex-wrap gap-1.5">
        {tree.categories.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setActiveCat(activeCat === i ? null : i)}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border transition-colors ${
              activeCat === i
                ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* 画布 */}
        <div className="relative flex-1 min-w-0">
          <svg
            ref={svgRef}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`w-full h-[480px] lg:h-[640px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 touch-none select-none ${
              dragModeRef.current === 'pan' ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <g transform={`translate(${transform.tx},${transform.ty}) scale(${transform.scale})`}>
              {display.links.map(([s, t]) => {
                const a = positions[s];
                const b = positions[t];
                if (!a || !b) return null;
                return (
                  <line
                    key={`${s}-${t}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    className="stroke-slate-300 dark:stroke-slate-600"
                    strokeWidth={0.8}
                    opacity={edgeOpacity([s, t])}
                  />
                );
              })}
              {display.nodes.map((n) => {
                const p = positions[n.id];
                if (!p) return null;
                const r = nodeRadius(n);
                const color = catByIndex[n.category]?.color || '#94a3b8';
                const isMine = myMatch.has(n.id);
                const showLabel = r >= 9.5 || hoverId === n.id || selected?.id === n.id || isMine || (queryMatches?.has(n.id) ?? false);
                return (
                  <g key={n.id} opacity={nodeOpacity(n.id)}>
                    {isMine && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={r + 5}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        strokeDasharray="5 3"
                        pointerEvents="none"
                      />
                    )}
                    <circle
                      data-node-id={n.id}
                      cx={p.x}
                      cy={p.y}
                      r={r}
                      fill={color}
                      className="cursor-pointer"
                      stroke={selected?.id === n.id ? '#3b82f6' : 'rgba(255,255,255,0.6)'}
                      strokeWidth={selected?.id === n.id ? 2.5 : 1}
                      onPointerOver={() => setHoverId(n.id)}
                      onPointerOut={() => setHoverId((prev) => (prev === n.id ? null : prev))}
                    />
                    {showLabel && (
                      <text
                        x={p.x}
                        y={p.y + r + 12}
                        textAnchor="middle"
                        className="fill-gray-600 dark:fill-gray-400 pointer-events-none"
                        fontSize={isMine || selected?.id === n.id ? 12 : 10}
                        fontWeight={isMine ? 600 : 400}
                      >
                        {n.name.length > 12 ? `${n.name.slice(0, 12)}…` : n.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* 图例说明 */}
          <div className="absolute left-3 bottom-3 bg-white/85 dark:bg-gray-800/85 backdrop-blur rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
            <p className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full inline-block border-2 border-dashed border-amber-500 inline-block" />
              虚线圈 = 我的知识树定位
            </p>
            <p>点越大 = 智源热度越高；点击图例可隔离领域</p>
          </div>
        </div>

        {/* 侧栏 */}
        <aside className="lg:w-96 shrink-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 lg:max-h-[780px] overflow-y-auto">
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-medium text-white"
                    style={{ backgroundColor: catByIndex[selected.category]?.color }}
                  >
                    {catByIndex[selected.category]?.name}
                  </span>
                  <h3 className="mt-1.5 text-lg font-semibold text-gray-900 dark:text-white">{selected.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    智源热度 {selected.heat.toLocaleString('zh-CN')} · 同域第 {heatRank.get(selected.id)} 名 ·{' '}
                    {(adjacency.get(selected.id)?.size || 0)} 条关联
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  aria-label="关闭面板"
                >
                  ✕
                </button>
              </div>

              {selectedMyEntities.length > 0 && (
                <div className="mt-3 p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1.5">⭐ 我的方向（{selectedMyEntities.length}）</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMyEntities.map((p) => (
                      <Link
                        key={`${p.type}-${p.id}`}
                        href={p.href}
                        className="px-2 py-0.5 rounded-full text-xs bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 text-gray-700 dark:text-gray-300 hover:border-amber-500"
                      >
                        <span className="text-[10px] text-gray-400 mr-1">{TYPE_LABELS[p.type] || p.type}</span>
                        {p.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {neighbors.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">相邻方向（按热度）</p>
                  <div className="flex flex-wrap gap-1.5">
                    {neighbors.slice(0, 20).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setSelected(n)}
                        className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        {n.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selected.notionId && (
                <a
                  href={`https://hub.baai.ac.cn/knowledge-tree/${selected.notionId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm text-accent-600 dark:text-accent-400 hover:underline"
                >
                  在智源社区查看 →
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* 我的定位 */}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">我的定位</p>
                {myPositions.length === 0 ? (
                  <p className="text-xs text-gray-400 leading-relaxed">
                    还没有定位。在研究 / 档案 / 机会 / 任务的编辑表单里填写「知识树定位」字段（如：持续学习, AI 系统与硬件），图上会用虚线圈标出你的位置。
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {myPositions.map((p) => (
                      <li key={`${p.type}-${p.id}`}>
                        <Link
                          href={p.href}
                          className="block p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-accent-300 dark:hover:border-accent-700 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300 text-[10px] font-medium">
                              {TYPE_LABELS[p.type] || p.type}
                            </span>
                            <span className="text-sm text-gray-900 dark:text-gray-200 truncate">{p.title}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.nodes.map((name) => {
                              const node = nameToNode.get(name);
                              if (!node) {
                                return (
                                  <span key={name} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-400" title="知识树中未找到该节点名">
                                    {name}（未匹配）
                                  </span>
                                );
                              }
                              return (
                                <button
                                  key={name}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelected(node);
                                  }}
                                  className="px-1.5 py-0.5 rounded text-[10px] text-white"
                                  style={{ backgroundColor: catByIndex[node.category]?.color }}
                                  title={`热度 ${node.heat.toLocaleString('zh-CN')} · 同域第 ${heatRank.get(node.id)} 名`}
                                >
                                  {name}
                                </button>
                              );
                            })}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {unmatchedNames.length > 0 && (
                  <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                    未匹配节点名：{unmatchedNames.join('、')}（请对照图中节点名修改）
                  </p>
                )}
              </div>

              {/* 领域热度概览 */}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">领域热度概览</p>
                <ul className="space-y-1.5">
                  {categoryStats.map((c) => (
                    <li key={c.name}>
                      <button
                        onClick={() => setActiveCat(activeCat === c.index ? null : c.index)}
                        className="w-full text-left group"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 group-hover:text-accent-600 dark:group-hover:text-accent-400">
                            <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </span>
                          <span className="text-gray-400">
                            {c.count} 节点 · {c.heat.toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <div className="mt-0.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-full opacity-70"
                            style={{ width: `${Math.max(2, (c.heat / maxCatHeat) * 100)}%`, backgroundColor: c.color }}
                          />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

interface KnowledgeGraphProps {
  tree: KnowledgeTreeData;
  myPositions: MyPosition[];
}
