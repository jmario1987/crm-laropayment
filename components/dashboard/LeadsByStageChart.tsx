
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLeads } from '../../hooks/useLeads';
import { Lead } from '../../types';

interface LeadsByStageChartProps {
  leads: Lead[];
}

const LeadsByStageChart: React.FC<LeadsByStageChartProps> = ({ leads }) => {
  const { stages } = useLeads();

  const data = useMemo(() => {
    const relevantStages = stages
      .sort((a, b) => a.order - b.order);

    return relevantStages.map(stage => ({
      name: stage.name,
      Prospectos: leads.filter(lead => lead.status === stage.id).length,
      fill: stage.color
    }));
  }, [stages, leads]);
  

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
        <XAxis dataKey="name" tick={{ fill: '#a0aec0' }} />
        <YAxis allowDecimals={false} tick={{ fill: '#a0aec0' }} />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(31, 41, 55, 0.8)', 
            borderColor: '#4b5563',
            color: '#ffffff',
            borderRadius: '0.5rem'
          }}
          cursor={{ fill: 'rgba(60, 130, 246, 0.1)' }}
        />
        <Legend wrapperStyle={{ color: '#a0aec0' }} />
        <Bar dataKey="Prospectos" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default LeadsByStageChart;