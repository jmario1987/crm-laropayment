import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types';
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';
import Select, { components, OptionProps, ValueContainerProps } from 'react-select';

// Componentes personalizados para Select (no cambian)
const OptionWithCheckbox = (props: OptionProps<any, true>) => (
  <components.Option {...props}>
    <input type="checkbox" checked={props.isSelected} onChange={() => null} className="mr-2 accent-sky-600" />
    <label>{props.label}</label>
  </components.Option>
);

const CustomValueContainer = ({ children, ...props }: ValueContainerProps<any, true>) => {
  const { getValue, hasValue } = props;
  const selectedCount = getValue().length;
  const placeholder = props.selectProps.placeholder;
  return (
    <components.ValueContainer {...props}>
      {!hasValue ? placeholder : <span className="text-gray-800 dark:text-gray-200">{selectedCount} seleccionado(s)</span>}
    </components.ValueContainer>
  );
};

// Componente para una fila de la tabla (sin cambios)
const LeadRow: React.FC<{ lead: Lead }> = ({ lead }) => {
    const { getUserById, getStageById } = useLeads();
    const sellerName = getUserById(lead.ownerId)?.name || 'No asignado';
    const stage = getStageById(lead.status);
    const stageName = stage?.name || 'Desconocido';
    const creationDate = useMemo(() => new Date(lead.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }), [lead.createdAt]);
    const daysInProcess = useMemo(() => Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24)), [lead.createdAt]);

    return (
        <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.company}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sellerName}</td>
            <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-bold rounded-full text-white" style={{ backgroundColor: stage?.color || '#cccccc' }}>{stageName}</span></td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{creationDate}</td>
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200 text-center">{daysInProcess}</td>
        </tr>
    );
};

// --- COMPONENTE PRINCIPAL CON LÓGICA DE ORDENAMIENTO ---
const LeadsListPage: React.FC = () => {
    const { allLeads, sellers, providers, stages, getStageById, getUserById, getProviderById } = useLeads();
    const { user } = useAuth();
    
    const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);
    const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);
    const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const filtersRef = useRef<HTMLDivElement>(null);

    // --- NUEVO ESTADO PARA EL ORDENAMIENTO ---
    type SortableKeys = 'name' | 'company' | 'createdAt' | 'lastUpdate';
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' }>({ key: 'lastUpdate', direction: 'desc' });

    const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const visibleLeads = useMemo(() => {
        let leadsToDisplay = [...allLeads];
        // ... (lógica de filtrado sin cambios)
        if (!isManager) { leadsToDisplay = leadsToDisplay.filter(lead => lead.ownerId === user?.id); }
        if (isManager && selectedSellerIds.length > 0) { leadsToDisplay = leadsToDisplay.filter(lead => selectedSellerIds.includes(lead.ownerId)); }
        if (isManager && selectedProviderIds.length > 0) { leadsToDisplay = leadsToDisplay.filter(lead => selectedProviderIds.includes(lead.providerId || '')); }
        if (selectedStageIds.length > 0) { leadsToDisplay = leadsToDisplay.filter(lead => selectedStageIds.includes(lead.status)); }
        
        // --- NUEVA LÓGICA DE ORDENAMIENTO DINÁMICO ---
        leadsToDisplay.sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return leadsToDisplay;
    }, [allLeads, user, isManager, selectedSellerIds, selectedProviderIds, selectedStageIds, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortableKeys) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '🔼' : '🔽';
    };

    const handleExportExcel = () => { /* ... (lógica de exportación sin cambios) ... */ };
    const sellerOptions = sellers.map(s => ({ value: s.id, label: s.name }));
    const providerOptions = providers.map(p => ({ value: p.id, label: p.name }));
    const stageOptions = stages.map(s => ({ value: s.id, label: s.name }));
    const customSelectStyles = { /* ... (estilos sin cambios) ... */ };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Listado de Prospectos</h3>
                {/* ... (sección de filtros sin cambios) ... */}
            </div>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            {/* --- ENCABEZADOS DE TABLA AHORA CLICABLES --- */}
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('name')}>
                                Prospecto {getSortIndicator('name')}
                            </th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('company')}>
                                Empresa {getSortIndicator('company')}
                            </th>
                            <th scope="col" className="px-6 py-3">Vendedor Asignado</th>
                            <th scope="col" className="px-6 py-3">Etapa Actual</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>
                                Fecha de Ingreso {getSortIndicator('createdAt')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-center cursor-pointer" onClick={() => console.log('Sorting by days in process requires special logic')}>
                                Días en Proceso {/* {getSortIndicator('daysInProcess')} --- Nota: Requiere cálculo previo para ordenar */}
                            </th>
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
