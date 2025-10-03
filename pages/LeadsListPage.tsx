// pages/LeadsListPage.tsx

import React, { useMemo, useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types'; // Se importa USER_ROLES
import Select from 'react-select';
import { OptionWithCheckbox, CustomValueContainer } from '../components/ui/CustomMultiSelect';
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';
import { useClickOutside } from '../hooks/useClickOutside';

const LeadsListPage: React.FC = () => {
    const { allLeads = [], stages = [], users = [], providers = [], tags = [], getStageById = () => undefined } = useLeads() || {};
    const { user } = useAuth();

    const leadsCopy = useMemo(() => [...allLeads], [allLeads]);
    
    const [sortConfig, setSortConfig] = useState<{ key: keyof Lead | 'daysInProcess' | 'daysInTag'; direction: 'ascending' | 'descending' } | null>(null);
    const [selectedStages, setSelectedStages] = useState<{ value: string; label: string; }[]>([]);
    const [selectedTags, setSelectedTags] = useState<{ value: string; label: string; }[]>([]);
    const [selectedSellers, setSelectedSellers] = useState<{ value: string; label: string; }[]>([]);
    const [selectedProviders, setSelectedProviders] = useState<{ value: string; label: string; }[]>([]);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const filtersRef = useClickOutside<HTMLDivElement>(() => {
        setOpenMenu(null);
    });

    // Se usan las constantes para mayor seguridad
    const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

    const stageOptions = useMemo(() => stages.map(s => ({ value: s.id, label: s.name })), [stages]);
    
    const tagOptions = useMemo(() => {
        if (selectedStages.length === 0) return [];
        const stageIds = selectedStages.map(s => s.value);
        return tags
            .filter(tag => stageIds.includes(tag.stageId))
            .map(t => ({ value: t.id, label: t.name }));
    }, [tags, selectedStages]);

    const sellerOptions = useMemo(() => users.filter(u => u.role === USER_ROLES.Vendedor).map(u => ({ value: u.id, label: u.name })), [users]);
    const providerOptions = useMemo(() => providers.map(p => ({ value: p.id, label: p.name })), [providers]);

    const filteredLeads = useMemo(() => {
        let baseLeads = leadsCopy;

        // --- CAMBIO CLAVE: Lógica condicional basada en el rol ---
        if (user?.role === USER_ROLES.Vendedor) {
            // Si es Vendedor, ve solo sus prospectos activos
            const closedStageIds = stages.filter(s => s.type === 'won' || s.type === 'lost').map(s => s.id);
            baseLeads = leadsCopy.filter(lead => lead.ownerId === user.id && !closedStageIds.includes(lead.status));
        }
        // Para Managers, la lista base (baseLeads) contiene TODO.

        // Aplicar filtros de la UI solo para Managers
        if (isManager) {
            let leads = baseLeads; // Empezamos con todos los leads
            if (selectedStages.length > 0) {
                const stageIds = selectedStages.map(s => s.value);
                leads = leads.filter(lead => stageIds.includes(lead.status));
            }
            if (selectedTags.length > 0) {
                const tagIds = selectedTags.map(t => t.value);
                leads = leads.filter(lead => lead.tagIds && lead.tagIds.some(tagId => tagIds.includes(tagId)));
            }
            if (selectedSellers.length > 0) {
                const sellerIds = selectedSellers.map(s => s.value);
                leads = leads.filter(lead => sellerIds.includes(lead.ownerId));
            }
            if (selectedProviders.length > 0) {
                const providerIds = selectedProviders.map(p => p.value);
                leads = leads.filter(lead => lead.providerId && providerIds.includes(lead.providerId));
            }
            return leads;
        }

        return baseLeads; // Para Vendedores, devuelve la lista ya filtrada
    }, [leadsCopy, user, isManager, stages, selectedStages, selectedTags, selectedSellers, selectedProviders]);

    const getTagInfo = (tagId?: string) => tags.find(t => t.id === tagId);

    const getDaysInTag = (lead: Lead): number | null => {
        const currentTagId = lead.tagIds?.[0];
        if (!currentTagId || !lead.tagHistory) return null;
        
        const lastEntry = lead.tagHistory.filter(h => h.tagId === currentTagId).pop();
        if (!lastEntry) return null;

        return Math.floor((new Date().getTime() - new Date(lastEntry.date).getTime()) / (1000 * 3600 * 24));
    };
    
    const sortedLeads = useMemo(() => {
        const sortableLeads = [...filteredLeads];
        if (!sortConfig) return sortableLeads;
        
        sortableLeads.sort((a, b) => {
            const direction = sortConfig.direction === 'ascending' ? 1 : -1;
            switch (sortConfig.key) {
                case 'name': return a.name.localeCompare(b.name) * direction;
                case 'createdAt': return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
                case 'daysInProcess':
                    const aDays = new Date().getTime() - new Date(a.createdAt).getTime();
                    const bDays = new Date().getTime() - new Date(b.createdAt).getTime();
                    return (aDays - bDays) * direction;
                case 'daysInTag':
                    const aDaysTag = getDaysInTag(a) ?? -1;
                    const bDaysTag = getDaysInTag(b) ?? -1;
                    return (aDaysTag - bDaysTag) * direction;
                default: return 0;
            }
        });
        return sortableLeads;
    }, [filteredLeads, sortConfig]);

    const requestSort = (key: keyof Lead | 'daysInProcess' | 'daysInTag') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleExportExcel = () => {
        const dataToExport = sortedLeads.map((lead: Lead) => {
            const currentTag = getTagInfo(lead.tagIds?.[0]);
            return {
                'Prospecto': lead.name,
                'Empresa': lead.company,
                'Etapa': getStageById(lead.status)?.name || 'N/A',
                'Sub-Etapa': currentTag?.name || 'N/A',
                'Vendedor': users.find(u => u.id === lead.ownerId)?.name || 'N/A',
                'Proveedor': providers.find(p => p.id === lead.providerId)?.name || 'N/A',
                'Fecha de Ingreso': new Date(lead.createdAt).toLocaleDateString(),
                'Días en Proceso': Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24)),
                'Días en Sub-Etapa': getDaysInTag(lead) ?? 'N/A',
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
                <div ref={filtersRef} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg items-center">
                    <Select isMulti options={stageOptions} closeMenuOnSelect={false} hideSelectedOptions={false} components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} onChange={(selected) => { setSelectedStages(selected as any); setSelectedTags([]); }} placeholder="Filtrar por Etapa..." onMenuOpen={() => setOpenMenu('stage')} onMenuClose={() => setOpenMenu(null)} menuIsOpen={openMenu === 'stage'} />
                    <Select isMulti options={tagOptions} closeMenuOnSelect={false} hideSelectedOptions={false} components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} onChange={(selected) => setSelectedTags(selected as any)} placeholder="Filtrar por Sub-Etapa..." onMenuOpen={() => setOpenMenu('tag')} onMenuClose={() => setOpenMenu(null)} menuIsOpen={openMenu === 'tag'} isDisabled={selectedStages.length === 0} value={selectedTags} />
                    <Select isMulti options={sellerOptions} closeMenuOnSelect={false} hideSelectedOptions={false} components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} onChange={(selected) => setSelectedSellers(selected as any)} placeholder="Filtrar por Vendedor..." onMenuOpen={() => setOpenMenu('seller')} onMenuClose={() => setOpenMenu(null)} menuIsOpen={openMenu === 'seller'} />
                    <Select isMulti options={providerOptions} closeMenuOnSelect={false} hideSelectedOptions={false} components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} onChange={(selected) => setSelectedProviders(selected as any)} placeholder="Filtrar por Proveedor..." onMenuOpen={() => setOpenMenu('provider')} onMenuClose={() => setOpenMenu(null)} menuIsOpen={openMenu === 'provider'} />
                    <Button onClick={handleExportExcel}>Exportar a Excel</Button>
                </div>
            )}

            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('name')}>Prospecto {getSortIndicator('name')}</th>
                            <th scope="col" className="px-6 py-3">Etapa</th>
                            <th scope="col" className="px-6 py-3">Sub-Etapa</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>Fecha de Ingreso {getSortIndicator('createdAt')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('daysInProcess')}>Días en Proceso {getSortIndicator('daysInProcess')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('daysInTag')}>Días en Sub-Etapa {getSortIndicator('daysInTag')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLeads.map(lead => {
                            const currentTag = getTagInfo(lead.tagIds?.[0]);
                            const daysInTag = getDaysInTag(lead);
                            return (
                                <tr key={lead.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{lead.name}</td>
                                    <td className="px-6 py-4">{getStageById(lead.status)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        {currentTag ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full text-white" style={{ backgroundColor: currentTag.color }}>
                                                {currentTag.name}
                                            </span>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24))}</td>
                                    <td className="px-6 py-4">{daysInTag !== null ? daysInTag : 'N/A'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadsListPage;