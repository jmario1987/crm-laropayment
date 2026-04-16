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
  // --- NUEVO CAMPO: Para la inactivación lógica ("Soft Delete") ---
  isActive?: boolean; 
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

// --- NUEVO: Definición de Terminales (Moneda) ---
export interface Terminal {
  id: string;
  number: string;
  currency: 'CRC' | 'USD';
}

// --- NUEVO: Definición de Equipos (Datáfonos/Placas) ---
export interface Equipment {
  id: string;
  serie?: string; // <--- NUEVO CAMPO: Número de serie de fábrica
  placa: string;  // Viñeta de activo fijo
  sede?: string; // Opcional: Solo se usará en clientes como el INS o cajas
  terminals: Terminal[]; // Aquí guardaremos hasta 8 terminales por placa
}

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

  // --- NUEVOS CAMPOS: CO-PROPIEDAD Y REASIGNACIÓN ---
  creatorId?: string; // El vendedor original que trajo al cliente (SDR)
  reassignedAt?: string; // Fecha en que se pasó la batuta al Ejecutivo

  // --- CAMPOS OPCIONALES ---
  providerId: string | null; 
  productIds?: string[]; 
  tagIds?: string[];     
  statusHistory?: StatusHistoryEntry[];
  tagHistory?: TagHistoryEntry[];
  notificationForSeller?: boolean; 
  notificationForManagerId: string | null; 
  sellerHasViewedNotification?: boolean; 
  affiliateNumber: string | null; 
  billingHistory?: { [monthYear: string]: boolean };
  clientStatus: 'Activo' | 'Inactivo' | null; 
  _version?: number;
  assignedOffice: string | null; 
  
  // --- NUEVO: LISTA DE EQUIPOS (PLACAS Y TERMINALES) ---
  equipments?: Equipment[];

  // --- NUEVO: MONTOS DE FACTURACIÓN MULTIMONEDA ---
  billingAmounts?: { 
    [month: string]: { 
      montoCRC: number; 
      comisionCRC: number; 
      montoUSD: number; 
      comisionUSD: number; 
    } 
  };
};

// Definición del Producto
export interface Product {
  id: string;
  name: string;
  description: string;
}

// Definición del Proveedor (Desarrollador / Software)
export interface Provider {
  id: string;
  name: string;
  contactPerson: string;
  email: string | null; 
  phone: string | null; 
  // --- NUEVO CAMPO: Tipo de Software (Comercial / Propietario) ---
  softwareType?: string; 
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