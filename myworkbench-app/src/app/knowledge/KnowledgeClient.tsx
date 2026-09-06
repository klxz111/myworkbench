'use client';

import { useEffect, useState } from 'react';
import { KnowledgeGraph, KnowledgeTreeData, MyPosition } from './_components/KnowledgeGraph';
import treeSnapshot from '@/data/knowledge-tree.json';

const tree = treeSnapshot as unknown as KnowledgeTreeData;

export function KnowledgeClient() {
  const [myPositions, setMyPositions] = useState<MyPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/knowledge/positions');
        if (res.ok) {
          const data = await res.json();
          setMyPositions(Array.isArray(data.positions) ? data.positions : []);
        }
      } catch (error) {
        console.error('Error loading knowledge positions:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">加载知识树与定位数据...</div>;
  }

  return <KnowledgeGraph tree={tree} myPositions={myPositions} />;
}
