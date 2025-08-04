import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface CircularProgressProps {
  value: number; // 0 to 100
  label: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value, label }) => {
  const data = [{ name: 'score', value: value }];
  const color = value >= 75 ? 'hsl(140, 70%, 55%)' : value >= 40 ? 'hsl(40, 80%, 60%)' : 'hsl(0, 80%, 65%)';

  return (
    <div style={{ width: '100%', height: 250, position: 'relative' }}>
      <ResponsiveContainer>
        <RadialBarChart
          innerRadius="70%"
          outerRadius="85%"
          data={data}
          startAngle={90}
          endAngle={-270}
          barSize={20}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: 'hsla(222, 47%, 22%, 0.5)'}}
            dataKey="value"
            angleAxisId={0}
            fill={color}
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold" style={{ color }}>{`${Math.round(value)}%`}</span>
        <span className="text-lg text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};

export default CircularProgress;