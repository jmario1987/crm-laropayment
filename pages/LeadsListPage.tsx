import React, { useMemo, useState } from 'react'; // 1. Importamos useState
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types';

// Componente para una fila de la tabla (no cambia)
const LeadRow: React.FC<{ lead: Lead }> = ({ lead }) => {
    const { getUserById, getStageById } = useLeads();

    const sellerName = getUserById(lead.ownerId)?.name || 'No asignado';
    const stage = getStageById(lead.status);
    const stageName = stage?.name || 'Desconocido';
    
    const lastModification = useMemo(() => {
        if (lead.statusHistory && lead.statusHistory.length > 0) {
            const lastEntry = lead.statusHistory[lead.statusHistory.length - 1];
            return new Date(lastEntry.date).toLocaleString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        return new Date(lead.createdAt).toLocaleString('es-ES');
    }, [lead.statusHistory, lead.createdAt]);

    return (
        <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.company}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sellerName}</td>
            <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-bold rounded-full text-white" style={{ backgroundColor: stage?.color || '#cccccc' }}>
                    {stageName}
                </span>
            </td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lastModification}</td>
        </tr>
    );
};

// Componente principal de la página (con la nueva lógica de filtro)
const LeadsListPage: React.FC = () => {
    const { allLeads, sellers } = useLeads(); // 2. Obtenemos la lista de vendedores
    const { user } = useAuth();
    const [selectedSellerId, setSelectedSellerId] = useState('all'); // 3. Estado para el filtro

    const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

    const visibleLeads = useMemo(() => {
        let leadsToDisplay = allLeads;
        // Filtro por rol
        if (!isManager) {
            leadsToDisplay = allLeads.filter(lead => lead.ownerId === user?.id);
        }
        // Filtro por vendedor seleccionado
        if (isManager && selectedSellerId !== 'all') {
            leadsToDisplay = leadsToDisplay.filter(lead => lead.ownerId === selectedSellerId);
        }
        return leadsToDisplay;
    }, [allLeads, user, isManager, selectedSellerId]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Listado de Prospectos</h3>
                {/* 4. Añadimos el dropdown del filtro */}
                {isManager && (
                    <div className="w-full sm:w-64">
                        <select
                            id="seller-filter"
                            value={selectedSellerId}
                            onChange={(e) => setSelectedSellerId(e.target.value)}
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
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Prospecto</th>
                            <th scope="col" className="px-6 py-3">Empresa</th>
                            <th scope="col" className="px-6 py-3">Vendedor Asignado</th>
                            <th scope="col" className="px-6 py-3">Etapa Actual</th>
                            <th scope="col" className="px-6 py-3">Última Modificación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleLeads.map(lead => <LeadRow key={lead.id} lead={lead} />)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadsListPage;
