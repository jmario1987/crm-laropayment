// data/mockData.ts (Versión para Pruebas)

import { Lead, User, UserRole, Product, Provider, Stage, USER_ROLES } from '../types';

export const initialRoles: UserRole[] = [USER_ROLES.Admin, USER_ROLES.Supervisor, USER_ROLES.Vendedor];

export const initialProducts: Product[] = [
  { id: 'prod1', name: 'Servicio de Pago Recurrente', description: 'Solución para suscripciones y membresías.' },
  { id: 'prod2', name: 'Terminal Punto de Venta (POS)', description: 'Hardware y software para transacciones en persona.' },
  { id: 'prod3', name: 'Gateway de Pago Online', description: 'Integración para e-commerce y pagos en línea.' },
];

export const initialProviders: Provider[] = [
  { id: 'prov1', name: 'Referido Interno', contactPerson: 'N/A' },
  { id: 'prov2', name: 'Campaña de Marketing Digital', contactPerson: 'Agencia Creativa' },
  { id: 'prov3', name: 'Alianza Estratégica TechCorp', contactPerson: 'Ana Rodriguez' },
];

export const initialUsers: User[] = [
  { id: 'admin01', name: 'Admin Laro', email: 'admin@laro.com', role: USER_ROLES.Admin, password: 'password123' },
  { id: 'supervisor01', name: 'Sofia Vergara', email: 'sofia.v@laro.com', role: USER_ROLES.Supervisor, password: 'password123' },
  { id: 'vendedor01', name: 'Juan Perez', email: 'juan.p@laro.com', role: USER_ROLES.Vendedor, password: 'password123' },
  { id: 'vendedor02', name: 'Maria Lopez', email: 'maria.l@laro.com', role: USER_ROLES.Vendedor, password: 'password123' },
  { id: 'vendedor03', name: 'Carlos Gomez', email: 'carlos.g@laro.com', role: USER_ROLES.Vendedor, password: 'password123' },
];

const today = new Date().toISOString();
// --- FECHA ANTIGUA PARA LA PRUEBA ---
// Creamos una fecha de hace 14 días para simular un prospecto estancado.
const oldDate = new Date();
oldDate.setDate(oldDate.getDate() - 14);
const fourteenDaysAgo = oldDate.toISOString();

export const initialLeads: Lead[] = [
  // --- CAMBIO CLAVE AQUÍ ---
  // Este prospecto ahora tiene una fecha de última actualización de hace 14 días.
  { id: 'lead01', name: 'Empresa ABC', company: 'ABC Inc.', email: 'contacto@abc.com', phone: '12345678', status: 'stage1', createdAt: fourteenDaysAgo, statusHistory: [{ status: 'stage1', date: fourteenDaysAgo }], ownerId: 'vendedor01', productIds: ['prod1', 'prod3'], providerId: 'prov2', observations: 'Mostraron mucho interés en el gateway.', lastUpdate: fourteenDaysAgo },
  
  // El resto de los prospectos se mantienen con la fecha de hoy.
  { id: 'lead02', name: 'Tienda XYZ', company: 'XYZ Retail', email: 'info@xyz.com', phone: '87654321', status: 'stage2', createdAt: today, statusHistory: [{ status: 'stage1', date: today }, { status: 'stage2', date: today }], ownerId: 'vendedor02', productIds: ['prod2'], observations: 'Necesitan una demo del POS.', lastUpdate: today },
  { id: 'lead03', name: 'Gimnasio FitnessPro', company: 'FitnessPro Gym', email: 'gerencia@fitness.com', phone: '11223344', status: 'stage3', createdAt: today, statusHistory: [{ status: 'stage1', date: today }, { status: 'stage2', date: today }, { status: 'stage3', date: today }], ownerId: 'vendedor01', productIds: ['prod1'], providerId: 'prov3', observations: 'Cotización enviada. Esperando respuesta.', lastUpdate: today },
  { id: 'lead04', name: 'Consultores Tech', company: 'Tech Solutions', email: 'consultas@tech.com', phone: '44332211', status: 'stage1', createdAt: today, statusHistory: [{ status: 'stage1', date: today }], ownerId: 'vendedor02', productIds: ['prod3'], observations: 'Primer contacto realizado.', lastUpdate: today },
  { id: 'lead05', name: 'E-commerce ModaHoy', company: 'ModaHoy Online', email: 'soporte@modahoy.com', phone: '55667788', status: 'stage4', createdAt: today, statusHistory: [{ status: 'stage1', date: today }, { status: 'stage2', date: today }, { status: 'stage3', date: today }, { status: 'stage4', date: today }], ownerId: 'vendedor03', productIds: ['prod3'], observations: 'Negociación final. A punto de cerrar.', lastUpdate: today },
  { id: 'lead06', name: 'Restaurante SaborLocal', company: 'SaborLocal', email: 'admin@saborlocal.com', phone: '99887766', status: 'stage5', createdAt: today, statusHistory: [{ status: 'stage1', date: today }, { status: 'stage5', date: today }], ownerId: 'vendedor03', productIds: [], observations: 'Cliente no interesado por el momento.', lastUpdate: today },
];

export const initialStages: Stage[] = [
  { id: 'stage1', name: 'Nuevo Prospecto', order: 1, type: 'open', color: '#3B82F6' },
  { id: 'stage2', name: 'Contactado', order: 2, type: 'open', color: '#10B981' },
  { id: 'stage3', name: 'Propuesta Enviada', order: 3, type: 'open', color: '#F59E0B' },
  { id: 'stage4', name: 'Negociación', order: 4, type: 'open', color: '#8B5CF6' },
  { id: 'stage5', name: 'Perdido', order: 5, type: 'lost', color: '#EF4444' },
  { id: 'stage6', name: 'Ganado', order: 6, type: 'won', color: '#22C55E' },
];
