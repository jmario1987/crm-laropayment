import * as XLSX from 'xlsx';
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
    const providersData = [["Proveedores Válidos"], ...providers.map(p => [p.name])]; 
    const wsProveedores = XLSX.utils.aoa_to_sheet(providersData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsProspectos, 'Prospectos');
    XLSX.utils.book_append_sheet(wb, wsEtapas, 'Etapas');
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');
    XLSX.utils.book_append_sheet(wb, wsProveedores, 'Proveedores'); 

    XLSX.writeFile(wb, 'plantilla_prospectos_con_guias.xlsx');
};


interface ValidationResult {
    validLeads: Lead[];
    erroredRows: { rowData: any, error: string }[];
}

// Parsear y Validar Leads (con corrección final de 'undefined')
export const parseAndValidateLeads = async (
    file: File,
    stages: Stage[],
    users: User[],
    products: Product[],
    providers: Provider[] 
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
        const {
            "Nombre Completo": name,
            "Empresa": company,
            "Email": email,
            "Teléfono": phone,
            "Etapa": stageName,
            "Vendedor (Email)": ownerEmail,
            "Productos de Interés (nombres separados por coma)": productNames,
            "Referido por (nombre del proveedor)": providerName, 
            "Observaciones": observations,
        } = row;

        if (!name || !company || !email || !stageName || !ownerEmail) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: Faltan datos obligatorios (Nombre, Empresa, Email, Etapa o Vendedor).` });
            return;
        }

        const stage = stages.find(s => s.name.toLowerCase() === String(stageName).toLowerCase());
        if (!stage) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: La etapa "${stageName}" no es válida.` });
            return;
        }

        const owner = sellers.find(s => s.email.toLowerCase() === String(ownerEmail).toLowerCase());
        if (!owner) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: El vendedor con email "${ownerEmail}" no fue encontrado o no tiene rol de vendedor.` });
            return;
        }

        const productIds = productNames ? String(productNames).split(',')
            .map((pn: string) => pn.trim())
            .map((pn: string) => products.find(p => p.name.toLowerCase() === pn.toLowerCase())?.id)
            .filter((id): id is string => !!id) : []; 

        const providerFound = providerName ? providers.find(p => p.name.toLowerCase() === String(providerName).toLowerCase()) : undefined;

        // --- CORRECCIÓN DEFINITIVA AL CREAR newLead ---
        // Asignamos valores por defecto válidos (null, [], false) en lugar de undefined
        const newLead: Lead = {
            id: `${new Date().toISOString()}-${index}`, 
            name: String(name),
            company: String(company),
            email: String(email),
            phone: String(phone) || '', // phone es string obligatorio
            status: stage.id,
            createdAt: new Date().toISOString(),
            ownerId: owner.id,
            observations: String(observations) || '', 
            lastUpdate: new Date().toISOString(),
            
            // Campos que ahora son string | null
            providerId: providerFound?.id || null, 
            affiliateNumber: null, 
            assignedOffice: null,
            notificationForManagerId: null, 
            clientStatus: null, 
            
            // Campos que son arrays opcionales (usar [])
            productIds: productIds, // ya es [] si está vacío
            tagIds: [], // <-- Error de la captura
            tagHistory: [], // <-- Error futuro
            
            statusHistory: [{ status: stage.id, date: new Date().toISOString() }], // Siempre debe tener 1
            
            // Campos booleanos opcionales (usar false)
            notificationForSeller: false, 
            sellerHasViewedNotification: false, 
            
            _version: 1 
            // Omitimos billingHistory (opcional) para que no se envíe como undefined
        };

        validLeads.push(newLead);
    });

    return { validLeads, erroredRows };
};