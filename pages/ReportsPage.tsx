import React, { useState, useMemo } from 'react';
import { useLeads } from '../hooks/useLeads';
import Button from '../components/ui/Button';
import * as XLSX from 'xlsx';

const ReportsPage: React.FC = () => {
    const { allLeads, stages, providers } = useLeads();

    // Identificamos automáticamente la etapa de "Ganado/Producción" para que sea el filtro por defecto
    const wonStageId = useMemo(() => stages.find(s => s.type === 'won')?.id || '', [stages]);

    // --- ESTADOS PARA LOS FILTROS ---
    const [filterStage, setFilterStage] = useState<string>(wonStageId);
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');
    const [filterOffice, setFilterOffice] = useState<string>('');
    const [filterCurrency, setFilterCurrency] = useState<'ALL' | 'CRC' | 'USD'>('ALL');
    const [filterProvider, setFilterProvider] = useState<string>('');

    // --- LÓGICA DE EXPORTACIÓN Y APLANAMIENTO ---
    const handleExportEquipments = () => {
        let filteredLeads = allLeads;

        // 1. Filtro por Etapa
        if (filterStage) {
            filteredLeads = filteredLeads.filter(lead => lead.status === filterStage);
        }

        // 2. Filtro por Rango de Fechas
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

        // 3. Filtro por Oficina Asignada (Búsqueda parcial de texto)
        if (filterOffice) {
            filteredLeads = filteredLeads.filter(lead => 
                lead.assignedOffice && lead.assignedOffice.toLowerCase().includes(filterOffice.toLowerCase())
            );
        }

        // 4. Filtro por Proveedor
        if (filterProvider) {
            filteredLeads = filteredLeads.filter(lead => lead.providerId === filterProvider);
        }

        // Variable para guardar las filas planas
        const exportData: any[] = [];

        // 5. El Algoritmo "Desdoblador"
        filteredLeads.forEach(lead => {
            if (lead.equipments && lead.equipments.length > 0) {
                lead.equipments.forEach(eq => {
                    if (eq.terminals && eq.terminals.length > 0) {
                        eq.terminals.forEach(term => {
                            // Filtro de Moneda (Actúa a nivel de terminal)
                            if (filterCurrency !== 'ALL' && term.currency !== filterCurrency) return;

                            exportData.push({
                                "Nombre del Comercio": lead.name,
                                "Número de Afiliado": lead.affiliateNumber || 'N/A',
                                "Oficina Asignada": lead.assignedOffice || 'N/A',
                                "Sede (Equipo)": eq.sede || 'N/A',
                                "Placa": eq.placa,
                                "Moneda": term.currency,
                                "Terminal": term.number,
                                "Fecha Ingreso CRM": new Date(lead.createdAt).toLocaleDateString()
                            });
                        });
                    } else {
                        // Si la placa no tiene terminales, la agregamos solo si buscan "Todas" las monedas
                        if (filterCurrency === 'ALL') {
                            exportData.push({
                                "Nombre del Comercio": lead.name,
                                "Número de Afiliado": lead.affiliateNumber || 'N/A',
                                "Oficina Asignada": lead.assignedOffice || 'N/A',
                                "Sede (Equipo)": eq.sede || 'N/A',
                                "Placa": eq.placa,
                                "Moneda": "Sin configurar",
                                "Terminal": "Sin configurar",
                                "Fecha Ingreso CRM": new Date(lead.createdAt).toLocaleDateString()
                            });
                        }
                    }
                });
            }
        });

        // Validamos si hay resultados
        if (exportData.length === 0) {
            alert("No se encontraron equipos ni terminales con los filtros seleccionados.");
            return;
        }

        // Generación del Excel
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        
        // Ajustar anchos de columnas para que se vea bonito en Excel
        worksheet['!cols'] = [
            { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, 
            { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 18 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, "Terminales");
        const today = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Reporte_Datáfonos_${today}.xlsx`);
    };

    const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm";
    const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1";

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4">
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reporte de Datáfonos y Terminales</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    Genera un archivo de Excel con una lista detallada de todas las placas y terminales físicas asociadas a tus clientes. Usa los filtros a continuación para segmentar la información antes de descargarla.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className={labelClass}>Etapa del Cliente</label>
                        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} className={inputClass}>
                            <option value="">Todas las etapas</option>
                            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Por defecto sugerimos filtrar solo los clientes ganados.</p>
                    </div>

                    <div>
                        <label className={labelClass}>Moneda de la Terminal</label>
                        <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value as any)} className={inputClass}>
                            <option value="ALL">Ambas (Colones y Dólares)</option>
                            <option value="CRC">Solo Colones (CRC)</option>
                            <option value="USD">Solo Dólares (USD)</option>
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Fecha de Ingreso al CRM (Desde)</label>
                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={inputClass} />
                    </div>
                    
                    <div>
                        <label className={labelClass}>Fecha de Ingreso al CRM (Hasta)</label>
                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>Oficina Asignada</label>
                        <input type="text" placeholder="Ej: Heredia, San José..." value={filterOffice} onChange={e => setFilterOffice(e.target.value)} className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>Origen / Proveedor</label>
                        <select value={filterProvider} onChange={e => setFilterProvider(e.target.value)} className={inputClass}>
                            <option value="">Todos los proveedores</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button onClick={handleExportEquipments} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6 py-2 text-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2l2 3 2-3h2"></path><path d="M8 17h2l2-3 2 3h2"></path></svg>
                        Generar Archivo Excel
                    </Button>
                </div>
            </div>

        </div>
    );
};

export default ReportsPage;