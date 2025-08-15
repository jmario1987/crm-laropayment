import React, { useMemo, useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types';
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';

// Componente para una fila de la tabla (con la nueva columna)
const WonLeadRow: React.FC<{ lead: Lead; sellerName?: string }> = ({ lead, sellerName }) => {
    
    const closingDate = useMemo(() => {
        if (lead.statusHistory && lead.statusHistory.length > 0) {
            const lastEntry = lead.statusHistory[lead.statusHistory.length - 1];
            return new Date(lastEntry.date).toLocaleDateString('es-ES');
        }
        return new Date(lead.createdAt).toLocaleDateString('es-ES');
    }, [lead.statusHistory, lead.createdAt]);

    // --- NUEVA LÓGICA PARA CALCULAR LA DURACIÓN ---
    const processDuration = useMemo(() => {
        const startDate = new Date(lead.createdAt);
        const lastEntry = lead.statusHistory && lead.statusHistory.length > 0
            ? lead.statusHistory[lead.statusHistory.length - 1]
            : { date: lead.createdAt };
        const endDate = new Date(lastEntry.date);
        const timeDiff = endDate.getTime() - startDate.getTime();
        const days = Math.floor(timeDiff / (1000 * 3600 * 24));
        return days;
    }, [lead.createdAt, lead.statusHistory]);

    return (
        <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.company}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sellerName || 'N/A'}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{closingDate}</td>
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200 text-center">{processDuration}</td>
        </tr>
    );
};

// Componente principal de la página (con el nuevo filtro)
const WonLeadsPage: React.FC = () => {
    const { allLeads, stages, getUserById, providers, getProviderById } = useLeads();
    const { user } = useAuth();
    const [selectedProviderId, setSelectedProviderId] = useState('all'); // Estado para el nuevo filtro

    const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

    const wonLeads = useMemo(() => {
        const wonStageIds = stages.filter(s => s.type === 'won').map(s => s.id);
        let allWonLeads = allLeads.filter(lead => wonStageIds.includes(lead.status));

        if (!user) return [];
        
        // Filtro por proveedor (solo para managers)
        if (isManager && selectedProviderId !== 'all') {
            allWonLeads = allWonLeads.filter(lead => lead.providerId === selectedProviderId);
        }

        // Filtro por rol
        if (isManager) {
            return allWonLeads;
        }
        return allWonLeads.filter(lead => lead.ownerId === user.id);

    }, [allLeads, stages, user, selectedProviderId]); // Se añade la nueva dependencia
    
    const handleExportExcel = () => {
        const dataToExport = wonLeads.map(lead => {
            const lastEntry = lead.statusHistory && lead.statusHistory.length > 0 
                ? lead.statusHistory[lead.statusHistory.length - 1] 
                : { date: lead.createdAt };
            
            const startDate = new Date(lead.createdAt);
            const endDate = new Date(lastEntry.date);
            const timeDiff = endDate.getTime() - startDate.getTime();
            const processDuration = Math.floor(timeDiff / (1000 * 3600 * 24));

            return {
                'Nombre': lead.name,
                'Empresa': lead.company,
                'Vendedor': getUserById(lead.ownerId)?.name || 'N/A',
                'Fecha de Cierre': new Date(lastEntry.date).toLocaleDateString('es-ES'),
                'Duración del Proceso (días)': processDuration,
                'Referido por': getProviderById(lead.providerId || '')?.name || 'N/A',
                'Email': lead.email,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Prospectos Ganados");
        XLSX.writeFile(workbook, "Reporte_Prospectos_Ganados.xlsx");
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Prospectos Ganados</h3>
                    <div className="flex flex-wrap sm:flex-nowrap gap-4">
                        {isManager && (
                            <div className="w-full sm:w-56">
                                <select
                                    id="provider-filter"
                                    value={selectedProviderId}
                                    onChange={(e) => setSelectedProviderId(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="all">Todos los Proveedores</option>
                                    {providers.map((provider) => (
                                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <Button onClick={handleExportExcel}>
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Exportar a Excel
                        </Button>
                    </div>
                </div>
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Empresa</th>
                                <th scope="col" className="px-6 py-3">Vendedor</th>
                                <th scope="col" className="px-6 py-3">Fecha de Cierre</th>
                                <th scope="col" className="px-6 py-3 text-center">Duración del Proceso (días)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wonLeads.map(lead => {
                                const seller = getUserById(lead.ownerId);
                                return <WonLeadRow key={lead.id} lead={lead} sellerName={seller?.name} />;
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WonLeadsPage;
