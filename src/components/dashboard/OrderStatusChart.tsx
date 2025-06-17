// src/components/dashboard/OrderStatusChart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface OrderStatusChartProps {
  data: { name: string, count: number }[];
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay datos suficientes para mostrar el gráfico.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={50}/>
        <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Cantidad" />
      </BarChart>
    </ResponsiveContainer>
  );
}
