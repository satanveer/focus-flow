// TaskCharts: visual summaries (pie, bar, area) of task data.
// Keeps transformations memoized to avoid re-renders unless tasks array changes.
// If dataset grows large you could virtualize or bucket by week.
import React, { useMemo, useEffect, useState } from 'react';
import { useAppwriteTasksContext } from '../AppwriteTasksContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const CHART_HEIGHT = 160; // unified height for grid charts

const CHART_BLOCK_STYLE: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '.55rem',
  padding: '.65rem .75rem .75rem',
  background: 'var(--surface-elev)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)'
};

function formatDateDay(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const TaskCharts: React.FC = () => {
  const { tasks } = useAppwriteTasksContext();
  const [isMobile, setIsMobile] = useState(false);
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  
  useEffect(()=> {
    const mq = window.matchMedia('(max-width: 780px)');
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const { byPriority, completionSlices, dailyAdded, completedCount, focusMinutesByPriority, totalFocusMinutes, tagUsage, dueStatusSlices } = useMemo(() => {
    const priorityCount: Record<string, number> = { low: 0, medium: 0, high: 0 };
    const completion = { Completed: 0, Active: 0 };
    const dailyMap = new Map<string, { date: string; added: number; completed: number }>();
    const focusPriorityMinutes: Record<string, number> = { low: 0, medium: 0, high: 0 };
    const tagCount = new Map<string, number>();
    const dueBuckets: Record<string, number> = { Overdue: 0, Today: 0, Upcoming: 0, Later: 0, None: 0 };
    const nowISO = new Date().toISOString();
    const today = new Date(); today.setHours(0,0,0,0);
    const in7 = new Date(today.getTime() + 7*24*60*60*1000);

    tasks.forEach(t => {
      try {
        const priority = (t as any).priority ?? 'medium';
        if (!(priority in priorityCount)) priorityCount[priority] = 0;
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
        if (Array.isArray((t as any).tags)) {
          (t as any).tags.forEach((tag: string) => {
            if (!tag) return; const prev = tagCount.get(tag) || 0; tagCount.set(tag, prev + 1);
          });
        }
        if (t.dueDate) {
          try {
            const due = new Date(t.dueDate); due.setHours(0,0,0,0);
            if (due < today) dueBuckets.Overdue++; else if (due.getTime() === today.getTime()) dueBuckets.Today++; else if (due <= in7) dueBuckets.Upcoming++; else dueBuckets.Later++;
          } catch { dueBuckets.None++; }
        } else {
          dueBuckets.None++;
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

    // Focus minutes: (left placeholder aggregation removed since sessions not injected here after simplification) -> Keep future extension ready
    // We'll just compute from tagged tasks later if sessions context is reintroduced.
    const focusMinutesByPriority = Object.entries(focusPriorityMinutes).map(([name, minutes]) => ({ name, minutes: Math.round(minutes) }));
    const totalFocusMinutes = focusMinutesByPriority.reduce((a, b) => a + b.minutes, 0);
    const tagUsage = Array.from(tagCount.entries()).map(([tag, count]) => ({ tag, count }))
      .sort((a,b)=> b.count - a.count).slice(0,10);
    const dueStatusSlices = Object.entries(dueBuckets).map(([name, value]) => ({ name, value }));

    return { byPriority, completionSlices, dailyAdded, completedCount: completion.Completed, focusMinutesByPriority, totalFocusMinutes, tagUsage, dueStatusSlices };
  }, [tasks]);

  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return <div className="card" style={{ textAlign: 'center', fontSize: '.75rem' }}>Add tasks to see charts.</div>;
  }

  // If all derived arrays are empty (should not happen unless data invalid) show placeholder
  if (!completionSlices.length) {
    return <div className="card" style={{ textAlign: 'center', fontSize: '.65rem', color:'var(--text-muted)' }}>No chartable data yet.</div>;
  }

  const completionPct = completedCount === 0 ? 0 : (completedCount / totalTasks) * 100;
  const daysSpan = Math.max(1, new Set(dailyAdded.map(d => d.date)).size);
  const avgPerDay = totalTasks / daysSpan;
  const highCount = byPriority.find(p => p.name === 'high')?.value || 0;
  const highShare = totalTasks ? (highCount / totalTasks) * 100 : 0;

  // Build available charts array
  const charts: Array<{id: string; title: string; chart: React.ReactElement}> = [
    {
      id: 'completion',
      title: 'Completion',
      chart: (
        <div className="ff-stack" style={{...CHART_BLOCK_STYLE, padding: isMobile? '.9rem 1rem 1.1rem': CHART_BLOCK_STYLE.padding}} role="figure" aria-label="Task completion breakdown doughnut chart">
          <ResponsiveContainer width="100%" height={isMobile? 220: CHART_HEIGHT}>
            <PieChart>
              <Pie data={completionSlices} dataKey="value" nameKey="name" innerRadius={isMobile? 70:45} outerRadius={isMobile? 100:65} paddingAngle={3} stroke="none">
                {completionSlices.map((entry) => (
                  <Cell key={entry.name} fill={entry.name === 'Completed' ? 'var(--success)' : 'var(--accent-accent3)'} />
                ))}
              </Pie>
              <RTooltip contentStyle={{ fontSize: '0.65rem', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{position:'absolute', inset:isMobile? '.9rem 1rem 1.1rem':'.65rem .75rem .75rem', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:isMobile? '1.25rem':'.85rem', fontWeight:600}}>{completionPct.toFixed(0)}%</div>
              <div style={{fontSize:'.55rem', color:'var(--text-muted)'}}>Done</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'priority',
      title: 'By Priority',
      chart: (
        <div className="ff-stack" style={CHART_BLOCK_STYLE} role="figure" aria-label="Tasks count grouped by priority bar chart">
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
      )
    },
    {
      id: 'daily',
      title: 'Daily Trend',
      chart: (
        <div className="ff-stack" style={CHART_BLOCK_STYLE} role="figure" aria-label="Daily tasks added and completed area chart">
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
      )
    },
    {
      id: 'due',
      title: 'Due Status',
      chart: (
        <div className="ff-stack" style={CHART_BLOCK_STYLE} role="figure" aria-label="Due status distribution doughnut chart">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie data={dueStatusSlices} dataKey="value" nameKey="name" innerRadius={40} outerRadius={62} paddingAngle={2} stroke="none">
                {dueStatusSlices.map(s => {
                  let fill = 'var(--border)';
                  if (s.name === 'Overdue') fill = 'var(--danger)';
                  else if (s.name === 'Today') fill = 'var(--warning)';
                  else if (s.name === 'Upcoming') fill = 'var(--accent)';
                  else if (s.name === 'Later') fill = 'var(--info)';
                  else if (s.name === 'None') fill = 'var(--text-muted)';
                  return <Cell key={s.name} fill={fill} />;
                })}
              </Pie>
              <RTooltip contentStyle={{ fontSize: '0.65rem', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{position:'absolute', inset:'.65rem .75rem .75rem', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'.75rem', fontWeight:600}}>Due</div>
              <div style={{fontSize:'.55rem', color:'var(--text-muted)'}}>All Tasks</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Add optional charts
  if (focusMinutesByPriority.some(f=> f.minutes>0)) {
    charts.push({
      id: 'focus',
      title: 'Focus Minutes',
      chart: (
        <div className="ff-stack" style={CHART_BLOCK_STYLE} role="figure" aria-label="Focus minutes by task priority bar chart">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={focusMinutesByPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={11} width={34} />
              <RTooltip contentStyle={{ fontSize: '0.65rem', borderRadius: 8 }} />
              <Bar dataKey="minutes" radius={[6,6,0,0]}>
                {focusMinutesByPriority.map(p => <Cell key={p.name} fill={PRIORITY_COLOR[p.name]} />)}
                <LabelList dataKey="minutes" position="top" style={{fontSize:10, fill:'var(--text)'}} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
    });
  }

  if (tagUsage.length > 0) {
    charts.push({
      id: 'tags',
      title: 'Top Tags',
      chart: (
        <div className="ff-stack" style={CHART_BLOCK_STYLE} role="figure" aria-label="Top tags by number of tasks horizontal bar chart">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={tagUsage} layout="vertical" margin={{left:12, right:8, top:4, bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} hide />
              <YAxis type="category" dataKey="tag" stroke="var(--text-muted)" fontSize={10} width={70} />
              <RTooltip contentStyle={{ fontSize: '0.65rem', borderRadius: 8 }} />
              <Bar dataKey="count" radius={[0,6,6,0]} fill="var(--accent)">
                <LabelList dataKey="count" position="right" style={{fontSize:10, fill:'var(--text)'}} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
    });
  }

  const handlePrev = () => setCurrentChartIndex(i => (i - 1 + charts.length) % charts.length);
  const handleNext = () => setCurrentChartIndex(i => (i + 1) % charts.length);

  return (
    <div className="card ff-stack" style={{ gap: '1.25rem', width: '100%' }}>
      <div className="ff-stack" style={{ gap: '.75rem' }}>
        <div style={{display:'flex', flexWrap:'wrap', alignItems:'center', gap:'1rem', justifyContent:'space-between'}}>
          <h2 style={{ fontSize: '.8rem', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)', margin:0 }}>Visual Overview</h2>
          <div style={{display:'flex', gap:'1.25rem', flexWrap:'wrap'}}>
            <Metric label="Tasks" value={totalTasks} />
            <Metric label="Done" value={completedCount} sub={`${completionPct.toFixed(0)}%`} accent />
            {!isMobile && <Metric label="Avg/Day" value={avgPerDay.toFixed(1)} />}
            {!isMobile && <Metric label="High %" value={highCount} sub={`${highShare.toFixed(0)}%`} />}
            {!isMobile && totalFocusMinutes > 0 && <Metric label="Focus Min" value={totalFocusMinutes} />}
          </div>
        </div>
        <div style={{height:1, background:'var(--border)', opacity:.65, borderRadius:2}} />
      </div>

      {/* Carousel Container */}
      <div style={{position:'relative', width:'100%', padding: isMobile ? '0 2.5rem' : '0 3rem'}}>
        {/* Chart Title */}
        <div style={{textAlign:'center', marginBottom:'1rem'}}>
          <span style={{ fontSize: '.6rem', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {charts[currentChartIndex].title}
          </span>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="btn subtle"
          style={{
            position:'absolute',
            left: '0',
            top:'50%',
            transform:'translateY(-50%)',
            padding: isMobile ? '.5rem' : '.6rem',
            zIndex:10,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            borderRadius:'50%',
            width: isMobile ? '2.25rem' : '2.75rem',
            height: isMobile ? '2.25rem' : '2.75rem',
            backgroundColor: 'var(--accent)',
            border: '2px solid var(--accent)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          aria-label="Previous chart"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          }}
        >
          <ChevronLeft className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} style={{strokeWidth: 2.5}} />
        </button>

        <button
          onClick={handleNext}
          className="btn subtle"
          style={{
            position:'absolute',
            right: '0',
            top:'50%',
            transform:'translateY(-50%)',
            padding: isMobile ? '.5rem' : '.6rem',
            zIndex:10,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            borderRadius:'50%',
            width: isMobile ? '2.25rem' : '2.75rem',
            height: isMobile ? '2.25rem' : '2.75rem',
            backgroundColor: 'var(--accent)',
            border: '2px solid var(--accent)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          aria-label="Next chart"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          }}
        >
          <ChevronRight className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} style={{strokeWidth: 2.5}} />
        </button>

        {/* Current Chart */}
        <div style={{width:'100%', minHeight: isMobile ? '280px' : '220px'}}>
          {charts[currentChartIndex].chart}
        </div>

        {/* Carousel Dots */}
        <div style={{display:'flex', justifyContent:'center', gap:'.5rem', marginTop:'1rem', alignItems:'center'}}>
          {charts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentChartIndex(idx)}
              style={{
                width: currentChartIndex === idx ? '1.75rem' : '.6rem',
                height: '.6rem',
                borderRadius: '1rem',
                background: currentChartIndex === idx ? 'var(--accent)' : 'var(--border)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
                opacity: currentChartIndex === idx ? 1 : 0.6,
                boxShadow: currentChartIndex === idx ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
              }}
              aria-label={`Go to ${charts[idx].title} chart`}
              aria-current={currentChartIndex === idx}
              onMouseEnter={(e) => {
                if (currentChartIndex !== idx) {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.transform = 'scale(1.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentChartIndex !== idx) {
                  e.currentTarget.style.opacity = '0.6';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            />
          ))}
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
