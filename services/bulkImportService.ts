import * as XLSX from 'xlsx';
// Asegúrate que los tipos importados coincidan con tu archivo types.ts
import { Lead, Stage, User, Product, Provider, USER_ROLES } from '../types'; 

// Encabezados para la primera hoja.
const HEADERS = [
    "Nombre Completo",
    "Empresa",
    "Email",
    "Teléfono",
    "Etapa",
    "Vendedor (Email)",
    "Productos de Interés (nombres separados por coma)",
    "Referido por (nombre del proveedor)", // O Desarrollador
    "Observaciones"
];

// Generar plantilla (sin cambios)
export const generateTemplate = (
    stages: Stage[],
    products: Product[],
    providers: Provider[] // O Desarrolladores
) => {
    const wsProspectos = XLSX.utils.aoa_to_sheet([HEADERS]);
    const stagesData = [["Etapas Válidas"], ...stages.map(s => [s.name])];
    const wsEtapas = XLSX.utils.aoa_to_sheet(stagesData);
    const productsData = [["Productos Válidos"], ...products.map(p => [p.name])];
    const wsProductos = XLSX.utils.aoa_to_sheet(productsData);
    const providersData = [["Proveedores Válidos"], ...providers.map(p => [p.name])]; // O Desarrolladores
    const wsProveedores = XLSX.utils.aoa_to_sheet(providersData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsProspectos, 'Prospectos');
    XLSX.utils.book_append_sheet(wb, wsEtapas, 'Etapas');
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');
    XLSX.utils.book_append_sheet(wb, wsProveedores, 'Proveedores'); // O Desarrolladores

    XLSX.writeFile(wb, 'plantilla_prospectos_con_guias.xlsx');
};


interface ValidationResult {
    validLeads: Lead[];
    erroredRows: { rowData: any, error: string }[];
}

// Parsear y Validar Leads (con corrección en providerId)
export const parseAndValidateLeads = async (
    file: File,
    stages: Stage[],
    users: User[],
    products: Product[],
    providers: Provider[] // O Desarrolladores
): Promise<ValidationResult> => {

    const fileBuffer = await file.arrayBuffer();
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const wsname = wb.SheetNames[0]; 
    const ws = wb.Sheets[wsname];
    const data = XLSX.utils.sheet_to_json(ws, { defval: "" }); 

    const validLeads: Lead[] = [];
    const erroredRows: { rowData: any, error: string }[] = [];
    const sellers = users.filter(u => u.role === USER_ROLES.Vendedor);

    data.forEach((row: any, index: number) => {
        const rowNumber = index + 2;
        // Leer datos del Excel (usar String() para asegurar que sean texto o vacío)
        const name = String(row["Nombre Completo"] || '');
        const company = String(row["Empresa"] || '');
        const email = String(row["Email"] || '');
        const phone = String(row["Teléfono"] || ''); // phone es string obligatorio, "" si está vacío
        const stageName = String(row["Etapa"] || '');
        const ownerEmail = String(row["Vendedor (Email)"] || '');
        const productNames = String(row["Productos de Interés (nombres separados por coma)"] || '');
        const providerName = String(row["Referido por (nombre del proveedor)"] || ''); // O Desarrollador
        const observations = String(row["Observaciones"] || '');

        // Validaciones básicas
        if (!name || !company || !email || !stageName || !ownerEmail) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: Faltan datos obligatorios (Nombre, Empresa, Email, Etapa o Vendedor).` });
            return;
        }

        const stage = stages.find(s => s.name.toLowerCase() === stageName.toLowerCase());
        if (!stage) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: La etapa "${stageName}" no es válida.` });
            return;
        }

        const owner = sellers.find(s => s.email.toLowerCase() === ownerEmail.toLowerCase());
        if (!owner) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: El vendedor con email "${ownerEmail}" no fue encontrado o no tiene rol de vendedor.` });
            return;
        }

        const productIds = productNames ? productNames.split(',')
            .map(pn => pn.trim())
            .map(pn => products.find(p => p.name.toLowerCase() === pn.toLowerCase())?.id)
            .filter((id): id is string => !!id) : []; 

        const providerFound = providerName ? providers.find(p => p.name.toLowerCase() === providerName.toLowerCase()) : undefined;

        // --- CORRECCIÓN FINAL AL CREAR newLead ---
        const newLead: Lead = {
            id: `${new Date().toISOString()}-${index}`, 
            name: name,
            company: company,
            email: email,
            phone: phone, // Ya es string o ""
            status: stage.id,
            createdAt: new Date().toISOString(),
            ownerId: owner.id,
            observations: observations, 
            lastUpdate: new Date().toISOString(),
            
            // --- CORRECCIÓN AQUÍ: Usar || null ---
            providerId: providerFound?.id || null, // Guarda null si no se encuentra o no viene
            productIds: productIds.length > 0 ? productIds : undefined, 
            tagIds: undefined, 
            
            statusHistory: [{ status: stage.id, date: new Date().toISOString() }],
            tagHistory: undefined, 

            // Asegurar que los campos string | null tengan valor null por defecto
            affiliateNumber: null, 
            assignedOffice: null,
            notificationForManagerId: null, 
            clientStatus: null, // Asignar null por defecto

            // Booleanos opcionales pueden ser undefined
            notificationForSeller: undefined,
            sellerHasViewedNotification: undefined,
            billingHistory: undefined, // Objeto opcional
            _version: 1 
        };

        validLeads.push(newLead);
    });

    return { validLeads, erroredRows };
};