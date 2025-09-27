// TaskCharts: visual summaries (pie, bar, area) of task data.
// Keeps transformations memoized to avoid re-renders unless tasks array changes.
// If dataset grows large you could virtualize or bucket by week.
import React, { useMemo } from 'react';
import { useTasksContext } from '../TasksContext';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, AreaChart, Area, CartesianGrid, LabelList
} from 'recharts';

// Palette refined for clearer distinctions + accessibility (avoid too-similar hues)

const PRIORITY_COLOR: Record<string,string> = {
  low: 'var(--accent-accent2)',
  medium: 'var(--accent-accent3)',
  high: 'var(--accent-accent4)'
};

const CHART_HEIGHT = 150; // compact height requested

function formatDateDay(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const TaskCharts: React.FC = () => {
  const { tasks } = useTasksContext();

  const { byPriority, completionSlices, dailyAdded, completedCount } = useMemo(() => {
    // Aggregate tasks -> priority counts, completion slices, daily activity timeline
    const priorityCount: Record<string, number> = { low: 0, medium: 0, high: 0 };
    const completion = { Completed: 0, Active: 0 };
    const dailyMap = new Map<string, { date: string; added: number; completed: number }>();
    const nowISO = new Date().toISOString();

    tasks.forEach(t => {
      try {
        // Defensive: if legacy tasks missing fields, patch them locally (does not mutate source array)
        const priority = (t as any).priority ?? 'medium';
        if (!(priority in priorityCount)) priorityCount[priority] = 0; // unexpected priority
        priorityCount[priority]++;
        if (t.completed) completion.Completed++; else completion.Active++;

        const created = (t as any).createdAt && typeof t.createdAt === 'string' ? t.createdAt : nowISO;
        const updated = (t as any).updatedAt && typeof t.updatedAt === 'string' ? t.updatedAt : created;
        const day = created.slice(0, 10);
        if (!dailyMap.has(day)) dailyMap.set(day, { date: day, added: 0, completed: 0 });
        dailyMap.get(day)!.added++;
        if (t.completed) {
          const compDay = updated.slice(0, 10);
          if (!dailyMap.has(compDay)) dailyMap.set(compDay, { date: compDay, added: 0, completed: 0 });
          dailyMap.get(compDay)!.completed++;
        }
      } catch (err) {
        if (import.meta?.env?.DEV) {
          // eslint-disable-next-line no-console
            console.warn('TaskCharts aggregation skipped a task due to error', err, t);
        }
      }
    });

    const byPriority = Object.entries(priorityCount).map(([name, value]) => ({ name, value }));
    const completionSlices = Object.entries(completion).map(([name, value]) => ({ name, value }));
    const dailyAdded = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, label: formatDateDay(d.date) }));

    return { byPriority, completionSlices, dailyAdded, completedCount: completion.Completed };
  }, [tasks]);

  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return <div className="card" style={{ textAlign: 'center', fontSize: '.75rem' }}>Add tasks to see charts.</div>;
  }

  // If all derived arrays are empty (should not happen unless data invalid) show placeholder
  if (!byPriority.length && !completionSlices.length) {
    return <div className="card" style={{ textAlign: 'center', fontSize: '.65rem', color:'var(--text-muted)' }}>No chartable data yet.</div>;
  }

  const completionPct = completedCount === 0 ? 0 : (completedCount / totalTasks) * 100;
  const daysSpan = Math.max(1, new Set(dailyAdded.map(d => d.date)).size);
  const avgPerDay = totalTasks / daysSpan;
  const highCount = byPriority.find(p => p.name === 'high')?.value || 0;
  const highShare = totalTasks ? (highCount / totalTasks) * 100 : 0;

  return (
    <div className="card ff-stack" style={{ gap: '1rem', width: '100%' }}>
      <div style={{display:'flex', flexWrap:'wrap', alignItems:'center', gap:'1rem', justifyContent:'space-between'}}>
        <h2 style={{ fontSize: '.8rem', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)', margin:0 }}>Visual Overview</h2>
        <div style={{display:'flex', gap:'1.25rem', flexWrap:'wrap'}}>
          <Metric label="Tasks" value={totalTasks} />
          <Metric label="Done" value={completedCount} sub={`${completionPct.toFixed(0)}%`} accent />
          <Metric label="Avg/Day" value={avgPerDay.toFixed(1)} />
          <Metric label="High %" value={highCount} sub={`${highShare.toFixed(0)}%`} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        {/* Completion Donut */}
        <div className="ff-stack" style={{ gap: '.5rem', position:'relative' }}>
          <span style={{ fontSize: '.6rem', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Completion</span>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie data={completionSlices} dataKey="value" nameKey="name" innerRadius={45} outerRadius={65} paddingAngle={3} stroke="none">
                {completionSlices.map((entry) => (
                  <Cell key={entry.name} fill={entry.name === 'Completed' ? 'var(--success)' : 'var(--accent-accent3)'} />
                ))}
              </Pie>
              <RTooltip contentStyle={{ fontSize: '0.65rem', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'.85rem', fontWeight:600}}>{completionPct.toFixed(0)}%</div>
              <div style={{fontSize:'.55rem', color:'var(--text-muted)'}}>Done</div>
            </div>
          </div>
        </div>
        {/* Priority Bar */}
        <div className="ff-stack" style={{ gap: '.5rem' }}>
          <span style={{ fontSize: '.6rem', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>By Priority</span>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={byPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={11} width={26} />
              <RTooltip contentStyle={{ fontSize: '0.65rem', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {byPriority.map((p) => (
                  <Cell key={p.name} fill={PRIORITY_COLOR[p.name]} />
                ))}
                <LabelList dataKey="value" position="top" style={{fontSize:10, fill:'var(--text)'}} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <InlineLegend items={byPriority.map(p => ({ label: p.name, color: PRIORITY_COLOR[p.name] }))} />
        </div>
        {/* Daily Trend */}
        <div className="ff-stack" style={{ gap: '.5rem' }}>
          <span style={{ fontSize: '.6rem', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Daily Trend</span>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={dailyAdded}>
              <defs>
                <linearGradient id="areaAdded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="areaCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={11} width={26} />
              <RTooltip contentStyle={{ fontSize: '0.65rem', borderRadius: 8 }} />
              <Area type="monotone" dataKey="added" stroke="var(--accent)" strokeWidth={2} fill="url(#areaAdded)" name="Added" />
              <Area type="monotone" dataKey="completed" stroke="var(--success)" strokeWidth={2} fill="url(#areaCompleted)" name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- Small presentational helpers ---

interface MetricProps { label: string; value: number | string; sub?: string; accent?: boolean }
const Metric: React.FC<MetricProps> = ({ label, value, sub, accent }) => (
  <div className="ff-stack" style={{gap:'.15rem', minWidth:'3.5rem'}}>
    <div style={{fontSize:'.6rem', letterSpacing:'.06em', textTransform:'uppercase', color:'var(--text-muted)'}}>{label}</div>
    <div style={{fontSize:'.8rem', fontWeight:600, color: accent ? 'var(--success)' : 'var(--text)'}}>{value}</div>
    {sub && <div style={{fontSize:'.55rem', color:'var(--text-muted)'}}>{sub}</div>}
  </div>
);

const InlineLegend: React.FC<{items:{label:string;color:string}[]}> = ({ items }) => (
  <div style={{display:'flex', flexWrap:'wrap', gap:'.5rem'}}>
    {items.map(i => (
      <div key={i.label} style={{display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.55rem', color:'var(--text-muted)'}}>
        <span style={{width:10,height:10,borderRadius:3, background:i.color, display:'inline-block'}} />
        {i.label}
      </div>
    ))}
  </div>
);
