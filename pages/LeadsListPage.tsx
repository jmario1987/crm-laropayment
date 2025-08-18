import React, { useMemo, useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types';
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';
import Select, { components, OptionProps, ValueContainerProps } from 'react-select';

// --- NUEVO: Componente para las opciones con Checkbox ---
const OptionWithCheckbox = (props: OptionProps<any, true>) => {
  return (
    <components.Option {...props}>
      <input type="checkbox" checked={props.isSelected} onChange={() => null} className="mr-2 accent-primary-600" />
      <label>{props.label}</label>
    </components.Option>
  );
};

// --- NUEVO: Componente para mostrar el resumen de selecciones (ej: "3 seleccionados") ---
const CustomValueContainer = ({ children, ...props }: ValueContainerProps<any, true>) => {
  const { getValue, hasValue } = props;
  const selectedCount = getValue().length;
  const placeholder = props.selectProps.placeholder;

  return (
    <components.ValueContainer {...props}>
      {!hasValue ? (
        placeholder
      ) : (
        <span className="text-gray-800 dark:text-gray-200">{selectedCount} seleccionado(s)</span>
      )}
    </components.ValueContainer>
  );
};

// Componente para una fila de la tabla (no cambia)
const LeadRow: React.FC<{ lead: Lead }> = ({ lead }) => {
    const { getUserById, getStageById } = useLeads();
    const sellerName = getUserById(lead.ownerId)?.name || 'No asignado';
    const stage = getStageById(lead.status);
    const stageName = stage?.name || 'Desconocido';
    const lastModification = useMemo(() => {
        const referenceDate = lead.lastUpdate || lead.createdAt;
        return new Date(referenceDate).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }, [lead.lastUpdate, lead.createdAt]);
    const creationDate = useMemo(() => {
        return new Date(lead.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }, [lead.createdAt]);
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
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lead.company}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{sellerName}</td>
            <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-bold rounded-full text-white" style={{ backgroundColor: stage?.color || '#cccccc' }}>{stageName}</span></td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{creationDate}</td>
            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lastModification}</td>
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200 text-center">{daysInProcess}</td>
        </tr>
    );
};

// --- Componente principal de la página (con la lógica de filtros y estilos corregidos) ---
const LeadsListPage: React.FC = () => {
    const { allLeads, sellers, providers, stages, getStageById, getUserById, getProviderById } = useLeads();
    const { user } = useAuth();
    
    const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);
    const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);
    const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);

    const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

    const visibleLeads = useMemo(() => {
        let leadsToDisplay = [...allLeads]; // Create a mutable copy for sorting
        if (!isManager) {
            leadsToDisplay = leadsToDisplay.filter(lead => lead.ownerId === user?.id);
        }
        if (isManager && selectedSellerIds.length > 0) {
            leadsToDisplay = leadsToDisplay.filter(lead => selectedSellerIds.includes(lead.ownerId));
        }
        if (isManager && selectedProviderIds.length > 0) {
            leadsToDisplay = leadsToDisplay.filter(lead => selectedProviderIds.includes(lead.providerId || ''));
        }
        if (selectedStageIds.length > 0) {
            leadsToDisplay = leadsToDisplay.filter(lead => selectedStageIds.includes(lead.status));
        }
        return leadsToDisplay.sort((a, b) => new Date(b.lastUpdate || b.createdAt).getTime() - new Date(a.lastUpdate || a.createdAt).getTime());
    }, [allLeads, user, isManager, selectedSellerIds, selectedProviderIds, selectedStageIds]);

    const handleExportExcel = () => {
        const dataToExport = visibleLeads.map(lead => ({
            "Prospecto": lead.name, "Empresa": lead.company, "Etapa": getStageById(lead.status)?.name || 'N/A',
            "Vendedor Asignado": getUserById(lead.ownerId)?.name || 'N/A', "Fecha de Ingreso": new Date(lead.createdAt).toLocaleDateString('es-ES'),
            "Última Modificación": new Date(lead.lastUpdate || lead.createdAt).toLocaleDateString('es-ES'), "Días en Proceso": Math.floor((new Date(lead.lastUpdate || lead.createdAt).getTime() - new Date(lead.createdAt).getTime()) / (1000 * 3600 * 24)),
            "Referido por": getProviderById(lead.providerId || '')?.name || 'N/A', "Email": lead.email, "Teléfono": lead.phone,
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Prospectos");
        XLSX.writeFile(workbook, "Reporte_Prospectos.xlsx");
    };

    const sellerOptions = sellers.map(s => ({ value: s.id, label: s.name }));
    const providerOptions = providers.map(p => ({ value: p.id, label: p.name }));
    const stageOptions = stages.map(s => ({ value: s.id, label: s.name }));
    
    // --- NUEVO: Estilos corregidos para que se vean sólidos y profesionales ---
    const customSelectStyles = {
        control: (base: any, state: { isFocused: any; }) => ({ ...base, backgroundColor: 'var(--bg-secondary)', borderColor: state.isFocused ? 'var(--primary-color)' : 'var(--border-color)', boxShadow: state.isFocused ? '0 0 0 1px var(--primary-color)' : 'none', '&:hover': { borderColor: 'var(--border-color-hover)' } }),
        menu: (base: any) => ({ ...base, backgroundColor: 'var(--bg-primary)' }),
        option: (base: any, state: { isSelected: any; isFocused: any; }) => ({ ...base, backgroundColor: state.isSelected ? 'var(--primary-color)' : state.isFocused ? 'var(--bg-tertiary)' : 'transparent', color: 'var(--text-color)', '&:hover': { backgroundColor: state.isSelected ? 'var(--primary-color-dark)' : 'var(--bg-tertiary)' } }),
        placeholder: (base: any) => ({ ...base, color: 'var(--text-color-secondary)' }),
        valueContainer: (base: any) => ({ ...base, padding: '2px 8px' }),
        multiValue: (base: any) => ({ ...base, backgroundColor: 'var(--bg-tertiary)' }),
        multiValueLabel: (base: any) => ({ ...base, color: 'var(--text-color)' }),
    };


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Listado de Prospectos</h3>
                <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center">
                    {isManager ? (
                        <>
                            <div className="w-full sm:w-56 text-sm">
                                <Select isMulti closeMenuOnSelect={false} hideSelectedOptions={false} options={stageOptions} onChange={selected => setSelectedStageIds(selected.map(s => s.value))} placeholder="Filtrar por Etapa..." components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} styles={customSelectStyles} />
                            </div>
                            <div className="w-full sm:w-56 text-sm">
                                <Select isMulti closeMenuOnSelect={false} hideSelectedOptions={false} options={providerOptions} onChange={selected => setSelectedProviderIds(selected.map(p => p.value))} placeholder="Filtrar por Proveedor..." components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} styles={customSelectStyles} />
                            </div>
                            <div className="w-full sm:w-56 text-sm">
                                <Select isMulti closeMenuOnSelect={false} hideSelectedOptions={false} options={sellerOptions} onChange={selected => setSelectedSellerIds(selected.map(s => s.value))} placeholder="Filtrar por Vendedor..." components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} styles={customSelectStyles} />
                            </div>
                        </>
                    ) : (
                         <div className="w-full sm:w-56 text-sm">
                            <Select isMulti closeMenuOnSelect={false} hideSelectedOptions={false} options={stageOptions} onChange={selected => setSelectedStageIds(selected.map(s => s.value))} placeholder="Filtrar por Etapa..." components={{ Option: OptionWithCheckbox, ValueContainer: CustomValueContainer }} styles={customSelectStyles} />
                         </div>
                    )}
                    <Button onClick={handleExportExcel}>Exportar a Excel</Button>
                </div>
            </div>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Prospecto</th>
                            <th scope="col" className="px-6 py-3">Empresa</th>
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
