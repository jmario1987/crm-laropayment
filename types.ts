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
  password?: string;
  lastLogin?: string;
}

// Definición del Estado del Prospecto (Etapa)
export type LeadStatus = string;

// Definición para una entrada en el historial de etapas
export type StatusHistoryEntry = {
  status: LeadStatus;
  date: string;
};

// Definición para una entrada en el historial de sub-etapas
export type TagHistoryEntry = {
  tagId: string;
  date: string;
};

// Definición del Prospecto (Lead)
export type Lead = {
  // --- CAMPOS OBLIGATORIOS ---
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string; // Es string, no puede ser null/undefined
  status: LeadStatus;
  ownerId: string;
  observations: string;
  createdAt: string;
  lastUpdate: string;

  // --- CAMPOS OPCIONALES ---
  // Cambiamos los opcionales de texto a string | null para claridad con Firestore
  providerId: string | null; 
  productIds?: string[]; // Arrays pueden ser undefined o []
  tagIds?: string[];     // Arrays pueden ser undefined o []
  statusHistory?: StatusHistoryEntry[];
  tagHistory?: TagHistoryEntry[];
  notificationForSeller?: boolean; // Booleanos pueden ser undefined
  notificationForManagerId: string | null; // Ya estaba bien
  sellerHasViewedNotification?: boolean; // Booleanos pueden ser undefined
  affiliateNumber: string | null; 
  billingHistory?: { [monthYear: string]: boolean };
  clientStatus: 'Activo' | 'Inactivo' | null; // Permitir null
  _version?: number;
  // --- NUEVO CAMPO AÑADIDO CORRECTAMENTE ---
  assignedOffice: string | null; 
};

// Definición del Producto
export interface Product {
  id: string;
  name: string;
  description: string;
}

// Definición del Proveedor (Desarrollador)
export interface Provider {
  id: string;
  name: string;
  contactPerson: string;
  // Cambiamos opcionales de texto a string | null
  email: string | null; 
  phone: string | null; 
}

// Definición de la Etapa del Pipeline
export interface Stage {
  id: string;
  name: string;
  order: number;
  type: 'open' | 'won' | 'lost';
  color: string;
}

// Definición de la Etiqueta (Sub-Etapa)
export interface Tag {
  id: string;
  name: string;
  color: string;
  stageId: string;
}