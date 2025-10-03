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
  phone: string;
  status: LeadStatus;
  ownerId: string;
  observations: string;
  createdAt: string;
  lastUpdate: string;

  // --- CAMPOS OPCIONALES ---
  providerId?: string;
  productIds?: string[];
  tagIds?: string[];
  statusHistory?: StatusHistoryEntry[];
  tagHistory?: TagHistoryEntry[];
  notificationForSeller?: boolean;
  // --- LÍNEA CORREGIDA: AHORA PERMITE NULL ---
  notificationForManagerId?: string | null;
  sellerHasViewedNotification?: boolean;
  affiliateNumber?: string;
  billingHistory?: { [monthYear: string]: boolean };
  clientStatus?: 'Activo' | 'Inactivo';
  _version?: number;
};

// Definición del Producto
export interface Product {
  id: string;
  name: string;
  description: string;
}

// Definición del Proveedor
export interface Provider {
  id: string;
  name: string;
  contactPerson: string;
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