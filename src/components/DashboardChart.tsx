import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';

interface DashboardChartProps {
  todayHourly: Array<{
    hour: string;
    minutes: number;
    sessions: number;
  }>;
}

export const DashboardChart: React.FC<DashboardChartProps> = React.memo(({ todayHourly }) => {
  return (
    <div style={{width:'100%', height:220}}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={todayHourly} margin={{top:8, right:12, left:4, bottom:4}}>
          <defs>
            <linearGradient id="dashDaily" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="hour" 
            tick={{fontSize:9}} 
            stroke="var(--text-muted)" 
            interval={0}
          />
          <YAxis 
            allowDecimals={false} 
            tick={{fontSize:9}} 
            stroke="var(--text-muted)" 
            width={25}
          />
          <Tooltip
            content={({active, payload, label}) => {
              if(!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div style={{
                  background:'var(--surface)', 
                  border:'1px solid var(--border)', 
                  borderRadius:8, 
                  padding:'.5rem .65rem', 
                  fontSize:'.65rem'
                }}>
                  <div style={{fontWeight:600}}>{label}:00</div>
                  <div>{data.minutes}m • {data.sessions} session{data.sessions!==1?'s':''}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="minutes" fill="url(#dashDaily)" radius={[4,4,0,0]}>
            <LabelList 
              dataKey="minutes" 
              position="top" 
              formatter={(val: any) => (typeof val==='number' && val>0) ? val : ''} 
              style={{fontSize:9, fill:'var(--text-muted)'}} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});