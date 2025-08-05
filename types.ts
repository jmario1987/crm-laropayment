
export const USER_ROLES = {
  Admin: 'Administrador',
  Supervisor: 'Supervisor de Ventas',
  Vendedor: 'Vendedor',
};

export type LeadStatus = string; // Ahora es un alias para el ID de la etapa (string)

export interface Stage {
  id: string;
  name: string;
  color: string;
  type: 'open' | 'won' | 'lost';
  order: number;
}

export type UserRole = string;

export interface Product {
  id: string;
  name: string;
  description: string;
}

export interface Provider {
  id: string;
  name: string;
  contactPerson: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  lastLogin?: string;
}

export interface StatusHistoryEntry {
  status: LeadStatus;
  date: string;
}

export interface Lead {
  id:string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  createdAt: string;
  statusHistory: StatusHistoryEntry[];
  ownerId: string;
  productIds: string[];
  providerId?: string;
  observations?: string;
}