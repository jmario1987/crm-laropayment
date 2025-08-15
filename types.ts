// Definición de Roles de Usuario
export const USER_ROLES = {
  Admin: 'Administrador',
  Supervisor: 'Supervisor',
  Vendedor: 'Vendedor',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Definición del Usuario
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Definición del Estado del Prospecto (Etapa)
export type LeadStatus = string; // Usamos string para que sea flexible con los IDs de las etapas

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
  statusHistory: { status: LeadStatus; date: string }[];
  lastUpdate: string; // Propiedad que añadimos
};

// Definición del Producto
export interface Product {
  id: string;
  name: string;
  description: string;
}

// Definición del Proveedor (Referido)
export interface Provider {
  id: string;
  name: string;
  contact: string;
}

// Definición de la Etapa del Pipeline
export interface Stage {
  id: string;
  name: string;
  order: number;
  type: 'open' | 'won' | 'lost';
  color: string;
}