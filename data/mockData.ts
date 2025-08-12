
import { Lead, User, UserRole, Product, Provider, Stage } from '../types';
import { USER_ROLES } from '../types';

export const initialRoles: UserRole[] = [
    USER_ROLES.Admin,
    USER_ROLES.Supervisor,
    USER_ROLES.Vendedor,
];

export const initialStages: Stage[] = [
    { id: 'stage-1', name: 'Nuevo', color: '#FB8500', type: 'open', order: 0 },
    { id: 'stage-2', name: 'Contactado', color: '#FFB703', type: 'open', order: 1 },
    { id: 'stage-3', name: 'Calificado', color: '#023047', type: 'open', order: 2 },
    { id: 'stage-4', name: 'Propuesta Enviada', color: '#219EBC', type: 'open', order: 3 },
    { id: 'stage-5', name: 'Ganado', color: '#8ECAE6', type: 'won', order: 4 },
    { id: 'stage-6', name: 'Perdido', color: '#ef4444', type: 'lost', order: 5 },
];

export const initialProducts: Product[] = [
    { id: 'prod-1', name: 'Terminal de Pago Estándar', description: 'Terminal de punto de venta para tarjetas de crédito y débito.' },
    { id: 'prod-2', name: 'Gateway de Pago Online', description: 'Integración para pagos en sitios web y aplicaciones.' },
    { id: 'prod-3', name: 'Solución de Pagos Móviles', description: 'Acepta pagos desde cualquier lugar con un dispositivo móvil.' },
];

export const initialProviders: Provider[] = [
    { id: 'prov-1', name: 'Alianza Digital', contactPerson: 'Mariana López' },
    { id: 'prov-2', name: 'Conexiones Web', contactPerson: 'Jorge Torres' },
    { id: 'prov-3', name: 'Marketing Solutions', contactPerson: 'Beatriz Solano' },
];

export const initialUsers: User[] = [
    { id: 'user-1', name: 'Ronny Rojas', email: 'admin@crm.com', password: 'password', role: USER_ROLES.Admin },
    { id: 'user-2', name: 'Randall Serrano', email: 'supervisor@crm.com', password: 'password', role: USER_ROLES.Supervisor },
    { id: 'user-3', name: 'Valeria Vendedor', email: 'vendedor1@crm.com', password: 'password', role: USER_ROLES.Vendedor },
    { id: 'user-4', name: 'Victor Vendedor', email: 'vendedor2@crm.com', password: 'password', role: USER_ROLES.Vendedor },
    { id: 'user-5', name: 'Carlos Vendedor', email: 'vendedor3@crm.com', password: 'password', role: USER_ROLES.Vendedor },
];

export const initialLeads: Lead[] = [
    { id: '1', name: 'Juan Pérez', company: 'Tech Solutions', email: 'juan.perez@techsolutions.com', phone: '555-1234', status: 'stage-1', createdAt: new Date().toISOString(), statusHistory: [{ status: 'stage-1', date: new Date().toISOString() }], ownerId: 'user-3', productIds: ['prod-1', 'prod-2'], providerId: 'prov-1', observations: 'Cliente muy interesado en la solución de Gateway de Pago. Preguntó por descuentos por volumen.' },
    { id: '2', name: 'Ana Gómez', company: 'Innovate Corp', email: 'ana.gomez@innovate.com', phone: '555-5678', status: 'stage-2', createdAt: new Date().toISOString(), statusHistory: [{ status: 'stage-2', date: new Date().toISOString() }], ownerId: 'user-3', productIds: ['prod-2'], observations: 'Primer contacto realizado. Se envió correo con información inicial. Pendiente agendar llamada.' },
    { id: '3', name: 'Carlos Sánchez', company: 'Data Systems', email: 'carlos.sanchez@datasys.com', phone: '555-8765', status: 'stage-3', createdAt: new Date().toISOString(), statusHistory: [{ status: 'stage-3', date: new Date().toISOString() }], ownerId: 'user-4', productIds: ['prod-3'], providerId: 'prov-2', observations: '' },
    { id: '4', name: 'Sofía Rodríguez', company: 'Marketing Digital Pro', email: 'sofia.r@mdpro.net', phone: '555-4321', status: 'stage-4', createdAt: new Date().toISOString(), statusHistory: [{ status: 'stage-4', date: new Date().toISOString() }], ownerId: 'user-4', productIds: ['prod-1'], observations: 'Propuesta enviada. Esperando respuesta para la próxima semana.' },
    { id: '5', name: 'Luis Martínez', company: 'Creative Agency', email: 'luis.m@creative.com', phone: '555-1122', status: 'stage-5', createdAt: new Date().toISOString(), statusHistory: [{ status: 'stage-5', date: new Date().toISOString() }], ownerId: 'user-3', productIds: ['prod-1', 'prod-3'], observations: 'Contrato firmado. Cliente satisfecho.' },
    { id: '6', name: 'Laura Fernández', company: 'Global Exports', email: 'laura.f@globalexports.com', phone: '555-3344', status: 'stage-6', createdAt: new Date().toISOString(), statusHistory: [{ status: 'stage-6', date: new Date().toISOString() }], ownerId: 'user-4', productIds: [], observations: 'El cliente eligió a la competencia por precio. Archivar.' }
];