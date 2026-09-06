/**
 * 轻量力导向布局（零依赖）。
 * 模型：节点间平方反比斥力 + 边弹簧 + 向心引力 + 速度阻尼，alpha 冷却收敛。
 * 规模目标：几十到几百个节点（O(n²) 斥力按帧计算足够）。
 */

export interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 拖拽固定坐标（拖动中节点不受力移动） */
  fx?: number;
  fy?: number;
  /** 影响布局的权重（连接多的节点略重） */
  mass: number;
}

export interface SimEdge {
  source: string;
  target: string;
}

export interface ForceGraphOptions {
  /** 边的理想长度 */
  linkDistance?: number;
  /** 斥力强度系数 */
  repulsion?: number;
  /** 向心引力系数 */
  gravity?: number;
  /** 速度阻尼（0-1，越大阻尼越小） */
  damping?: number;
}

const DEFAULTS = {
  linkDistance: 110,
  repulsion: 18000,
  gravity: 0.03,
  damping: 0.85,
};

export class ForceSimulation {
  nodes: SimNode[];
  private nodeById: Map<string, SimNode>;
  private edges: { a: SimNode; b: SimNode }[];
  private opts: typeof DEFAULTS;
  /** 活跃度：1 起步，每帧衰减，低于阈值停止；拖拽/初始化时 reheat */
  alpha = 1;

  constructor(
    nodeIds: string[],
    edges: SimEdge[],
    opts: ForceGraphOptions = {},
    /** 复用已有位置（数据刷新时保持布局） */
    previous?: Map<string, { x: number; y: number }>
  ) {
    this.opts = { ...DEFAULTS, ...opts };

    // 按度数分配质量与初始位置（圆周布局，复用旧位置优先）
    const degree = new Map<string, number>();
    for (const e of edges) {
      degree.set(e.source, (degree.get(e.source) || 0) + 1);
      degree.set(e.target, (degree.get(e.target) || 0) + 1);
    }
    const radius = Math.max(120, 28 * Math.sqrt(nodeIds.length || 1));
    const centerX = 0;
    const centerY = 0;

    this.nodes = nodeIds.map((id, i) => {
      const prev = previous?.get(id);
      const angle = (i / Math.max(1, nodeIds.length)) * Math.PI * 2;
      return {
        id,
        x: prev?.x ?? centerX + radius * Math.cos(angle),
        y: prev?.y ?? centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        mass: 1 + (degree.get(id) || 0) * 0.15,
      };
    });
    this.nodeById = new Map(this.nodes.map((n) => [n.id, n]));
    this.edges = edges
      .map((e) => {
        const a = this.nodeById.get(e.source);
        const b = this.nodeById.get(e.target);
        return a && b ? { a, b } : null;
      })
      .filter((x): x is { a: SimNode; b: SimNode } => x !== null);
  }

  reheat(alpha = 0.6) {
    this.alpha = Math.max(this.alpha, alpha);
  }

  /** 推进一步；返回本帧最大位移，供调用方判断是否稳定 */
  step(): number {
    if (this.alpha < 0.02) return 0;

    const { repulsion, linkDistance, gravity, damping } = this.opts;
    const nodes = this.nodes;
    let maxDisplacement = 0;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      // 斥力（平方反比，最近距离截断）
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          // 完全重合时给随机扰动
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          d2 = dx * dx + dy * dy;
        }
        const d = Math.sqrt(d2);
        const f = (repulsion / d2) * (1 + this.alpha * 0.5);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx += (fx / a.mass) * this.alpha;
        a.vy += (fy / a.mass) * this.alpha;
        b.vx -= (fx / b.mass) * this.alpha;
        b.vy -= (fy / b.mass) * this.alpha;
      }

      // 向心引力
      a.vx -= a.x * gravity * this.alpha;
      a.vy -= a.y * gravity * this.alpha;
    }

    // 边弹簧
    for (const { a, b } of this.edges) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const f = (d - linkDistance) * 0.02 * this.alpha;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // 积分 + 阻尼 + 位移上限
    const maxStep = 14;
    for (const n of nodes) {
      if (n.fx !== undefined && n.fy !== undefined) {
        n.x = n.fx;
        n.y = n.fy;
        n.vx = 0;
        n.vy = 0;
        continue;
      }
      n.vx *= damping;
      n.vy *= damping;
      let dx = n.vx;
      let dy = n.vy;
      const disp = Math.hypot(dx, dy);
      if (disp > maxStep) {
        dx = (dx / disp) * maxStep;
        dy = (dy / disp) * maxStep;
      }
      n.x += dx;
      n.y += dy;
      maxDisplacement = Math.max(maxDisplacement, Math.hypot(dx, dy));
    }

    this.alpha *= 0.97;
    return maxDisplacement;
  }
}
