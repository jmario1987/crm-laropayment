import React, { useState, useMemo } from 'react';
import { useLeads } from '../../hooks/useLeads';
import StatCard from './StatCard';
import LeadsByStageChart from './LeadsByStageChart';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../types';

const Dashboard: React.FC = () => {
  const { allLeads, sellers, wonStageIds, lostStageIds } = useLeads();
  const { user } = useAuth();
  const [selectedSellerId, setSelectedSellerId] = useState('all');

  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSellerId(e.target.value);
  };

  const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;
  const isAdmin = user?.role === USER_ROLES.Admin;

  const visibleLeads = useMemo(() => {
    if (isManager) return allLeads;
    return allLeads.filter(lead => lead.ownerId === user?.id || lead.creatorId === user?.id);
  }, [allLeads, user, isManager]);

  const filteredLeadsForStats = useMemo(() => {
    if (!isManager || selectedSellerId === 'all') {
        return visibleLeads;
    }
    return visibleLeads.filter(lead => lead.ownerId === selectedSellerId);
  }, [visibleLeads, selectedSellerId, isManager]);

  const wonLeads = useMemo(() => filteredLeadsForStats.filter(l => wonStageIds.includes(l.status)).length, [filteredLeadsForStats, wonStageIds]);
  const lostLeads = useMemo(() => filteredLeadsForStats.filter(l => lostStageIds.includes(l.status)).length, [filteredLeadsForStats, lostStageIds]);
  const activeLeads = filteredLeadsForStats.length - wonLeads - lostLeads;
  const conversionRate = (wonLeads + lostLeads) > 0 ? ((wonLeads / (wonLeads + lostLeads)) * 100) : 0;

  const currentMonthYear = useMemo(() => {
      const date = new Date();
      return `${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  }, []);

  // --- LÓGICA NUEVA: BUSCAMOS EL ÚLTIMO MES QUE TIENE DATOS ---
  const lastLoadedMonth = useMemo(() => {
      if (!isAdmin) return null;
      let latestMonth = '';
      let latestDate = new Date(2000, 0, 1);

      filteredLeadsForStats.forEach(lead => {
          if (lead.billingHistory) {
              Object.keys(lead.billingHistory).forEach(monthStr => {
                  if (lead.billingHistory && lead.billingHistory[monthStr]) {
                      const parts = monthStr.split('-');
                      if (parts.length === 2) {
                          const m = parseInt(parts[0], 10);
                          const y = parseInt(parts[1], 10);
                          const dateObj = new Date(y, m - 1, 1);
                          if (dateObj > latestDate) {
                              latestDate = dateObj;
                              latestMonth = monthStr;
                          }
                      }
                  }
              });
          }
      });
      return latestMonth || currentMonthYear; // Si no hay nada, muestra el actual en 0
  }, [filteredLeadsForStats, isAdmin, currentMonthYear]);

  const financialStats = useMemo(() => {
      if (!isAdmin) return { facturacion: { crc: 0, usd: 0 }, gananciaLaro: { crc: 0, usd: 0 } };

      let totalMontoCRC = 0;
      let totalMontoUSD = 0;
      let totalComisionCRC = 0;
      let totalComisionUSD = 0;

      filteredLeadsForStats.forEach(lead => {
          // AHORA CALCULAMOS CON EL ÚLTIMO MES ENCONTRADO EN LUGAR DEL ACTUAL
          const isBilledThisMonth = lastLoadedMonth ? lead.billingHistory?.[lastLoadedMonth] === true : false;
          const monthData = lastLoadedMonth ? lead.billingAmounts?.[lastLoadedMonth] : null;
          
          if (monthData && isBilledThisMonth) {
              totalMontoCRC += (monthData.montoCRC || 0);
              totalMontoUSD += (monthData.montoUSD || 0);
              totalComisionCRC += (monthData.comisionCRC || 0);
              totalComisionUSD += (monthData.comisionUSD || 0);
          }
      });

      return {
          facturacion: { crc: totalMontoCRC, usd: totalMontoUSD },
          gananciaLaro: { crc: totalComisionCRC * 0.42, usd: totalComisionUSD * 0.42 }
      };
  }, [filteredLeadsForStats, lastLoadedMonth, isAdmin]);

  const recentWonLeads = useMemo(() => {
    return filteredLeadsForStats
        .filter(lead => wonStageIds.includes(lead.status))
        .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
        .slice(0, 5); 
  }, [filteredLeadsForStats, wonStageIds]);

  const getDashboardTitle = () => {
    if (!isManager) return "Mi Dashboard";
    if (selectedSellerId === 'all') return "Dashboard de Equipo";
    const seller = sellers.find(s => s.id === selectedSellerId);
    return seller ? `Dashboard de ${seller.name}` : "Dashboard de Equipo";
  };
  
  const title = getDashboardTitle();

  const formatMoney = (amount: number, currency: 'CRC' | 'USD') => {
      if (amount === 0) return null;
      return new Intl.NumberFormat(currency === 'CRC' ? 'es-CR' : 'en-US', { 
          style: 'currency', 
          currency: currency, 
          maximumFractionDigits: currency === 'CRC' ? 0 : 2 
      }).format(amount);
  };

  const MoneyDisplay = ({ crc, usd, label }: { crc: number, usd: number, label: string }) => {
      if (crc === 0 && usd === 0) return <span className="text-gray-400 text-lg">₡0</span>;
      return (
          <div className="flex flex-col">
              {crc > 0 && <span className="text-gray-800 dark:text-gray-200">{formatMoney(crc, 'CRC')}</span>}
              {usd > 0 && <span className="text-blue-600 dark:text-blue-400 text-[0.85em] mt-0.5">{formatMoney(usd, 'USD')}</span>}
              <span className="text-[10px] text-gray-400 font-normal mt-1 uppercase tracking-wider">{label}</span>
          </div>
      );
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
            {isManager && (
                <div className="w-full sm:w-64">
                    <select
                        id="seller-filter"
                        value={selectedSellerId}
                        onChange={handleSellerChange}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="all">Todos los vendedores</option>
                        {sellers.map((seller) => (
                        <option key={seller.id} value={seller.id}>{seller.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
        
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`}>
        <StatCard title="Prospectos Activos" value={activeLeads.toString()} icon="users" />
        <StatCard title="Tasa de Cierre" value={`${conversionRate.toFixed(1)}%`} icon="trophy" />
        
        {isAdmin && (
            <>
                <StatCard 
                    title={`Facturación (${lastLoadedMonth})`} 
                    value={<MoneyDisplay crc={financialStats.facturacion.crc} usd={financialStats.facturacion.usd} label={`Total mensual`} />} 
                    icon="trendingUp" 
                />
                <StatCard 
                    title="Comisiones Generadas" 
                    value={<MoneyDisplay crc={financialStats.gananciaLaro.crc} usd={financialStats.gananciaLaro.usd} label={`Mes: ${lastLoadedMonth}`} />} 
                    icon="star" 
                />
            </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Prospectos por Etapa</h3>
            <div className="h-80">
                <LeadsByStageChart leads={filteredLeadsForStats} />
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <span className="text-yellow-500">🏆</span> Últimos Cierres
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {recentWonLeads.length > 0 ? (
                    recentWonLeads.map(lead => (
                        <div key={lead.id} className="border-l-4 border-green-500 pl-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-r-md transition hover:bg-gray-100 dark:hover:bg-gray-700">
                            <p className="font-semibold text-gray-800 dark:text-white truncate" title={lead.name}>{lead.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={lead.company}>{lead.company}</p>
                            <p className="text-[10px] text-gray-400 mt-1 font-mono">
                                {new Date(lead.lastUpdate).toLocaleDateString('es-CR')}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center mt-10">
                        <span className="text-4xl mb-2 opacity-20">📭</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay cierres recientes aún.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;