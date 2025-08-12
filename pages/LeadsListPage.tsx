import React, { useMemo } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types';

// Componente para una fila de la tabla
const LeadRow: React.FC<{ lead: Lead }> = ({ lead }) => {
    const { getUserById, getStageById } = useLeads();

    const sellerName = getUserById(lead.ownerId)?.name || 'No asignado';
    const stage = getStageById(lead.status);
    const stageName = stage?.name || 'Desconocido';
    
    // Obtenemos la fecha de la última modificación del historial
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

// Componente principal de la página
const LeadsListPage: React.FC = () => {
    const { allLeads } = useLeads();
    const { user } = useAuth();

    // Filtramos los prospectos visibles según el rol del usuario
    const visibleLeads = useMemo(() => {
        if (!user) return [];
        if (user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor) {
            return allLeads; // Admin y Supervisor ven todos los prospectos
        }
        // Los vendedores solo ven los suyos
        return allLeads.filter(lead => lead.ownerId === user.id);
    }, [allLeads, user]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Listado de Prospectos</h3>
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
