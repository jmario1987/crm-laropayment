import React, { useMemo, useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { Lead, USER_ROLES } from '../types'; 
import * as XLSX from 'xlsx';
import Button from '../components/ui/Button';
import BillingModal from '../components/billing/BillingModal';
import { doc, updateDoc, writeBatch } from 'firebase/firestore'; 
import { db } from '../firebaseConfig'; 

type SortColumn = 'affiliateNumber' | 'name' | 'sellerName';
type SortDirection = 'asc' | 'desc';

const getCurrentMonthYear = () => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${year}`;
};

const WonLeadRow: React.FC<{ 
    lead: Lead; 
    sellerName?: string; 
    creatorName?: string; 
    onBillingClick: (lead: Lead) => void;
    isAdmin: boolean; 
    selectedMonth: string;
}> = ({ lead, sellerName, creatorName, onBillingClick, isAdmin, selectedMonth }) => { 
    
    const currentMonthBilled = lead.billingHistory?.[selectedMonth] === true;
    const currentAmounts = lead.billingAmounts?.[selectedMonth];

    return (
        <tr className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ${lead.clientStatus === 'Inactivo' ? 'opacity-50' : ''}`}>
            <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white">{lead.affiliateNumber || 'N/A'}</td>
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
            
            <td className="px-6 py-4">
                {creatorName && (
                    <div className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 mb-1 flex items-center gap-1.5" title="Creador (SDR)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        {creatorName} (SDR)
                    </div>
                )}
                <div className="font-medium text-gray-800 dark:text-gray-300 flex items-center gap-1.5" title={creatorName ? "Responsable Actual" : "Responsable"}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={creatorName ? "text-blue-500" : "text-gray-400"}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {sellerName || 'Sin asignar'}
                </div>
            </td>

            <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${lead.clientStatus === 'Inactivo' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {lead.clientStatus || 'Activo'}
                </span>
            </td>
            
            {isAdmin && (
                <>
                    <td className="px-6 py-4 text-center">
                        {currentMonthBilled ? (
                            <div className="flex flex-col items-center">
                                <span className="text-green-500 font-bold text-2xl leading-none">✓</span>
                                {currentAmounts && (
                                    <div className="flex flex-col items-center mt-1 space-y-1">
                                        {(currentAmounts.montoCRC > 0) && (
                                            <span className="text-[10px] text-gray-700 dark:text-gray-300 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-600" title="Ventas en Colones">
                                                {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(currentAmounts.montoCRC)}
                                            </span>
                                        )}
                                        {(currentAmounts.montoUSD > 0) && (
                                            <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800" title="Ventas en Dólares">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(currentAmounts.montoUSD)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-red-500 font-bold text-xl">×</span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <Button variant="icon" onClick={() => onBillingClick(lead)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </Button>
                    </td>
                </>
            )}
        </tr>
    );
};

const WonLeadsPage: React.FC = () => {
    const { allLeads, stages, getUserById, providers, getProviderById, dispatch, products } = useLeads();
    const { user } = useAuth();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProviderId, setSelectedProviderId] = useState('all');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());
    const [billingLead, setBillingLead] = useState<Lead | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [sortColumn, setSortColumn] = useState<SortColumn>('name'); 
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc'); 

    const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;
    const isAdmin = user?.role === USER_ROLES.Admin;

    const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name })), [products]);
    const sortedProviders = useMemo(() => [...providers].sort((a, b) => a.name.localeCompare(b.name)), [providers]);

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
            if (selectedProducts.length > 0) {
                 leads = leads.filter(lead => 
                    lead.productIds && lead.productIds.some(prodId => selectedProducts.includes(prodId))
                );
            }
        } else {
            leads = leads.filter(lead => 
                (lead.ownerId === user.id || lead.creatorId === user.id) && 
                lead.clientStatus !== 'Inactivo'
            );
        }

        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            leads = leads.filter(lead => 
                lead.name.toLowerCase().includes(lowerQuery) || 
                (lead.affiliateNumber && lead.affiliateNumber.toLowerCase().includes(lowerQuery))
            );
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
            if (valA < valB) comparison = -1;
            else if (valA > valB) comparison = 1;
            return sortDirection === 'desc' ? (comparison * -1) : comparison;
        });
        
        return leads;
    }, [allLeads, stages, user, selectedProviderId, includeInactive, sortColumn, sortDirection, getUserById, selectedProducts, searchQuery]); 
    
    const handleSaveBilling = async (updatedData: Partial<Lead>) => {
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                type MontosMoneda = { montoCRC: number, comisionCRC: number, montoUSD: number, comisionUSD: number };
                const facturadosExcel = new Map<string, MontosMoneda>();
                
                data.forEach((row: any) => {
                    if (row['Código afiliado']) {
                        const num = String(row['Código afiliado']).trim();
                        const codMoneda = String(row['Cod. moneda']).trim();
                        
                        const rawMonto = row['Monto'];
                        const rawComision = row['Comisión ADQ']; 
                        
                        const monto = typeof rawMonto === 'number' ? rawMonto : parseFloat(String(rawMonto).replace(/,/g, '')) || 0;
                        const comision = typeof rawComision === 'number' ? rawComision : parseFloat(String(rawComision).replace(/,/g, '')) || 0;

                        if (!facturadosExcel.has(num)) {
                            facturadosExcel.set(num, { montoCRC: 0, comisionCRC: 0, montoUSD: 0, comisionUSD: 0 });
                        }

                        const existing = facturadosExcel.get(num)!;
                        
                        if (codMoneda === '1') {
                            existing.montoCRC += monto;
                            existing.comisionCRC += comision;
                        } else if (codMoneda === '2') {
                            existing.montoUSD += monto;
                            existing.comisionUSD += comision;
                        }
                    }
                });

                const leadsFacturaron: { lead: Lead, montos: MontosMoneda }[] = [];
                const leadsNoFacturaron: Lead[] = [];
                const matchedKeys = new Set<string>();

                wonLeads.forEach(lead => {
                    let matchFound = false;
                    let acumuladoMonedas: MontosMoneda = { montoCRC: 0, comisionCRC: 0, montoUSD: 0, comisionUSD: 0 };

                    if (lead.affiliateNumber) {
                        const afiliadosDelCRM = lead.affiliateNumber.split(/[-/,]+/).map(n => n.trim()).filter(n => n !== '');
                        
                        afiliadosDelCRM.forEach(numCrm => {
                            if (facturadosExcel.has(numCrm)) {
                                matchFound = true;
                                matchedKeys.add(numCrm);
                                const datos = facturadosExcel.get(numCrm)!;
                                
                                acumuladoMonedas.montoCRC += datos.montoCRC;
                                acumuladoMonedas.comisionCRC += datos.comisionCRC;
                                acumuladoMonedas.montoUSD += datos.montoUSD;
                                acumuladoMonedas.comisionUSD += datos.comisionUSD;
                            }
                        });
                    }

                    if (matchFound) {
                        leadsFacturaron.push({ lead, montos: acumuladoMonedas });
                    } else {
                        leadsNoFacturaron.push(lead);
                    }
                });

                const huerfanos = Array.from(facturadosExcel.keys()).filter(k => !matchedKeys.has(k));

                const confirmMessage = `Resumen de lectura del archivo (${selectedMonth}):\n\n` +
                    `✅ ÉXITO: ${leadsFacturaron.length} de tus clientes facturaron.\n` +
                    `ℹ️ SIN MOVIMIENTOS: ${leadsNoFacturaron.length} de tus clientes no aparecen.\n` +
                    `⏭️ IGNORADOS: ${huerfanos.length} registros del Excel no te pertenecen.\n\n` +
                    `¿Deseas aplicar esta actualización en el sistema?`;

                if (window.confirm(confirmMessage)) {
                    const batch = writeBatch(db);

                    leadsFacturaron.forEach(({lead, montos}) => {
                        const leadRef = doc(db, 'leads', lead.id);
                        const newBillingHistory = { ...lead.billingHistory, [selectedMonth]: true };
                        const newBillingAmounts = { ...lead.billingAmounts, [selectedMonth]: montos };
                        
                        batch.update(leadRef, { 
                            billingHistory: newBillingHistory,
                            billingAmounts: newBillingAmounts
                        });

                        dispatch({ 
                            type: 'UPDATE_LEAD', 
                            payload: { ...lead, billingHistory: newBillingHistory, billingAmounts: newBillingAmounts } 
                        });
                    });

                    leadsNoFacturaron.forEach(lead => {
                        if (lead.billingHistory && lead.billingHistory[selectedMonth]) {
                            const leadRef = doc(db, 'leads', lead.id);
                            const newBillingHistory = { ...lead.billingHistory };
                            delete newBillingHistory[selectedMonth];
                            
                            const newBillingAmounts = { ...lead.billingAmounts };
                            delete newBillingAmounts[selectedMonth];

                            batch.update(leadRef, { 
                                billingHistory: newBillingHistory,
                                billingAmounts: newBillingAmounts
                            });
                            dispatch({ 
                                type: 'UPDATE_LEAD', 
                                payload: { ...lead, billingHistory: newBillingHistory, billingAmounts: newBillingAmounts } 
                            });
                        }
                    });

                    await batch.commit();
                    alert(`¡Facturación de ${selectedMonth} guardada exitosamente!`);
                }

            } catch (error) {
                console.error("Error procesando Excel:", error);
                alert("Hubo un error al procesar el Excel. Revisa el archivo.");
            } finally {
                setIsUploading(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    const getProductNames = (productIds?: string[]): string => {
        if (!productIds || productIds.length === 0) return 'N/A';
        return productIds
            .map(id => products.find(p => p.id === id)?.name)
            .filter((name): name is string => name !== undefined)
            .join(', ');
    };

    // --- FORMATEO EXCEL: Función para aplicar anchos y formatos de moneda ---
    const formatExcelSheet = (worksheet: XLSX.WorkSheet, dataToExport: any[], isFugaReport: boolean = false) => {
        // 1. Ajuste automático de anchos de columna
        const colWidths = Object.keys(dataToExport[0] || {}).map(key => {
            let maxLen = key.length;
            dataToExport.forEach(row => {
                const val = row[key];
                if (val !== undefined && val !== null) {
                    const strVal = String(val);
                    if (strVal.length > maxLen) maxLen = strVal.length;
                }
            });
            return { wch: Math.min(Math.max(maxLen + 2, 12), 40) }; // Mínimo 12, Máximo 40 caracteres
        });
        worksheet['!cols'] = colWidths;

        // 2. Aplicar formato de moneda a las columnas numéricas
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        
        // Formato para Colones: Ej. ₡1,234.00 
        // Formato para Dólares: Ej. $1,234.00
        const crcFormat = '"₡"#,##0.00';
        const usdFormat = '"$"#,##0.00';

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = {c: C, r: R};
                const cellRef = XLSX.utils.encode_cell(cellAddress);
                const cell = worksheet[cellRef];

                if (!cell || R === 0) continue; // Saltar celdas vacías y la fila de encabezados

                const header = dataToExport[0] ? Object.keys(dataToExport[0])[C] : '';

                if (typeof cell.v === 'number') {
                    if (header.includes('(CRC)') || header.includes('CRC (')) {
                        cell.z = crcFormat;
                    } else if (header.includes('(USD)') || header.includes('USD (')) {
                        cell.z = usdFormat;
                    }
                }
            }
        }
    };

    const handleExportExcel = () => {
        const dataToExport = wonLeads.map(lead => {
            const montosDelMes = lead.billingAmounts?.[selectedMonth] || { montoCRC: 0, comisionCRC: 0, montoUSD: 0, comisionUSD: 0 };
            const creatorName = lead.creatorId && lead.creatorId !== lead.ownerId ? getUserById(lead.creatorId)?.name : null;
            
            const baseRow: any = {
                'Nº Afiliado': lead.affiliateNumber || 'N/A',
                'Nombre Cliente': lead.name,
                'Empresa': lead.company || 'N/A',
                'SDR (Creador)': creatorName || '-', 
                'Vendedor Asignado': getUserById(lead.ownerId)?.name || 'N/A',
                'Productos': getProductNames(lead.productIds),
                'Referido por': getProviderById(lead.providerId || '')?.name || 'N/A',
            };

            if (isAdmin) {
                baseRow['Monto (CRC)'] = montosDelMes.montoCRC || 0;
                baseRow['Comisión (CRC)'] = montosDelMes.comisionCRC || 0;
                baseRow['Monto (USD)'] = montosDelMes.montoUSD || 0;
                baseRow['Comisión (USD)'] = montosDelMes.comisionUSD || 0;
            }
            return baseRow;
        });
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        formatExcelSheet(worksheet, dataToExport); // Llamamos la nueva función de formato

        const workbook = XLSX.utils.book_new();
        const sheetName = isAdmin ? `Comisiones ${selectedMonth}` : 'Clientes Activos';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, isAdmin ? `Reporte_Comisiones_${selectedMonth}.xlsx` : 'Reporte_Clientes_Produccion.xlsx');
    };

    const getPreviousMonthStr = (monthYearStr: string, offset: number) => {
        const [m, y] = monthYearStr.split('-');
        let date = new Date(parseInt(y), parseInt(m) - 1, 15);
        date.setMonth(date.getMonth() - offset);
        const prevM = String(date.getMonth() + 1).padStart(2, '0');
        const prevY = date.getFullYear();
        return `${prevM}-${prevY}`;
    };

    const handleExportFugas = () => {
        const prev1Month = getPreviousMonthStr(selectedMonth, 1);
        const prev2Month = getPreviousMonthStr(selectedMonth, 2);

        const fugasLeads = wonLeads.filter(lead => !lead.billingHistory?.[selectedMonth]);

        if (fugasLeads.length === 0) {
            alert(`No hay comercios en 0 para el mes de ${selectedMonth}. ¡Excelente trabajo!`);
            return;
        }

        const dataToExport = fugasLeads.map(lead => {
            const montosMesActual = lead.billingAmounts?.[selectedMonth] || { montoCRC: 0, montoUSD: 0 };
            const montosMes1 = lead.billingAmounts?.[prev1Month] || { montoCRC: 0, montoUSD: 0 };
            const montosMes2 = lead.billingAmounts?.[prev2Month] || { montoCRC: 0, montoUSD: 0 };
            
            const totalActual = montosMesActual.montoCRC + (montosMesActual.montoUSD * 510); 
            const totalPrev1 = montosMes1.montoCRC + (montosMes1.montoUSD * 510);
            const totalPrev2 = montosMes2.montoCRC + (montosMes2.montoUSD * 510);

            let alerta = 'Inactivo Histórico';
            if (totalPrev1 > 0 && totalPrev2 > 0) alerta = '🚨 FUGA CRÍTICA (Venía activo 2 meses)';
            else if (totalPrev1 > 0) alerta = '⚠️ ALERTA (Cayó este mes)';
            else if (totalPrev2 > 0) alerta = '⚠️ ALERTA (Cayó hace 2 meses)';

            return {
                'Nº Afiliado': lead.affiliateNumber || 'N/A',
                'Nombre Cliente': lead.name,
                'Vendedor Asignado': getUserById(lead.ownerId)?.name || 'N/A',
                'Estado de Alerta': alerta,
                [`CRC (${selectedMonth})`]: montosMesActual.montoCRC,
                [`USD (${selectedMonth})`]: montosMesActual.montoUSD,
                [`CRC (${prev1Month})`]: montosMes1.montoCRC,
                [`USD (${prev1Month})`]: montosMes1.montoUSD,
                [`CRC (${prev2Month})`]: montosMes2.montoCRC,
                [`USD (${prev2Month})`]: montosMes2.montoUSD,
            };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        formatExcelSheet(worksheet, dataToExport, true); // Llamamos la nueva función de formato

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Alertas de Fuga');
        XLSX.writeFile(workbook, `Reporte_Fugas_${selectedMonth}.xlsx`);
    };

    const monthOptions = useMemo(() => {
        const options = [];
        let date = new Date();
        date.setDate(15); 
        
        const targetYear = 2025;
        const targetMonthIndex = 8; 

        while (date.getFullYear() > targetYear || (date.getFullYear() === targetYear && date.getMonth() >= targetMonthIndex)) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            options.push(`${month}-${year}`);
            date.setMonth(date.getMonth() - 1);
        }
        return options;
    }, []);

    const handleSort = (column: SortColumn) => {
        if (column === sortColumn) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const renderSortArrow = (column: SortColumn) => {
        if (column !== sortColumn) return null; 
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                
                <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6 w-full">
                    
                    <div className="flex flex-wrap gap-3 items-center flex-1">
                        <div className="w-full sm:w-auto min-w-[250px] relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full py-2 pl-10 pr-3 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                placeholder="Buscar comercio o N° afiliado..." 
                            />
                        </div>

                        {isManager && (
                            <>
                                {isAdmin && (
                                    <div className="w-full sm:w-auto min-w-[200px]">
                                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            {monthOptions.map(m => <option key={m} value={m}>Facturación de {m}</option>)}
                                        </select>
                                    </div>
                                )}
                                
                                <div className="w-full sm:w-auto min-w-[220px]">
                                    <select value={selectedProviderId} onChange={(e) => setSelectedProviderId(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="all">Todos los Desarrolladores</option> 
                                        {sortedProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                
                                <div className="w-full sm:w-auto min-w-[200px]">
                                    <select 
                                        value={selectedProducts[0] || 'all'} 
                                        onChange={(e) => setSelectedProducts(e.target.value === 'all' ? [] : [e.target.value])} 
                                        className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="all">Todos los Productos</option>
                                        {productOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                                
                                <div className="flex items-center whitespace-nowrap bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-600">
                                    <input type="checkbox" id="include-inactive" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"/>
                                    <label htmlFor="include-inactive" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Incluir Inactivos</label>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3 items-center lg:justify-end">
                        {isManager && isAdmin && (
                            <>
                                <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center shadow-sm whitespace-nowrap h-[38px]">
                                    {isUploading ? 'Leyendo...' : 'Importar Archivo'}
                                    <input 
                                        type="file" 
                                        accept=".xlsx, .xls, .csv" 
                                        className="hidden" 
                                        onChange={handleFileUpload} 
                                        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                                        disabled={isUploading}
                                    />
                                </label>
                                
                                <button 
                                    onClick={handleExportFugas} 
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center shadow-sm whitespace-nowrap h-[38px]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                    Alertas de Fuga
                                </button>
                            </>
                        )}
                        <Button onClick={handleExportExcel} className="whitespace-nowrap px-4 py-2 h-[38px]">
                            Reporte General
                        </Button>
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
                                <th scope="col" className="px-6 py-3">
                                    <button 
                                        onClick={() => handleSort('name')} 
                                        className="font-bold hover:text-primary-600 dark:hover:text-primary-400"
                                    >
                                        Nombre{renderSortArrow('name')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3">Responsable / Origen</th>
                                <th scope="col" className="px-6 py-3">Estado Cliente</th>
                                
                                {isAdmin && (
                                    <>
                                        <th scope="col" className="px-6 py-3 text-center">Facturación ({selectedMonth})</th>
                                        <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {wonLeads.map(lead => {
                                const seller = getUserById(lead.ownerId);
                                const creator = lead.creatorId && lead.creatorId !== lead.ownerId ? getUserById(lead.creatorId) : null;
                                return <WonLeadRow 
                                            key={lead.id} 
                                            lead={lead} 
                                            sellerName={seller?.name} 
                                            creatorName={creator?.name}
                                            onBillingClick={setBillingLead} 
                                            isAdmin={isAdmin} 
                                            selectedMonth={selectedMonth} 
                                        />;
                            })}
                            {wonLeads.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 4} className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron resultados para tu búsqueda.
                                    </td>
                                </tr>
                            )}
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