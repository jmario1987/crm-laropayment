import React, { useMemo, useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types';
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';

// Componente para una fila de la tabla (con las nuevas columnas)
const LeadRow: React.FC<{ lead: Lead }> = ({ lead }) => {
    const { getUserById, getStageById } = useLeads();

    const sellerName = getUserById(lead.ownerId)?.name || 'No asignado';
    const stage = getStageById(lead.status);
    const stageName = stage?.name || 'Desconocido';
    
    // --- NUEVA LÓGICA DE FECHAS ---
    const creationDate = useMemo(() => {
        return new Date(lead.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }, [lead.createdAt]);

    const lastModification = useMemo(() => {
        const referenceDate = lead.lastUpdate || lead.createdAt;
        return new Date(referenceDate).toLocaleString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }, [lead.lastUpdate, lead.createdAt]);

    const daysInProcess = useMemo(() => {
        const startDate = new Date(lead.createdAt);
        const endDate = new Date(lead.lastUpdate || lead.createdAt);
        const timeDiff = endDate.getTime() - startDate.getTime();
        const days = Math.floor(timeDiff / (1000 * 3600 * 24));
        return days;
    }, [lead.createdAt, lead.lastUpdate]);

    return (
        <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sellerName}</td>
            <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-bold rounded-full text-white" style={{ backgroundColor: stage?.color || '#cccccc' }}>
                    {stageName}
                </span>
            </td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{creationDate}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lastModification}</td>
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200 text-center">{daysInProcess}</td>
        </tr>
    );
};

// Componente principal de la página (con la tabla y exportación actualizadas)
const LeadsListPage: React.FC = () => {
    const { allLeads, sellers, providers, getStageById, getUserById, getProviderById } = useLeads();
    const { user } = useAuth();
    const [selectedSellerId, setSelectedSellerId] = useState('all');
    const [selectedProviderId, setSelectedProviderId] = useState('all');

    const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

    const visibleLeads = useMemo(() => {
        let leadsToDisplay = allLeads;
        
        if (!isManager) {
            leadsToDisplay = allLeads.filter(lead => lead.ownerId === user?.id);
        }
        
        if (isManager && selectedSellerId !== 'all') {
            leadsToDisplay = leadsToDisplay.filter(lead => lead.ownerId === selectedSellerId);
        }

        if (isManager && selectedProviderId !== 'all') {
            leadsToDisplay = leadsToDisplay.filter(lead => lead.providerId === selectedProviderId);
        }
        
        return leadsToDisplay.sort((a, b) => 
            new Date(b.lastUpdate || b.createdAt).getTime() - new Date(a.lastUpdate || a.createdAt).getTime()
        );

    }, [allLeads, user, isManager, selectedSellerId, selectedProviderId]);

    const handleExportExcel = () => {
        const dataToExport = visibleLeads.map(lead => {
            const startDate = new Date(lead.createdAt);
            const endDate = new Date(lead.lastUpdate || lead.createdAt);
            const timeDiff = endDate.getTime() - startDate.getTime();
            const daysInProcess = Math.floor(timeDiff / (1000 * 3600 * 24));

            return {
                "Prospecto": lead.name,
                "Empresa": lead.company,
                "Etapa": getStageById(lead.status)?.name || 'N/A',
                "Vendedor Asignado": getUserById(lead.ownerId)?.name || 'N/A',
                "Fecha de Ingreso": new Date(lead.createdAt).toLocaleDateString('es-ES'),
                "Última Modificación": new Date(lead.lastUpdate || lead.createdAt).toLocaleDateString('es-ES'),
                "Días en Proceso": daysInProcess,
                "Referido por": getProviderById(lead.providerId || '')?.name || 'N/A',
                "Email": lead.email,
                "Teléfono": lead.phone,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Prospectos");
        XLSX.writeFile(workbook, "Reporte_Prospectos.xlsx");
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Listado de Prospectos</h3>
                
                {isManager && (
                    <div className="flex flex-wrap sm:flex-nowrap gap-4">
                        <Button onClick={handleExportExcel}>
                            Exportar a Excel
                        </Button>
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
                        <div className="w-full sm:w-56">
                            <select
                                id="seller-filter"
                                value={selectedSellerId}
                                onChange={(e) => setSelectedSellerId(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="all">Todos los Vendedores</option>
                                {sellers.map((seller) => (
                                    <option key={seller.id} value={seller.id}>{seller.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Prospecto</th>
                            <th scope="col" className="px-6 py-3">Vendedor Asignado</th>
                            <th scope="col" className="px-6 py-3">Etapa Actual</th>
                            <th scope="col" className="px-6 py-3">Fecha de Ingreso</th>
                            <th scope="col" className="px-6 py-3">Última Modificación</th>
                            <th scope="col" className="px-6 py-3 text-center">Días en Proceso</th>
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
