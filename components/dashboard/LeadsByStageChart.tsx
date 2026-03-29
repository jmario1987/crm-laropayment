import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useLeads } from '../../hooks/useLeads';
import { Lead } from '../../types';

interface LeadsByStageChartProps {
  leads: Lead[];
}

const LeadsByStageChart: React.FC<LeadsByStageChartProps> = ({ leads }) => {
  const { stages } = useLeads();

  const data = useMemo(() => {
    // Filtramos las etapas abiertas y las ganadas para ver el flujo real de ventas
    const relevantStages = stages
      .filter(s => s.type === 'open' || s.type === 'won')
      .sort((a, b) => a.order - b.order);

    return relevantStages.map(stage => ({
      name: stage.name,
      Prospectos: leads.filter(lead => lead.status === stage.id).length,
      fill: stage.color // Usamos tus colores personalizados
    }));
  }, [stages, leads]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      {/* layout="vertical" es el secreto para que las barras se acuesten */}
      <BarChart
        layout="vertical"
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 10, // Damos margen izquierdo para que quepan los nombres de las etapas
          bottom: 10,
        }}
      >
        {/* Líneas de fondo muy suaves, solo verticales */}
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(156, 163, 175, 0.2)" />
        
        {/* Eje X (ahora abajo, muestra los números) */}
        <XAxis 
            type="number" 
            allowDecimals={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
        />
        
        {/* Eje Y (ahora a la izquierda, muestra los nombres de las etapas) */}
        <YAxis 
            dataKey="name" 
            type="category" 
            width={140} // Ancho reservado para que no se corten los nombres
            tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }} 
            axisLine={false}
            tickLine={false}
        />
        
        <Tooltip
          cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
          contentStyle={{ 
            backgroundColor: 'rgba(31, 41, 55, 0.95)', 
            borderColor: 'transparent',
            color: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
          itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
        />
        
        {/* radius da el efecto de bordes redondeados a las puntas de las barras */}
        <Bar dataKey="Prospectos" barSize={28} radius={[0, 6, 6, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill || '#3b82f6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default LeadsByStageChart;