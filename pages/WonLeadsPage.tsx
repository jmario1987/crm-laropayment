import React, { useMemo, useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types';
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';
import BillingModal from '../components/billing/BillingModal';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; 

type SortColumn = 'affiliateNumber' | 'name' | 'sellerName';
type SortDirection = 'asc' | 'desc';

const getCurrentMonthYear = () => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${year}`;
};

// --- 1. AÑADIMOS 'selectedMonth' A LAS PROPS DE LA FILA ---
const WonLeadRow: React.FC<{ 
    lead: Lead; 
    sellerName?: string; 
    onBillingClick: (lead: Lead) => void;
    isManager: boolean; 
    selectedMonth: string; // <-- NUEVA PROP
}> = ({ lead, sellerName, onBillingClick, isManager, selectedMonth }) => { // <-- Se recibe la prop
    
    // --- 2. USAMOS 'selectedMonth' EN LUGAR DE 'getCurrentMonthYear()' ---
    const currentMonthBilled = lead.billingHistory?.[selectedMonth] === true;

    return (
        <tr className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ${lead.clientStatus === 'Inactivo' ? 'opacity-50' : ''}`}>
            <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white">{lead.affiliateNumber || 'N/A'}</td>
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sellerName || 'N/A'}</td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${lead.clientStatus === 'Inactivo' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {lead.clientStatus || 'Activo'}
                </span>
            </td>
            <td className="px-6 py-4 text-center">
                {currentMonthBilled ? (
                    <span className="text-green-500 font-bold text-2xl">✓</span>
                ) : (
                    <span className="text-red-500 font-bold text-xl">×</span>
                )}
            </td>
            <td className="px-6 py-4 text-center">
                {isManager && (
                    <Button variant="icon" onClick={() => onBillingClick(lead)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </Button>
                )}
            </td>
        </tr>
    );
};

const WonLeadsPage: React.FC = () => {
    const { allLeads, stages, getUserById, providers, getProviderById, dispatch } = useLeads();
    const { user } = useAuth();
    const [selectedProviderId, setSelectedProviderId] = useState('all');
    const [includeInactive, setIncludeInactive] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear()); // <-- Este estado ya lo tenías
    const [billingLead, setBillingLead] = useState<Lead | null>(null);
    
    const [sortColumn, setSortColumn] = useState<SortColumn>('affiliateNumber'); 
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc'); 

    const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

    const wonLeads = useMemo(() => {
        // ... (lógica de filtrado y ordenamiento sin cambios) ...
        const wonStageIds = stages.filter(s => s.type === 'won').map(s => s.id);
        let leads = allLeads.filter(lead => wonStageIds.includes(lead.status));

        if (!user) return [];
        
        if (isManager) {
            if (selectedProviderId !== 'all') {
                leads = leads.filter(lead => lead.providerId === selectedProviderId);
            }
            if (!includeInactive) {
                leads = leads.filter(lead => lead.clientStatus !== 'Inactivo');
            }
        } else {
            leads = leads.filter(lead => lead.ownerId === user.id && lead.clientStatus !== 'Inactivo');
        }
        
        leads.sort((a, b) => {
            let valA: string | number | undefined;
            let valB: string | number | undefined;

            if (sortColumn === 'affiliateNumber') {
                valA = parseInt(a.affiliateNumber || '0', 10);
                valB = parseInt(b.affiliateNumber || '0', 10);
            } else if (sortColumn === 'name') {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
            } else if (sortColumn === 'sellerName') {
                valA = getUserById(a.ownerId)?.name.toLowerCase() || '';
                valB = getUserById(b.ownerId)?.name.toLowerCase() || '';
            }

            if (valA === undefined || valB === undefined) return 0;

            let comparison = 0;
            if (valA < valB) {
                comparison = -1;
            } else if (valA > valB) {
                comparison = 1;
            }

            return sortDirection === 'desc' ? (comparison * -1) : comparison;
        });
        
        return leads;
    }, [allLeads, stages, user, selectedProviderId, includeInactive, sortColumn, sortDirection, getUserById]); 
    
    const handleSaveBilling = async (updatedData: Partial<Lead>) => {
        // ... (código sin cambios) ...
        if (!billingLead) return;
        try {
            const leadRef = doc(db, 'leads', billingLead.id);
            await updateDoc(leadRef, updatedData);
            dispatch({ type: 'UPDATE_LEAD', payload: { ...billingLead, ...updatedData } });
        } catch (error) {
            console.error("Error al actualizar la facturación: ", error);
        } finally {
            setBillingLead(null);
        }
    };

    const handleExportExcel = () => {
        // ... (código sin cambios) ...
        const leadsForReport = wonLeads.filter(lead => lead.billingHistory?.[selectedMonth] === true);
        const dataToExport = leadsForReport.map(lead => ({
            'Nº Afiliado': lead.affiliateNumber || 'N/A',
            'Nombre Cliente': lead.name,
            'Empresa': lead.company,
            'Vendedor Asignado': getUserById(lead.ownerId)?.name || 'N/A',
            'Referido por': getProviderById(lead.providerId || '')?.name || 'N/A',
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Comisiones ${selectedMonth}`);
        XLSX.writeFile(workbook, `Reporte_Comisiones_${selectedMonth}.xlsx`);
    };
    
    const monthOptions = useMemo(() => {
        // ... (código sin cambios) ...
        const options = [];
        let date = new Date();
        for (let i = 0; i < 6; i++) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            options.push(`${month}-${year}`);
            date.setMonth(date.getMonth() - 1);
        }
        return options;
    }, []);

    const handleSort = (column: SortColumn) => {
        // ... (código sin cambios) ...
        if (column === sortColumn) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const renderSortArrow = (column: SortColumn) => {
        // ... (código sin cambios) ...
        if (column !== sortColumn) return null; 
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Clientes en Producción</h3>
                    <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center">
                        {isManager && (
                            <>
                                <div className="w-full sm:w-auto">
                                    {/* Este select USA 'selectedMonth' */}
                                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        {monthOptions.map(m => <option key={m} value={m}>Facturación de {m}</option>)}
                                    </select>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <select value={selectedProviderId} onChange={(e) => setSelectedProviderId(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="all">Todos los Desarrolladores</option> 
                                        {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center">
                                    <input type="checkbox" id="include-inactive" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"/>
                                    <label htmlFor="include-inactive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Incluir Inactivos</label>
                                </div>
                            </>
                        )}
                        <Button onClick={handleExportExcel}>Exportar Reporte</Button>
                    </div>
                </div>
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    <button 
                                        onClick={() => handleSort('affiliateNumber')} 
                                        className="font-bold hover:text-primary-600 dark:hover:text-primary-400"
                                    >
                                        Nº Afiliado{renderSortArrow('affiliateNumber')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Vendedor</th>
                                <th scope="col" className="px-6 py-3">Estado Cliente</th>
                                {/* --- 3. TÍTULO DE COLUMNA AHORA ES DINÁMICO --- */}
                                <th scope="col" className="px-6 py-3 text-center">Facturación ({selectedMonth})</th>
                                <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wonLeads.map(lead => {
                                const seller = getUserById(lead.ownerId);
                                // --- 4. PASAMOS 'selectedMonth' A CADA FILA ---
                                return <WonLeadRow 
                                            key={lead.id} 
                                            lead={lead} 
                                            sellerName={seller?.name} 
                                            onBillingClick={setBillingLead} 
                                            isManager={isManager} 
                                            selectedMonth={selectedMonth} // <-- PASAMOS LA PROP
                                        />;
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {billingLead && (
                <BillingModal
                    lead={billingLead}
                    isOpen={!!billingLead}
                    onClose={() => setBillingLead(null)}
                    onSave={handleSaveBilling}
                />
            )}
        </div>
    );
};

export default WonLeadsPage;