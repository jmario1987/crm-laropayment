import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface AuditLog {
    userId: string;
    userName: string;
    action: 'CREAR' | 'EDITAR' | 'ELIMINAR' | 'REASIGNAR';
    module: string; // Ej: 'PROSPECTOS', 'USUARIOS'
    entityId: string;
    entityName: string;
    details: string;
    timestamp: string;
}

// Esta es la función mágica que llamaremos en cualquier parte del sistema
export const saveAuditLog = async (logData: AuditLog) => {
    try {
        await addDoc(collection(db, 'audit_logs'), logData);
    } catch (error) {
        console.error("Error silencioso en la bitácora:", error);
    }
};