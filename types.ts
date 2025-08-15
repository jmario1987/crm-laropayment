// Definición de Roles de Usuario
export const USER_ROLES = {
  Admin: 'Administrador',
  Supervisor: 'Supervisor',
  Vendedor: 'Vendedor',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Definición del Usuario (con 'password' opcional para los formularios)
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // <-- CAMBIO: Añadido para el formulario de creación
}

// Definición del Estado del Prospecto (Etapa)
export type LeadStatus = string;

// Definición para una entrada en el historial de etapas
export type StatusHistoryEntry = {
  status: LeadStatus;
  date: string;
};

// Definición del Prospecto (Lead)
export type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  ownerId: string;
  productIds: string[];
  providerId?: string;
  observations: string;
  createdAt: string;
  statusHistory: StatusHistoryEntry[];
  lastUpdate: string;
};

// Definición del Producto
export interface Product {
  id: string;
  name: string;
  description: string;
}

// Definición del Proveedor (con 'contactPerson' en lugar de 'contact')
export interface Provider {
  id: string;
  name: string;
  contactPerson: string; // <-- CAMBIO: 'contact' se renombró a 'contactPerson'
}

// Definición de la Etapa del Pipeline
export interface Stage {
  id: string;
  name: string;
  order: number;
  type: 'open' | 'won' | 'lost';
  color: string;
}