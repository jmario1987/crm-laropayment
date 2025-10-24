import React, { useState } from 'react';
import { useLeads } from '../../hooks/useLeads';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { generateTemplate, parseAndValidateLeads } from '../../services/bulkImportService';
import { Lead } from '../../types';
// --- AÑADIR ESTAS IMPORTACIONES ---
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ImportStep = 'initial' | 'processing' | 'preview' | 'done';

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
    const { dispatch, stages, users, products, providers } = useLeads();
    const [step, setStep] = useState<ImportStep>('initial');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [validLeads, setValidLeads] = useState<Lead[]>([]);
    const [erroredRows, setErroredRows] = useState<{ rowData: any, error: string }[]>([]);
    // --- AÑADIR ESTE ESTADO ---
    const [isImporting, setIsImporting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };
    
    const resetState = () => {
        setStep('initial');
        setSelectedFile(null);
        setValidLeads([]);
        setErroredRows([]);
        setIsImporting(false); // Asegúrate de resetear esto también
    }

    const handleClose = () => {
        resetState();
        onClose();
    }

    const handleProcessFile = async () => {
        if (!selectedFile) return;
        setStep('processing');
        try {
            const results = await parseAndValidateLeads(selectedFile, stages, users, products, providers);
            setValidLeads(results.validLeads);
            setErroredRows(results.erroredRows);
        } catch (err) {
            console.error(err);
            setErroredRows([{ rowData: {}, error: `Error inesperado al procesar el archivo. Verifique el formato e intente de nuevo.` }]);
        } finally {
            setStep('preview');
        }
    };
    
    // --- REEMPLAZAR ESTA FUNCIÓN ENTERA ---
    const handleConfirmImport = async () => {
        if (validLeads.length === 0 || isImporting) return;
        
        setIsImporting(true);
        try {
            // 1. Preparamos la colección de 'leads' en Firebase
            const leadsCollection = collection(db, 'leads');
            const newLeadsWithIds: Lead[] = [];

            // 2. Guardamos cada prospecto uno por uno y recolectamos sus nuevos IDs
            // (Usamos Promise.all para que se ejecuten en paralelo)
            await Promise.all(validLeads.map(async (lead) => {
                // El 'id' temporal que generó el servicio de importación no lo necesitamos
                const { id, ...leadData } = lead; 
                
                // 3. Guardamos en Firestore y obtenemos la referencia del nuevo documento
                const docRef = await addDoc(leadsCollection, leadData);
                
                // 4. Guardamos el prospecto con su ID real de Firebase
                newLeadsWithIds.push({ ...leadData, id: docRef.id } as Lead);
            }));

            // 5. ¡Éxito! Ahora SÍ actualizamos el estado local de React
            dispatch({ type: 'ADD_BULK_LEADS', payload: newLeadsWithIds });
            
            // 6. Y mostramos el mensaje de "hecho"
            setStep('done');

        } catch (error) {
            console.error("Error al guardar prospectos en Firebase: ", error);
            // Aquí deberías añadir un mensaje de error para el usuario
            alert("Error: No se pudieron guardar los prospectos. Revise la consola.");
        } finally {
            setIsImporting(false);
        }
    }

    const renderInitialStep = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Paso 1: Descargar Plantilla</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Descargue el archivo de Excel, llénelo con la información de sus prospectos y guárdelo en su computadora.</p>
                {/* --- LÍNEA CORREGIDA --- */}
                <Button onClick={() => generateTemplate(stages, products, providers)} variant="secondary" className="mt-3">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                     Descargar Plantilla
                </Button>
            </div>
             <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Paso 2: Subir Archivo</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Seleccione el archivo que acaba de completar.</p>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
            </div>
             <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                <Button onClick={handleProcessFile} disabled={!selectedFile}>
                    Procesar Archivo
                </Button>
            </div>
        </div>
    );
    
    const renderProcessingStep = () => (
        <div className="flex flex-col items-center justify-center h-48">
            <Spinner />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Procesando archivo, por favor espere...</p>
        </div>
    );
    
    const renderPreviewStep = () => (
         <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="p-4 rounded-md bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-blue-600">
                 <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Resultados del Análisis</h3>
                 <p className="text-sm text-blue-700 dark:text-blue-300">
                     Se encontraron <span className="font-bold">{validLeads.length}</span> prospectos válidos para importar.
                 </p>
                 {erroredRows.length > 0 && (
                     <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                         Se encontraron <span className="font-bold">{erroredRows.length}</span> filas con errores que serán ignoradas.
                     </p>
                 )}
            </div>
            
            {erroredRows.length > 0 && (
                <div>
                    <h4 className="text-md font-semibold text-red-600 dark:text-red-400 mb-2">Filas con Errores</h4>
                    <div className="overflow-x-auto border rounded-lg max-h-60">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Email</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Error</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800">
                                {erroredRows.map((item, index) => (
                                    <tr key={index} className="border-t dark:border-gray-700">
                                        <td className="px-4 py-2 text-gray-700 dark:text-gray-400 font-mono">{item.rowData['Email'] || 'N/A'}</td>
                                        <td className="px-4 py-2 text-red-600 dark:text-red-400">{item.error}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={resetState}>Empezar de Nuevo</Button>
                
                {/* --- ESTE ES EL BOTÓN MODIFICADO --- */}
                <Button onClick={handleConfirmImport} disabled={validLeads.length === 0 || isImporting}>
                    {isImporting ? <Spinner /> : `Importar ${validLeads.length} Prospecto(s)`}
                </Button>
            </div>
        </div>
    );
    
    const renderDoneStep = () => (
         <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
             <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">¡Importación Completada!</h3>
             <p className="text-gray-600 dark:text-gray-300">
                Se han añadido <span className="font-bold">{validLeads.length}</span> nuevos prospectos a su pipeline.
             </p>
             <div className="pt-4">
                 <Button onClick={handleClose}>Cerrar</Button>
             </div>
        </div>
    );
    
    const renderContent = () => {
        switch(step) {
            case 'initial': return renderInitialStep();
            case 'processing': return renderProcessingStep();
            case 'preview': return renderPreviewStep();
            case 'done': return renderDoneStep();
            default: return null;
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importación Masiva de Prospectos">
            {renderContent()}
        </Modal>
    );
};

export default BulkImportModal;