import React, { useMemo, useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types';
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';
import BillingModal from '../components/billing/BillingModal';

const getCurrentMonthYear = () => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${year}`;
};

const WonLeadRow: React.FC<{ lead: Lead; sellerName?: string; onBillingClick: (lead: Lead) => void; }> = ({ lead, sellerName, onBillingClick }) => {
    
    const currentMonthBilled = lead.billingHistory?.[getCurrentMonthYear()] === true;

    return (
        <tr className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ${lead.clientStatus === 'Inactivo' ? 'opacity-50' : ''}`}>
            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{lead.affiliateNumber || 'N/A'}</td>
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sellerName || 'N/A'}</td>
            <td className="px-6 py-4">
                {/* --- LA LÍNEA CORREGIDA ESTÁ AQUÍ --- */}
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
                <Button variant="icon" onClick={() => onBillingClick(lead)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </Button>
            </td>
        </tr>
    );
};

const WonLeadsPage: React.FC = () => {
    const { allLeads, stages, getUserById, providers, getProviderById, dispatch } = useLeads();
    const { user } = useAuth();
    const [selectedProviderId, setSelectedProviderId] = useState('all');
    const [includeInactive, setIncludeInactive] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());
    const [billingLead, setBillingLead] = useState<Lead | null>(null);

    const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

    const wonLeads = useMemo(() => {
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
        
        return leads;
    }, [allLeads, stages, user, selectedProviderId, includeInactive]);
    
    const handleSaveBilling = (updatedData: Partial<Lead>) => {
        if (billingLead) {
            dispatch({ type: 'UPDATE_LEAD', payload: { ...billingLead, ...updatedData } });
        }
        setBillingLead(null);
    };

    const handleExportExcel = () => {
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

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Clientes Ganados</h3>
                    <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center">
                        {isManager && (
                            <>
                                <div className="w-full sm:w-auto">
                                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        {monthOptions.map(m => <option key={m} value={m}>Facturación de {m}</option>)}
                                    </select>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <select value={selectedProviderId} onChange={(e) => setSelectedProviderId(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="all">Todos los Proveedores</option>
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
                                <th scope="col" className="px-6 py-3">Nº Afiliado</th>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Vendedor</th>
                                <th scope="col" className="px-6 py-3">Estado Cliente</th>
                                <th scope="col" className="px-6 py-3 text-center">Facturación ({getCurrentMonthYear()})</th>
                                <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wonLeads.map(lead => {
                                const seller = getUserById(lead.ownerId);
                                return <WonLeadRow key={lead.id} lead={lead} sellerName={seller?.name} onBillingClick={setBillingLead} />;
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