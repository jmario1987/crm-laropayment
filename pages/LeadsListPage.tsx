import React, { useMemo, useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types'; 
import Select from 'react-select';
import { OptionWithCheckbox, CustomValueContainer } from '../components/ui/CustomMultiSelect';
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';
import { useClickOutside } from '../hooks/useClickOutside';
import BulkImportModal from '../components/pipeline/BulkImportModal'; 
// --- NUEVO: Importamos el Modal Interactivo ---
import LeadDetailsModal from '../components/leads/LeadDetailsModal';

const LeadsListPage: React.FC = () => {
    const { allLeads = [], stages = [], users = [], providers = [], tags = [], getStageById = () => undefined, products = [] } = useLeads() || {};
    const { user } = useAuth();

    const leadsCopy = useMemo(() => [...allLeads], [allLeads]);
    
    const [sortConfig, setSortConfig] = useState<{ key: keyof Lead | 'daysInProcess' | 'daysInTag'; direction: 'ascending' | 'descending' } | null>(null);
    const [selectedStages, setSelectedStages] = useState<{ value: string; label: string; }[]>([]);
    const [selectedTags, setSelectedTags] = useState<{ value: string; label: string; }[]>([]);
    const [selectedSellers, setSelectedSellers] = useState<{ value: string; label: string; }[]>([]);
    const [selectedProviders, setSelectedProviders] = useState<{ value: string; label: string; }[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ value: string; label: string; }[]>([]); 
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    // --- NUEVO ESTADO: Controla qué lead se abre en el Modal ---
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const filtersRef = useClickOutside<HTMLDivElement>(() => {
        setOpenMenu(null);
    });

    const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

    const handleOpenImportModal = () => setIsImportModalOpen(true);
    const handleCloseImportModal = () => setIsImportModalOpen(false);

    const stageOptions = useMemo(() => stages.map(s => ({ value: s.id, label: s.name })), [stages]);
    
    const tagOptions = useMemo(() => {
        if (selectedStages.length === 0 && !isManager) {
            return tags.map(t => ({ value: t.id, label: t.name }));
        }
        if (selectedStages.length === 0 && isManager) {
            return [];
        }
        const stageIds = selectedStages.map(s => s.value);
        return tags
            .filter(tag => stageIds.includes(tag.stageId))
            .map(t => ({ value: t.id, label: t.name }));
    }, [tags, selectedStages, isManager]); 

    const sellerOptions = useMemo(() => users.filter(u => u.role === USER_ROLES.Vendedor).map(u => ({ value: u.id, label: u.name })), [users]);
    const providerOptions = useMemo(() => providers.map(p => ({ value: p.id, label: p.name })), [providers]);
    const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name })), [products]);

    const filteredLeads = useMemo(() => {
        let baseLeads = leadsCopy;

        if (user?.role === USER_ROLES.Vendedor) {
            baseLeads = leadsCopy.filter(lead => lead.ownerId === user.id);
        }
       
        let filteredList = baseLeads;

        if (selectedStages.length > 0) {
            const stageIds = selectedStages.map(s => s.value);
            filteredList = filteredList.filter(lead => stageIds.includes(lead.status));
        }
        if (selectedTags.length > 0) {
            const tagIds = selectedTags.map(t => t.value);
            filteredList = filteredList.filter(lead => lead.tagIds && lead.tagIds.some(tagId => tagIds.includes(tagId)));
        }
        if (selectedProviders.length > 0) {
            const providerIds = selectedProviders.map(p => p.value);
            filteredList = filteredList.filter(lead => lead.providerId && providerIds.includes(lead.providerId));
        }
        if (selectedProducts.length > 0) {
            const productIds = selectedProducts.map(p => p.value);
            filteredList = filteredList.filter(lead => 
                lead.productIds && lead.productIds.some(prodId => productIds.includes(prodId))
            );
        }

        if (isManager) {
            if (selectedSellers.length > 0) {
                const sellerIds = selectedSellers.map(s => s.value);
                filteredList = filteredList.filter(lead => sellerIds.includes(lead.ownerId));
            }
        }

        return filteredList; 
    }, [leadsCopy, user, isManager, stages, selectedStages, selectedTags, selectedSellers, selectedProviders, providers, selectedProducts]);

    const getTagInfo = (tagId?: string) => tags.find(t => t.id === tagId);

    const getDaysInTag = (lead: Lead): number | null => {
        const currentTagId = lead.tagIds?.[0];
        if (!currentTagId || !lead.tagHistory) return null;
        const lastEntry = lead.tagHistory.filter(h => h.tagId === currentTagId).pop();
        if (!lastEntry) return null;
        return Math.floor((new Date().getTime() - new Date(lastEntry.date).getTime()) / (1000 * 3600 * 24));
    };
    
    const getProductNames = (productIds?: string[]): string => {
        if (!productIds || productIds.length === 0) return 'N/A';
        return productIds
            .map(id => products.find(p => p.id === id)?.name)
            .filter((name): name is string => name !== undefined)
            .join(', ');
    };

    const sortedLeads = useMemo(() => {
        const sortableLeads = [...filteredLeads]; 
        if (!sortConfig) return sortableLeads;
        
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
                case 'daysInTag':
                    const aDaysTag = getDaysInTag(a) ?? -1;
                    const bDaysTag = getDaysInTag(b) ?? -1;
                    return (aDaysTag - bDaysTag) * direction;
                default: 
                    return 0;
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
                'Productos': getProductNames(lead.productIds), 
                'Vendedor': users.find(u => u.id === lead.ownerId)?.name || 'N/A',
                'Proveedor': providers.find(p => p.id === lead.providerId)?.name || 'N/A', 
                'Fecha de Ingreso': new Date(lead.createdAt).toLocaleDateString(),
                'Días en Proceso': Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24)),
                'Días en Sub-Etapa': getDaysInTag(lead) ?? 'N/A',
            };
        });
        
        const headers: string[] = [
            'Prospecto', 'Empresa', 'Etapa', 'Sub-Etapa', 'Productos', 
            'Vendedor', 'Proveedor', 'Fecha de Ingreso', 
            'Días en Proceso', 'Días en Sub-Etapa'
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
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
            {/* --- SECCIÓN 1: FILTROS MÁS COMPACTOS --- */}
            {user && (
                <div ref={filtersRef} className={`grid grid-cols-1 ${isManager ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 items-center`}>
                    <Select isMulti options={stageOptions} closeMenuOnSelect={false} hideSelectedOptions={false} components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} onChange={(selected) => { setSelectedStages(selected as any); setSelectedTags([]); }} placeholder="Filtrar por Etapa..." onMenuOpen={() => setOpenMenu('stage')} onMenuClose={() => setOpenMenu(null)} menuIsOpen={openMenu === 'stage'} />
                    <Select isMulti options={tagOptions} closeMenuOnSelect={false} hideSelectedOptions={false} components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} onChange={(selected) => setSelectedTags(selected as any)} placeholder="Filtrar por Sub-Etapa..." onMenuOpen={() => setOpenMenu('tag')} onMenuClose={() => setOpenMenu(null)} menuIsOpen={openMenu === 'tag'} isDisabled={!isManager && selectedStages.length === 0} value={selectedTags} />
                    <Select isMulti options={providerOptions} closeMenuOnSelect={false} hideSelectedOptions={false} components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} onChange={(selected) => setSelectedProviders(selected as any)} placeholder="Filtrar por Proveedor..." onMenuOpen={() => setOpenMenu('provider')} onMenuClose={() => setOpenMenu(null)} menuIsOpen={openMenu === 'provider'} /> 
                    <Select isMulti options={productOptions} closeMenuOnSelect={false} hideSelectedOptions={false} components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} onChange={(selected) => setSelectedProducts(selected as any)} placeholder="Filtrar por Producto..." onMenuOpen={() => setOpenMenu('product')} onMenuClose={() => setOpenMenu(null)} menuIsOpen={openMenu === 'product'} />

                    {isManager && (
                        <Select isMulti options={sellerOptions} closeMenuOnSelect={false} hideSelectedOptions={false} components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} onChange={(selected) => setSelectedSellers(selected as any)} placeholder="Filtrar por Vendedor..." onMenuOpen={() => setOpenMenu('seller')} onMenuClose={() => setOpenMenu(null)} menuIsOpen={openMenu === 'seller'} />
                    )}
                </div>
            )}

            {/* --- SECCIÓN 2: BOTONERA DE ACCIÓN ALINEADA --- */}
            <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {sortedLeads.length} Prospectos encontrados
                </h3>
                
                {user && (
                    <div className="flex space-x-3">
                        {isManager && (
                            <Button onClick={handleExportExcel} variant="secondary" className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2l2 3 2-3h2"></path><path d="M8 17h2l2-3 2 3h2"></path></svg>
                                Exportar Excel
                            </Button>
                        )}
                        <Button onClick={handleOpenImportModal} className="flex items-center gap-2"> 
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            Importación Masiva
                        </Button>
                    </div>
                )}
            </div>

            {/* --- SECCIÓN 3: TABLA INTERACTIVA CON NUEVAS COLUMNAS --- */}
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition" onClick={() => requestSort('name')}>Prospecto {getSortIndicator('name')}</th>
                            <th scope="col" className="px-6 py-4">Etapa / Sub-Etapa</th>
                            <th scope="col" className="px-6 py-4">Responsable / Origen</th>
                            <th scope="col" className="px-6 py-4">Productos</th>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition" onClick={() => requestSort('daysInProcess')}>Tiempos (Días) {getSortIndicator('daysInProcess')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLeads.map(lead => {
                            const currentTag = getTagInfo(lead.tagIds?.[0]);
                            const daysInTag = getDaysInTag(lead);
                            const productNames = getProductNames(lead.productIds);
                            const sellerName = users.find(u => u.id === lead.ownerId)?.name || 'Sin asignar';
                            const providerName = providers.find(p => p.id === lead.providerId)?.name || 'Directo';

                            return (
                                <tr 
                                    key={lead.id} 
                                    onClick={() => setSelectedLead(lead)}
                                    className="bg-white border-b dark:bg-gray-900 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{lead.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">{lead.company || lead.email || 'Sin empresa'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800 dark:text-gray-300">{getStageById(lead.status)?.name || 'N/A'}</div>
                                        {currentTag && (
                                            <div className="mt-1.5">
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full text-white tracking-wide uppercase shadow-sm" style={{ backgroundColor: currentTag.color }}>
                                                    {currentTag.name}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800 dark:text-gray-300 flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                            {sellerName}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4z"/></svg>
                                            Ref: {providerName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={productNames}>
                                            {productNames}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300 w-fit">
                                                En proceso: <strong className="text-gray-900 dark:text-white">{Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24))} d</strong>
                                            </span>
                                            {daysInTag !== null && (
                                                <span className="text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-red-600 dark:text-red-400 w-fit">
                                                    En sub-etapa: <strong>{daysInTag} d</strong>
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {sortedLeads.length === 0 && (
                    <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                        No se encontraron prospectos con los filtros actuales.
                    </div>
                )}
            </div>

            <BulkImportModal 
              isOpen={isImportModalOpen} 
              onClose={handleCloseImportModal} 
            />
            
            {/* --- EL MODAL INTERACTIVO SE LEVANTA AQUÍ --- */}
            {selectedLead && (
                <LeadDetailsModal 
                    lead={selectedLead}
                    isOpen={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                />
            )}
        </div>
    );
};

export default LeadsListPage;