import React, { useState, useMemo } from 'react';
import { useLeads } from '../hooks/useLeads';
import Button from '../components/ui/Button';
import * as XLSX from 'xlsx';
import Select from 'react-select';

const ReportsPage: React.FC = () => {
    const { allLeads, stages, providers } = useLeads();

    const wonStageId = useMemo(() => stages.find(s => s.type === 'won')?.id || '', [stages]);

    const [filterStage, setFilterStage] = useState<string>(wonStageId);
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');
    const [filterLeadId, setFilterLeadId] = useState<string>(''); 
    const [filterCurrency, setFilterCurrency] = useState<'ALL' | 'CRC' | 'USD'>('ALL');
    const [filterProvider, setFilterProvider] = useState<string>('');

    const clientOptions = useMemo(() => {
        return allLeads
            .map(lead => ({ value: lead.id, label: lead.name }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [allLeads]);

    const handleExportEquipments = () => {
        let filteredLeads = allLeads;

        if (filterStage) filteredLeads = filteredLeads.filter(lead => lead.status === filterStage);
        if (filterStartDate) {
            const start = new Date(filterStartDate);
            start.setHours(0, 0, 0, 0);
            filteredLeads = filteredLeads.filter(lead => new Date(lead.createdAt) >= start);
        }
        if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999);
            filteredLeads = filteredLeads.filter(lead => new Date(lead.createdAt) <= end);
        }
        if (filterLeadId) filteredLeads = filteredLeads.filter(lead => lead.id === filterLeadId);
        if (filterProvider) filteredLeads = filteredLeads.filter(lead => lead.providerId === filterProvider);

        const exportData: any[] = [];

        filteredLeads.forEach(lead => {
            if (lead.equipments && lead.equipments.length > 0) {
                lead.equipments.forEach(eq => {
                    
                    // --- MIGRACIÓN AL VUELO PARA EL EXCEL ---
                    const displaySerie = eq.serie !== undefined ? eq.serie : eq.placa;
                    const displayPlaca = eq.serie !== undefined ? eq.placa : '';

                    if (eq.terminals && eq.terminals.length > 0) {
                        eq.terminals.forEach(term => {
                            if (filterCurrency !== 'ALL' && term.currency !== filterCurrency) return;

                            exportData.push({
                                "Nombre del Comercio": lead.name,
                                "Número de Afiliado": lead.affiliateNumber || 'N/A',
                                "Oficina Asignada": lead.assignedOffice || 'N/A',
                                "Sede o Caja": eq.sede || 'N/A',
                                "Placa": displayPlaca || 'N/A',
                                "N° Serie": displaySerie || 'N/A',
                                "Moneda": term.currency,
                                "Terminal": term.number,
                                "Fecha Ingreso CRM": new Date(lead.createdAt).toLocaleDateString()
                            });
                        });
                    } else {
                        if (filterCurrency === 'ALL') {
                            exportData.push({
                                "Nombre del Comercio": lead.name,
                                "Número de Afiliado": lead.affiliateNumber || 'N/A',
                                "Oficina Asignada": lead.assignedOffice || 'N/A',
                                "Sede o Caja": eq.sede || 'N/A',
                                "Placa": displayPlaca || 'N/A',
                                "N° Serie": displaySerie || 'N/A',
                                "Moneda": "Sin configurar",
                                "Terminal": "Sin configurar",
                                "Fecha Ingreso CRM": new Date(lead.createdAt).toLocaleDateString()
                            });
                        }
                    }
                });
            }
        });

        if (exportData.length === 0) {
            alert("No se encontraron equipos ni terminales con los filtros seleccionados.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        
        // Ajustamos los anchos de columna para que entre perfectamente Placa y Serie
        worksheet['!cols'] = [
            { wch: 35 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, 
            { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 18 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, "Terminales");
        const today = new Date().toISOString().split('T')[0];
        
        const clientName = filterLeadId ? clientOptions.find(c => c.value === filterLeadId)?.label.replace(/[^a-z0-9]/gi, '_').substring(0, 15) : 'General';
        XLSX.writeFile(workbook, `Reporte_Equipos_${clientName}_${today}.xlsx`);
    };

    const inputClass = "mt-1 block w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm";
    const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1";

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            minHeight: '34px',
            borderColor: '#d1d5db',
            borderRadius: '0.375rem',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#6b7280'
            }
        }),
        menu: (base: any) => ({
            ...base,
            zIndex: 50
        })
    };

    return (
        <div className="space-y-4 max-w-5xl mx-auto p-4">
            
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Reporte de Datáfonos y Terminales</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                    Genera un archivo de Excel con la lista de todas las placas, series y terminales. Usa los filtros para segmentar la información.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className={labelClass}>Etapa del Cliente</label>
                        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} className={inputClass}>
                            <option value="">Todas las etapas</option>
                            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Moneda de la Terminal</label>
                        <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value as any)} className={inputClass}>
                            <option value="ALL">Ambas (Colones y Dólares)</option>
                            <option value="CRC">Solo Colones (CRC)</option>
                            <option value="USD">Solo Dólares (USD)</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-1.5">
                            🔍 Extraer reporte de un cliente específico (Opcional)
                        </label>
                        <Select
                            options={clientOptions}
                            isClearable
                            placeholder="Buscar por nombre de comercio..."
                            value={clientOptions.find(opt => opt.value === filterLeadId) || null}
                            onChange={(selected: any) => setFilterLeadId(selected ? selected.value : '')}
                            styles={selectStyles}
                            className="text-sm text-gray-900"
                            noOptionsMessage={() => "No se encontraron clientes"}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Fecha de Ingreso al CRM (Desde)</label>
                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={inputClass} />
                    </div>
                    
                    <div>
                        <label className={labelClass}>Fecha de Ingreso al CRM (Hasta)</label>
                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={inputClass} />
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>Origen / Proveedor</label>
                        <select value={filterProvider} onChange={e => setFilterProvider(e.target.value)} className={inputClass}>
                            <option value="">Todos los proveedores</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-700 mt-2">
                    <Button onClick={handleExportEquipments} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-5 py-2 text-sm font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2l2 3 2-3h2"></path><path d="M8 17h2l2-3 2 3h2"></path></svg>
                        Generar Archivo Excel
                    </Button>
                </div>
            </div>

        </div>
    );
};

export default ReportsPage;