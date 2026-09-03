'use client';

import { useEffect, useState, useCallback } from 'react';
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

const NODE_LABELS: Record<string, string> = {
  evidence: 'E',
  belief: 'B',
  decision: 'D',
  project: 'P',
  experiment: 'X',
  research: 'R',
  person: 'N',
  strategy: 'S',
};

interface GraphData {
  nodes: { id: string; type: string; title: string; status: string }[];
  edges: { id: string; source: string; target: string; relation: string }[];
}

export function GraphClient() {
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

  const getNodeUrl = useCallback((nodeId: string, nodeType: string): string => {
    const typeMap: Record<string, string> = {
      evidence: '/evidence',
      belief: '/belief',
      decision: '/decisions',
      project: '/projects',
      experiment: '/projects',
      research: '/research',
      person: '/people',
      strategy: '/strategy',
    };
    return `${typeMap[nodeType] || '/'}/${nodeId}`;
  }, []);

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

  const nodes: Node[] = graphData.nodes.map((node) => {
    const colors = NODE_COLORS[node.type] || NODE_COLORS.strategy;
    const label = NODE_LABELS[node.type] || node.type[0].toUpperCase();

    return {
      id: node.id,
      type: 'default',
      position: { x: 0, y: 0 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        label: (
          <div className={`px-3 py-2 rounded-lg border ${colors.bg} ${colors.border} ${colors.text} min-w-[120px] text-center`}>
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

  const edges: Edge[] = graphData.edges.map((edge) => ({
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
            const type = (node.data as any)?.label?.props?.children?.[0]?.props?.children || 'strategy';
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
            return colors[type] || '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
