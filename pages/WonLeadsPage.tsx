import React, { useMemo } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth'; // 1. Importamos useAuth
import { Lead, USER_ROLES } from '../types'; // 2. Importamos USER_ROLES

// Un componente pequeño para dibujar cada fila de la tabla
const WonLeadRow: React.FC<{ lead: Lead }> = ({ lead }) => (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.company}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.email}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
            {new Date(lead.createdAt).toLocaleDateString('es-ES')}
        </td>
    </tr>
);

// El componente principal de la página
const WonLeadsPage: React.FC = () => {
    const { allLeads, stages } = useLeads();
    const { user } = useAuth(); // 3. Obtenemos el usuario actual

    const wonLeads = useMemo(() => {
        const wonStageIds = stages.filter(s => s.type === 'won').map(s => s.id);
        const allWonLeads = allLeads.filter(lead => wonStageIds.includes(lead.status));

        // 4. Aplicamos el filtro de visibilidad según el rol
        if (!user) return []; // Si no hay usuario, no mostrar nada
        if (user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor) {
            return allWonLeads; // Admin y Supervisor ven todo
        }
        // Los vendedores solo ven los suyos
        return allWonLeads.filter(lead => lead.ownerId === user.id);

    }, [allLeads, stages, user]);

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Prospectos Ganados</h3>
                </div>
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Empresa</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Fecha de Creación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wonLeads.map(lead => <WonLeadRow key={lead.id} lead={lead} />)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WonLeadsPage;