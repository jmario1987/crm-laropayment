import React, { useMemo } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types';
import * as XLSX from 'xlsx'; // 1. Importamos la librería de Excel
import Button from '../components/ui/Button'; // 2. Importamos el componente de botón

// Un componente pequeño para dibujar cada fila de la tabla
const WonLeadRow: React.FC<{ lead: Lead; sellerName?: string }> = ({ lead, sellerName }) => (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.company}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.email}</td>
        {/* 3. Añadimos la celda para el vendedor */}
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sellerName || 'N/A'}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
            {new Date(lead.createdAt).toLocaleDateString('es-ES')}
        </td>
    </tr>
);

// El componente principal de la página
const WonLeadsPage: React.FC = () => {
    const { allLeads, stages, getUserById } = useLeads();
    const { user } = useAuth();

    const wonLeads = useMemo(() => {
        const wonStageIds = stages.filter(s => s.type === 'won').map(s => s.id);
        const allWonLeads = allLeads.filter(lead => wonStageIds.includes(lead.status));

        if (!user) return [];
        if (user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor) {
            return allWonLeads;
        }
        return allWonLeads.filter(lead => lead.ownerId === user.id);

    }, [allLeads, stages, user]);

    // 4. Función para manejar la exportación a Excel
    const handleExportExcel = () => {
        const dataToExport = wonLeads.map(lead => ({
            'Nombre': lead.name,
            'Empresa': lead.company,
            'Email': lead.email,
            'Vendedor': getUserById(lead.ownerId)?.name || 'N/A',
            'Fecha de Creación': new Date(lead.createdAt).toLocaleDateString('es-ES')
        }));

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
                    {/* 5. Añadimos el botón de exportar */}
                    <Button onClick={handleExportExcel}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Exportar a Excel
                    </Button>
                </div>
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Empresa</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                {/* 6. Añadimos la cabecera de la columna */}
                                <th scope="col" className="px-6 py-3">Vendedor</th>
                                <th scope="col" className="px-6 py-3">Fecha de Creación</th>
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