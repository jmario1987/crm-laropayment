
import React, { useState, useMemo } from 'react';
import { useLeads } from '../../hooks/useLeads';
import StatCard from './StatCard';
import LeadsByStageChart from './LeadsByStageChart';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../types';

const Dashboard: React.FC = () => {
  const { leads, sellers, wonStageIds, lostStageIds } = useLeads();
  const { user } = useAuth();
  const [selectedSellerId, setSelectedSellerId] = useState('all');

  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSellerId(e.target.value);
  };

  const showFilter = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

  const filteredLeads = useMemo(() => {
    if (!showFilter || selectedSellerId === 'all') {
        return leads;
    }
    return leads.filter(lead => lead.ownerId === selectedSellerId);
  }, [leads, selectedSellerId, showFilter]);

  const wonLeads = useMemo(() => filteredLeads.filter(l => wonStageIds.includes(l.status)).length, [filteredLeads, wonStageIds]);
  const lostLeads = useMemo(() => filteredLeads.filter(l => lostStageIds.includes(l.status)).length, [filteredLeads, lostStageIds]);
  const activeLeads = filteredLeads.length - wonLeads - lostLeads;
  
  const conversionRate = (wonLeads + lostLeads) > 0 ? ((wonLeads / (wonLeads + lostLeads)) * 100) : 0;

  const getDashboardTitle = () => {
    if (!showFilter) return "Mi Dashboard";
    if (selectedSellerId === 'all') return "Dashboard de Equipo";
    const seller = sellers.find(s => s.id === selectedSellerId);
    return seller ? `Dashboard de ${seller.name}` : "Dashboard de Equipo";
  };
  
  const title = getDashboardTitle();

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
            {showFilter && (
                 <div className="w-full sm:w-64">
                    <label htmlFor="seller-filter" className="sr-only">Filtrar por vendedor</label>
                    <select
                        id="seller-filter"
                        name="seller-filter"
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={selectedSellerId}
                        onChange={handleSellerChange}
                    >
                        <option value="all">Todos los vendedores</option>
                        {sellers.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                            {seller.name}
                        </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Prospectos Activos" value={activeLeads.toString()} icon="users" />
        <StatCard title="Prospectos Ganados" value={wonLeads.toString()} icon="trophy" />
        <StatCard title="Tasa de Conversión" value={`${conversionRate.toFixed(1)}%`} icon="trendingUp" />
        <StatCard title="Prospectos Perdidos" value={lostLeads.toString()} icon="trendingDown" />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Prospectos por Etapa</h3>
        <div className="h-80">
          <LeadsByStageChart leads={filteredLeads} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
