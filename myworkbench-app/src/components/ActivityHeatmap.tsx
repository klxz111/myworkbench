/**
 * 活跃热力图：近 N 周每日更新数。
 * 数据来自 /api/stats 的 activity（以今天为终点、按天升序的 {date,count} 数组），
 * 组件内部自己补齐空缺日期并把列对齐到周一；未来几天（本周内）留空。
 */
function localDateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function levelClass(count: number, max: number): string {
  if (count <= 0) return 'bg-gray-100 dark:bg-gray-800';
  const ratio = max > 0 ? count / max : 1;
  if (ratio > 0.66) return 'bg-blue-600 dark:bg-blue-500';
  if (ratio > 0.33) return 'bg-blue-400 dark:bg-blue-600';
  return 'bg-blue-200 dark:bg-blue-800';
}

export function ActivityHeatmap({ activity, weeks = 12 }: { activity: { date: string; count: number }[]; weeks?: number }) {
  const countByDate = new Map(activity.map((a) => [a.date, a.count]));
  const max = Math.max(0, ...activity.map((a) => a.count));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - ((today.getDay() + 6) % 7))); // 本周日（列对齐周一为行首）

  const totalDays = weeks * 7;
  const columns: { date: string; count: number; future: boolean }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { date: string; count: number; future: boolean }[] = [];
    for (let dIdx = w * 7; dIdx < w * 7 + 7; dIdx++) {
      const d = new Date(end);
      d.setDate(d.getDate() - (totalDays - 1 - dIdx));
      col.push({ date: localDateKey(d), count: countByDate.get(localDateKey(d)) || 0, future: d > today });
    }
    columns.push(col);
  }

  return (
    <div>
      <div className="flex gap-[3px]">
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((cell) => (
              <span
                key={cell.date}
                title={`${cell.date}：${cell.future ? '—' : `${cell.count} 次更新`}`}
                className={`h-3.5 w-3.5 rounded-[3px] ${cell.future ? 'bg-transparent' : levelClass(cell.count, max)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
        <span>少</span>
        <span className="h-2.5 w-2.5 rounded-[2px] bg-gray-100 dark:bg-gray-800" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-blue-200 dark:bg-blue-800" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-blue-400 dark:bg-blue-600" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-blue-600 dark:bg-blue-500" />
        <span>多</span>
      </div>
    </div>
  );
}
