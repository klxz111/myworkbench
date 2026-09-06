'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dagre from '@dagrejs/dagre';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  evidence: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
  belief: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
  decision: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' },
  project: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900' },
  experiment: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900' },
  research: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900' },
  person: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900' },
  strategy: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
};

const TYPE_URLS: Record<string, string> = {
  evidence: '/evidence',
  belief: '/belief',
  decision: '/decisions',
  project: '/projects',
  experiment: '/experiment',
  research: '/research',
  person: '/people',
  strategy: '/strategy',
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;

interface GraphData {
  nodes: { id: string; type: string; title: string; status: string }[];
  edges: { id: string; source: string; target: string; relation: string }[];
}

export function GraphClient() {
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGraph() {
      try {
        const res = await fetch('/api/graph');
        if (!res.ok) {
          throw new Error('Failed to fetch graph data');
        }
        const data = await res.json();
        setGraphData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph');
      } finally {
        setLoading(false);
      }
    }
    fetchGraph();
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!graphData || graphData.nodes.length === 0) {
      return { nodes: [] as Node[], edges: [] as Edge[] };
    }

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 150 });
    for (const n of graphData.nodes) {
      g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }
    for (const e of graphData.edges) {
      g.setEdge(e.source, e.target);
    }
    dagre.layout(g);

    const layoutNodes: Node[] = graphData.nodes.map((node) => {
      const pos = g.node(node.id);
      const colors = NODE_COLORS[node.type] || NODE_COLORS.strategy;
      return {
        id: node.id,
        type: 'default',
        position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          entityType: node.type,
          label: (
            <div
              className={`px-3 py-2 rounded-lg border ${colors.bg} ${colors.border} ${colors.text} min-w-[120px] text-center cursor-pointer`}
            >
              <div className="text-xs font-medium opacity-70 mb-1">{node.type}</div>
              <div className="text-sm font-semibold truncate">{node.title}</div>
            </div>
          ),
        },
        style: {
          background: 'transparent',
          border: 'none',
          padding: 0,
        },
      };
    });

    const layoutEdges: Edge[] = graphData.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.relation,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      labelStyle: {
        fontSize: 10,
        fontWeight: 500,
        fill: '#6b7280',
      },
      labelBgStyle: {
        fill: '#f9fafb',
        fillOpacity: 0.9,
      },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
    }));

    return { nodes: layoutNodes, edges: layoutEdges };
  }, [graphData]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const entityType = (node.data as { entityType?: string })?.entityType || '';
      const base = TYPE_URLS[entityType] || '/entities';
      router.push(`${base}/${node.id}`);
    },
    [router]
  );

  if (loading) {
    return <div className="text-gray-500">Loading evidence chain...</div>;
  }

  if (error || !graphData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error || 'Failed to load graph'}</p>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <p className="text-gray-500 text-lg">No entities yet. Create some evidence, beliefs, or decisions to see the chain.</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
      style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        fitView
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const entityType = (node.data as { entityType?: string })?.entityType || 'strategy';
            const colors: Record<string, string> = {
              evidence: '#3b82f6',
              belief: '#8b5cf6',
              decision: '#10b981',
              project: '#f59e0b',
              experiment: '#ec4899',
              research: '#6366f1',
              person: '#eab308',
              strategy: '#6b7280',
            };
            return colors[entityType] || '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}