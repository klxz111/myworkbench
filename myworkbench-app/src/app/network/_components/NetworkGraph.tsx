'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ForceSimulation, SimNode } from '@/lib/force-graph';

interface GraphNode {
  id: string;
  type: 'person' | 'organization';
  title: string;
  status: string;
  degree: number;
  role?: string;
  organization?: string;
  relationship_strength?: string;
  industry?: string;
  location?: string;
  href: string;
  opportunities: {
    id: string;
    title: string;
    category: string;
    deadline: string;
    strategic_fit: string;
    href: string;
  }[];
}

interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  counts: { person: number; organization: number; edge: number; opportunity_links: number };
}

interface FullEntity {
  id: string;
  type: string;
  title: string;
  status: string;
  tags: string[];
  content: string;
  frontmatter?: Record<string, unknown>;
}

interface RelationChip {
  to_id: string;
  relation: string;
  title: string;
  type: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  research: '科研',
  internship: '实习',
  scholarship: '奖学金',
  fellowship: 'Fellowship',
  phd: 'PhD',
  postdoc: 'Postdoc',
  company: '公司',
  lab: '实验室',
  advisor: '导师',
  oss: '开源',
  startup: '创业',
  conference: '会议',
};

const STRENGTH_STROKE: Record<string, string> = {
  strong: 'stroke-emerald-500',
  medium: 'stroke-amber-400',
  weak: 'stroke-gray-400 dark:stroke-gray-600',
};

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function nodeRadius(degree: number): number {
  return 8 + Math.min(degree, 6) * 2;
}

export function NetworkGraph() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [fullEntity, setFullEntity] = useState<FullEntity | null>(null);
  const [selectedRelations, setSelectedRelations] = useState<RelationChip[]>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [transform, setTransform] = useState({ tx: 0, ty: 0, scale: 1 });

  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<ForceSimulation | null>(null);
  const rafRef = useRef<number>(0);
  const dragNodeRef = useRef<string | null>(null);
  const dragModeRef = useRef<'none' | 'pan' | 'node'>('none');
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const nodeDownRef = useRef({ x: 0, y: 0, moved: 0 });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/network/graph');
      if (!res.ok) throw new Error('加载失败');
      const json: GraphData = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error loading network graph:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 数据变化：重建仿真并同步预迭代到基本收敛（不依赖 rAF，后台标签页也能出图），
  // 之后 rAF 循环只负责交互（拖拽 reheat）的平滑收敛
  const prevPositionsRef = useRef(new Map<string, { x: number; y: number }>());
  useEffect(() => {
    if (!data) return;
    const prev = prevPositionsRef.current;
    const sim = new ForceSimulation(
      data.nodes.map((n) => n.id),
      data.edges.map((e) => ({ source: e.from, target: e.to })),
      {},
      prev
    );
    simRef.current = sim;
    sim.reheat(1);
    for (let i = 0; i < 300 && sim.alpha >= 0.02; i++) {
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
  }, [data]);

  // 选中节点 → 拉取完整信息与关系
  useEffect(() => {
    if (!selected) {
      setFullEntity(null);
      setSelectedRelations([]);
      return;
    }
    let cancelled = false;
    async function loadDetail() {
      try {
        const [entityRes, relRes] = await Promise.all([
          fetch(`/api/entities/${selected!.type}/${selected!.id}`),
          fetch(`/api/relations?from=${encodeURIComponent(selected!.id)}`),
        ]);
        if (cancelled) return;
        if (entityRes.ok) setFullEntity(await entityRes.json());
        if (relRes.ok) {
          const relData = await relRes.json();
          setSelectedRelations(relData.relations || []);
        }
      } catch {
        // 面板信息加载失败不阻塞图
      }
    }
    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of data?.edges || []) {
      if (!map.has(e.from)) map.set(e.from, new Set());
      if (!map.has(e.to)) map.set(e.to, new Set());
      map.get(e.from)!.add(e.to);
      map.get(e.to)!.add(e.from);
    }
    return map;
  }, [data]);

  const queryMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      (data?.nodes || [])
        .filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            (n.role || '').toLowerCase().includes(q) ||
            (n.industry || '').toLowerCase().includes(q)
        )
        .map((n) => n.id)
    );
  }, [query, data]);

  const focusSet = useMemo(() => {
    if (hoverId) {
      return new Set([hoverId, ...(adjacency.get(hoverId) || [])]);
    }
    if (queryMatches) return queryMatches;
    return null;
  }, [hoverId, queryMatches, adjacency]);

  const nodeOpacity = (id: string): number => {
    if (!focusSet) return 1;
    return focusSet.has(id) ? 1 : 0.12;
  };
  const edgeOpacity = (e: GraphEdge): number => {
    if (!focusSet) return 0.55;
    return focusSet.has(e.from) && focusSet.has(e.to) ? 0.9 : 0.06;
  };

  /* ---- 缩放 / 平移 / 拖拽 ---- */

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const { tx, ty, scale } = transformRef.current;
    return {
      x: (clientX - rect.left - tx) / scale,
      y: (clientY - rect.top - ty) / scale,
    };
  }, []);

  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setTransform((t) => {
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const scale = Math.min(4, Math.max(0.25, t.scale * factor));
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
        // 直接推进一步并渲染：不依赖 rAF（后台标签页 rAF 会被暂停）
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
      const found = data?.nodes.find((n) => n.id === nodeId);
      if (found) setSelected(found);
      simRef.current?.reheat(0.2);
    }
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // 忽略合成 pointerId
    }
  };

  const fitView = () => {
    const pts = Object.values(positions);
    if (pts.length === 0 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const minX = Math.min(...pts.map((p) => p.x)) - 60;
    const maxX = Math.max(...pts.map((p) => p.x)) + 60;
    const minY = Math.min(...pts.map((p) => p.y)) - 60;
    const maxY = Math.max(...pts.map((p) => p.y)) + 60;
    const scale = Math.min(2, Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY)));
    setTransform({
      scale,
      tx: rect.width / 2 - ((minX + maxX) / 2) * scale,
      ty: rect.height / 2 - ((minY + maxY) / 2) * scale,
    });
  };

  if (loading) return <div className="text-gray-500">加载点状网中...</div>;
  if (!data) return <div className="text-red-500">加载失败</div>;

  const nodeById = new Map(data.nodes.map((n) => [n.id, n]));

  return (
    <div className="space-y-3">
      {/* 工具条 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索人名 / 职位 / 机构..."
          className="w-56 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <span className="text-xs text-gray-400">
          {data.counts.person} 人 · {data.counts.organization} 组织 · {data.counts.edge} 条关系 · 拖拽节点 / 滚轮缩放 / 点击看详情
        </span>
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
            className={`w-full h-[460px] lg:h-[600px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 touch-none select-none ${
              dragModeRef.current === 'pan' ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <g transform={`translate(${transform.tx},${transform.ty}) scale(${transform.scale})`}>
              {data.edges.map((e) => {
                const a = positions[e.from];
                const b = positions[e.to];
                if (!a || !b) return null;
                return (
                  <line
                    key={`${e.from}-${e.to}-${e.relation}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    className="stroke-slate-300 dark:stroke-slate-600"
                    strokeWidth={1.2}
                    opacity={edgeOpacity(e)}
                  />
                );
              })}
              {data.nodes.map((n) => {
                const p = positions[n.id];
                if (!p) return null;
                const r = nodeRadius(n.degree);
                const strengthClass = n.type === 'person' && n.relationship_strength ? STRENGTH_STROKE[n.relationship_strength] : '';
                return (
                  <g key={n.id} opacity={nodeOpacity(n.id)}>
                    <circle
                      data-node-id={n.id}
                      cx={p.x}
                      cy={p.y}
                      r={r}
                      className={`${n.type === 'person' ? 'fill-sky-500' : 'fill-amber-500'} ${
                        strengthClass ? `${strengthClass} ` : ''
                      }cursor-pointer`}
                      strokeWidth={strengthClass ? 2.5 : 0}
                      onPointerOver={() => setHoverId(n.id)}
                      onPointerOut={() => setHoverId((prev) => (prev === n.id ? null : prev))}
                    />
                    {(data.nodes.length <= 40 || hoverId === n.id || selected?.id === n.id) && (
                      <text
                        x={p.x}
                        y={p.y + r + 13}
                        textAnchor="middle"
                        className="fill-gray-600 dark:fill-gray-400 pointer-events-none"
                        fontSize={11}
                      >
                        {n.title.length > 14 ? `${n.title.slice(0, 14)}…` : n.title}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* 图例 */}
          <div className="absolute left-3 bottom-3 bg-white/85 dark:bg-gray-800/85 backdrop-blur rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
            <p className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 inline-block" /> 人员
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block ml-2" /> 组织
            </p>
            <p>点越大 = 关系越多；圆圈 = 关系强度（绿强 / 黄中 / 灰弱）</p>
          </div>

          {data.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-400">暂无人员或组织数据。先在「人员」「组织」页创建。</p>
            </div>
          )}
        </div>

        {/* 信息面板 */}
        {selected && (
          <aside className="lg:w-96 shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 lg:max-h-[600px] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      selected.type === 'person'
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    }`}
                  >
                    {selected.type === 'person' ? '人员' : '组织'}
                  </span>
                  <span className="text-xs text-gray-400">{selected.degree} 条关系</span>
                  {selected.relationship_strength && (
                    <span className="text-xs text-gray-400">强度：{selected.relationship_strength}</span>
                  )}
                </div>
                <h3 className="mt-1.5 text-lg font-semibold text-gray-900 dark:text-white">{selected.title}</h3>
                {(selected.role || selected.industry) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selected.role || selected.industry}</p>
                )}
                {(selected.organization || selected.location) && (
                  <p className="text-xs text-gray-400">{selected.organization || selected.location}</p>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                aria-label="关闭面板"
              >
                ✕
              </button>
            </div>

            {fullEntity?.content && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap line-clamp-6">
                {fullEntity.content.trim()}
              </p>
            )}

            {selectedRelations.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">关系</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRelations.map((rel) => (
                    <button
                      key={`${rel.to_id}-${rel.relation}`}
                      onClick={() => {
                        const target = nodeById.get(rel.to_id);
                        if (target) setSelected(target);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <span className="text-[10px] text-gray-400 uppercase">{rel.relation}</span>
                      {rel.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 申请机会（硕博申请视角） */}
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                关联申请机会（{selected.opportunities.length}）
              </p>
              {selected.opportunities.length === 0 ? (
                <p className="text-xs text-gray-400">
                  暂无关联机会。可在机会页通过关系关联到该{selected.type === 'person' ? '人物' : '机构'}。
                </p>
              ) : (
                <ul className="space-y-2">
                  {selected.opportunities.map((o) => {
                    const dd = daysUntil(o.deadline);
                    return (
                      <li key={o.id}>
                        <Link
                          href={o.href}
                          className="block p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-medium">
                              {CATEGORY_LABELS[o.category] || o.category}
                            </span>
                            {o.strategic_fit && (
                              <span className="text-[10px] text-gray-400">契合 {o.strategic_fit}/10</span>
                            )}
                            {dd !== null && o.deadline && (
                              <span
                                className={`text-[10px] ml-auto ${
                                  dd < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : dd <= 30
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-gray-400'
                                }`}
                              >
                                {dd < 0 ? `截止已过 ${Math.abs(dd)} 天` : dd === 0 ? '今天截止' : `${dd} 天后截止`}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-900 dark:text-gray-200 line-clamp-2">{o.title}</p>
                          {o.deadline && <p className="text-[10px] text-gray-400">截止：{o.deadline}</p>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <Link
              href={selected.href}
              className="mt-4 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              打开完整详情页 →
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
