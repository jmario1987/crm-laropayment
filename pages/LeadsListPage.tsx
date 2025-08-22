// pages/LeadsListPage.tsx

import React from 'react';
import { useMemo, useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead } from '../types';
import Select from 'react-select';
import { OptionWithCheckbox, CustomValueContainer } from '../components/ui/CustomMultiSelect';
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';
import { useClickOutside } from '../hooks/useClickOutside';

const LeadsListPage: React.FC = () => {
    const { allLeads = [], stages = [], users = [], providers = [], getStageById = () => undefined } = useLeads() || {};
    const { user } = useAuth();
    
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'createdAt' | 'daysInProcess'; direction: 'ascending' | 'descending' } | null>(null);
    const [selectedStages, setSelectedStages] = useState<{ value: string; label: string; }[]>([]);
    const [selectedSellers, setSelectedSellers] = useState<{ value: string; label: string; }[]>([]);
    const [selectedProviders, setSelectedProviders] = useState<{ value: string; label: string; }[]>([]);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const filtersRef = useClickOutside<HTMLDivElement>(() => {
        setOpenMenu(null);
    });

    const isManager = user?.role === 'Administrador' || user?.role === 'Supervisor';

    const stageOptions = useMemo(() => stages.map(s => ({ value: s.id, label: s.name })), [stages]);
    const sellerOptions = useMemo(() => 
        users.filter(u => u.role === 'Vendedor').map(u => ({ value: u.id, label: u.name })), 
        [users]
    );
    const providerOptions = useMemo(() => providers.map(p => ({ value: p.id, label: p.name })), [providers]);

    const filteredLeads = useMemo(() => {
        let leads = user?.role === 'Vendedor' ? allLeads.filter(lead => lead.ownerId === user.id) : allLeads;
        if (isManager) {
            if (selectedStages.length > 0) {
                const stageIds = selectedStages.map(s => s.value);
                leads = leads.filter(lead => stageIds.includes(lead.status));
            }
            if (selectedSellers.length > 0) {
                const sellerIds = selectedSellers.map(s => s.value);
                leads = leads.filter(lead => sellerIds.includes(lead.ownerId));
            }
            if (selectedProviders.length > 0) {
                const providerIds = selectedProviders.map(p => p.value);
                leads = leads.filter(lead => lead.providerId && providerIds.includes(lead.providerId));
            }
        }
        return leads;
    }, [allLeads, user, isManager, selectedStages, selectedSellers, selectedProviders]);

    const sortedLeads = useMemo(() => {
        // ---- SOLUCIÓN AL BUG DE DUPLICACIÓN ----
        // Se crea una NUEVA copia del array 'filteredLeads' usando el operador 'spread' (...).
        // Esto evita la mutación directa del estado y previene el bug de duplicación.
        const sortableLeads = [...filteredLeads];
        
        if (!sortConfig) {
            return sortableLeads;
        }
        
        sortableLeads.sort((a, b) => {
            const direction = sortConfig.direction === 'ascending' ? 1 : -1;
            switch (sortConfig.key) {
                case 'name':
                    return a.name.localeCompare(b.name) * direction;
                case 'createdAt':
                    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
                case 'daysInProcess':
                    const aDays = new Date().getTime() - new Date(a.createdAt).getTime();
                    const bDays = new Date().getTime() - new Date(b.createdAt).getTime();
                    return (aDays - bDays) * direction;
                default:
                    return 0;
            }
        });
        return sortableLeads;
    }, [filteredLeads, sortConfig]);

    const requestSort = (key: 'name' | 'createdAt' | 'daysInProcess') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleExportExcel = () => {
        const dataToExport = sortedLeads.map((lead: Lead) => {
            const daysInProcess = Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24));
            return {
                'Prospecto': lead.name,
                'Empresa': lead.company,
                'Etapa': getStageById(lead.status)?.name || 'N/A',
                'Vendedor': users.find(u => u.id === lead.ownerId)?.name || 'N/A',
                'Proveedor': providers.find(p => p.id === lead.providerId)?.name || 'N/A',
                'Fecha de Ingreso': new Date(lead.createdAt).toLocaleDateString(),
                'Días en Proceso': daysInProcess,
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospectos');
        XLSX.writeFile(workbook, 'Reporte_Prospectos.xlsx');
    };

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    return (
        <div className="space-y-6">
            {isManager && (
                <div ref={filtersRef} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg items-center">
                    <Select 
                        isMulti 
                        options={stageOptions} 
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} 
                        onChange={(selected) => setSelectedStages(selected as any)} 
                        placeholder="Filtrar por Etapa..."
                        onMenuOpen={() => setOpenMenu('stage')}
                        onMenuClose={() => setOpenMenu(null)}
                        menuIsOpen={openMenu === 'stage'}
                    />
                    <Select 
                        isMulti 
                        options={sellerOptions} 
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} 
                        onChange={(selected) => setSelectedSellers(selected as any)} 
                        placeholder="Filtrar por Vendedor..." 
                        onMenuOpen={() => setOpenMenu('seller')}
                        onMenuClose={() => setOpenMenu(null)}
                        menuIsOpen={openMenu === 'seller'}
                    />
                    <Select 
                        isMulti 
                        options={providerOptions} 
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} 
                        onChange={(selected) => setSelectedProviders(selected as any)} 
                        placeholder="Filtrar por Proveedor..."
                        onMenuOpen={() => setOpenMenu('provider')}
                        onMenuClose={() => setOpenMenu(null)}
                        menuIsOpen={openMenu === 'provider'}
                    />
                    <Button onClick={handleExportExcel}>Exportar a Excel</Button>
                </div>
            )}

            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('name')}>Prospecto {getSortIndicator('name')}</th>
                            <th scope="col" className="px-6 py-3">Etapa</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>Fecha de Ingreso {getSortIndicator('createdAt')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('daysInProcess')}>Días en Proceso {getSortIndicator('daysInProcess')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLeads.map(lead => (
                            <tr key={lead.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{lead.name}</td>
                                <td className="px-6 py-4">{getStageById(lead.status)?.name || 'N/A'}</td>
                                <td className="px-6 py-4">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadsListPage;