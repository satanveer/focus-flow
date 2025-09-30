import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
  BarChart, Bar, CartesianGrid
} from 'recharts';

interface TrendChartProps {
  data: Array<{
    date: string;
    minutes: number;
    sessions: number;
  }>;
}

export const TrendChart: React.FC<TrendChartProps> = React.memo(({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{top:8, right:12, left:4, bottom:4}}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={{fontSize:9}} stroke="var(--text-muted)" />
        <YAxis tick={{fontSize:9}} stroke="var(--text-muted)" width={25} />
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
                <div style={{fontWeight:600}}>{label}</div>
                <div>{data.minutes}m • {data.sessions} session{data.sessions!==1?'s':''}</div>
              </div>
            );
          }}
        />
        <Line 
          type="monotone" 
          dataKey="minutes" 
          stroke="var(--accent)" 
          strokeWidth={2} 
          dot={{fill:'var(--accent)', strokeWidth:0, r:3}}
          activeDot={{r:4, stroke:'var(--accent)', strokeWidth:2}}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

interface WeeklyChartProps {
  data: Array<{
    day: string;
    minutes: number;
    sessions: number;
  }>;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = React.memo(({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{top:8, right:12, left:4, bottom:4}}>
        <defs>
          <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tick={{fontSize:9}} stroke="var(--text-muted)" />
        <YAxis tick={{fontSize:9}} stroke="var(--text-muted)" width={25} />
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
                <div style={{fontWeight:600}}>{label}</div>
                <div>{data.minutes}m • {data.sessions} session{data.sessions!==1?'s':''}</div>
              </div>
            );
          }}
        />
        <Bar dataKey="minutes" fill="url(#weeklyGrad)" radius={[4,4,0,0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fillOpacity={entry.minutes === 0 ? 0.2 : 1} />
          ))}
          <LabelList 
            dataKey="minutes" 
            position="top" 
            formatter={(val: any) => (typeof val==='number' && val>0) ? val : ''} 
            style={{fontSize:9, fill:'var(--text-muted)'}} 
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});