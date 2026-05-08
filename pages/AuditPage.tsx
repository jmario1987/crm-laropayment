import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AuditLog } from '../services/audit';

const AuditPage: React.FC = () => {
    const [logs, setLogs] = useState<(AuditLog & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
                const querySnapshot = await getDocs(q);
                const logsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog & { id: string }));
                setLogs(logsData);
            } catch (error) {
                console.error("Error cargando bitácora:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    // --- FUNCIÓN PARA EXPORTAR A EXCEL (CSV) ---
    const exportToExcel = () => {
        // 1. Definimos los encabezados
        const headers = ['Fecha y Hora', 'Usuario', 'Acción', 'Módulo', 'Registro Afectado', 'Detalle de Cambios'];
        
        // 2. Mapeamos los datos
        const csvContent = logs.map(log => {
            const date = new Date(log.timestamp).toLocaleString();
            const user = log.userName;
            const action = log.action;
            const module = log.module;
            const entity = log.entityName.replace(/"/g, '""'); // Escapar comillas
            const details = log.details.replace(/"/g, '""').replace(/\n/g, ' '); 
            
            return `"${date}","${user}","${action}","${module}","${entity}","${details}"`;
        });

        // 3. Unimos todo
        csvContent.unshift(headers.join(','));
        // El \uFEFF fuerza a Excel a leer el archivo en UTF-8 (para que no rompa los acentos)
        const csvString = "\uFEFF" + csvContent.join('\n'); 
        
        // 4. Descargamos el archivo
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Bitacora_Cambios_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
        link.click();
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando bitácora de seguridad...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Bitácora de Cambios</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Registro de seguridad de los últimos 100 movimientos en el sistema.</p>
                        </div>
                    </div>

                    <button 
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Exportar a Excel
                    </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3">Fecha y Hora</th>
                                <th className="px-4 py-3">Usuario</th>
                                <th className="px-4 py-3">Acción</th>
                                <th className="px-4 py-3">Módulo</th>
                                <th className="px-4 py-3">Registro Afectado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">No hay registros de auditoría aún.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-600 dark:text-gray-300">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{log.userName}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${log.action === 'CREAR' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 font-medium text-xs tracking-wider">{log.module}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-gray-800 dark:text-white mb-0.5">{log.entityName}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 font-normal leading-relaxed">{log.details}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditPage;