import * as XLSX from 'xlsx';
import { Lead, Stage, User, Product, Provider, USER_ROLES, Tag } from '../types';

// Encabezados para la primera hoja. 
const HEADERS = [
    "Nombre Completo",
    "Empresa",
    "Email",
    "Teléfono",
    "Etapa",
    "Sub-Etapa",
    "Asignado a (Email)", // <-- CAMBIO 1: Nombre de la columna más general
    "Productos de Interés (nombres separados por coma)",
    "Referido por (nombre del proveedor)", 
    "Número de Afiliado",
    "Fecha Histórica (YYYY-MM-DD)",
    "Observaciones"
];

// Generar plantilla 
export const generateTemplate = (
    stages: Stage[],
    products: Product[],
    providers: Provider[],
    tags: Tag[] 
) => {
    const wsProspectos = XLSX.utils.aoa_to_sheet([HEADERS]);
    const stagesData = [["Etapas Válidas"], ...stages.map(s => [s.name])];
    const wsEtapas = XLSX.utils.aoa_to_sheet(stagesData);
    const productsData = [["Productos Válidos"], ...products.map(p => [p.name])];
    const wsProductos = XLSX.utils.aoa_to_sheet(productsData);
    const providersData = [["Proveedores Válidos"], ...providers.map(p => [p.name])]; 
    const wsProveedores = XLSX.utils.aoa_to_sheet(providersData);
    
    // Pestaña de guía para las Sub-Etapas
    const tagsData = [["Sub-Etapas Válidas"], ...tags.map(t => [t.name])];
    const wsTags = XLSX.utils.aoa_to_sheet(tagsData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsProspectos, 'Prospectos');
    XLSX.utils.book_append_sheet(wb, wsEtapas, 'Etapas');
    XLSX.utils.book_append_sheet(wb, wsTags, 'Sub-Etapas');
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');
    XLSX.utils.book_append_sheet(wb, wsProveedores, 'Proveedores'); 

    XLSX.writeFile(wb, 'plantilla_prospectos_con_guias.xlsx');
};

interface ValidationResult {
    validLeads: Lead[];
    erroredRows: { rowData: any, error: string }[];
}

// Parsear y Validar Leads 
export const parseAndValidateLeads = async (
    file: File,
    stages: Stage[],
    users: User[],
    products: Product[],
    providers: Provider[],
    tags: Tag[] 
): Promise<ValidationResult> => {

    const fileBuffer = await file.arrayBuffer();
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const wsname = wb.SheetNames[0]; 
    const ws = wb.Sheets[wsname];
    const data = XLSX.utils.sheet_to_json(ws, { defval: "" }); 

    const validLeads: Lead[] = [];
    const erroredRows: { rowData: any, error: string }[] = [];
    
    // <-- CAMBIO 2: Eliminamos la línea que filtraba (const sellers = ...)

    data.forEach((row: any, index: number) => {
        const rowNumber = index + 2;
        const {
            "Nombre Completo": name,
            "Empresa": company,
            "Email": email,
            "Teléfono": phone,
            "Etapa": stageName,
            "Sub-Etapa": tagName, 
            "Asignado a (Email)": ownerEmail, // <-- Reflejamos el cambio de nombre
            "Productos de Interés (nombres separados por coma)": productNames,
            "Referido por (nombre del proveedor)": providerName, 
            "Número de Afiliado": affiliateNumber, 
            "Fecha Histórica (YYYY-MM-DD)": historicalDate, 
            "Observaciones": observations,
        } = row;

        if (!name || !company || !email || !stageName || !ownerEmail) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: Faltan datos obligatorios.` });
            return;
        }

        const stage = stages.find(s => s.name.toLowerCase() === String(stageName).toLowerCase());
        if (!stage) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: La etapa "${stageName}" no es válida.` });
            return;
        }

        // <-- CAMBIO 3: Ahora buscamos en la lista completa de 'users', sin importar su rol
        const owner = users.find(u => u.email.toLowerCase() === String(ownerEmail).toLowerCase());
        if (!owner) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: Usuario asignado no encontrado.` });
            return;
        }

        const productIds = productNames ? String(productNames).split(',')
            .map((pn: string) => pn.trim())
            .map((pn: string) => products.find(p => p.name.toLowerCase() === pn.toLowerCase())?.id)
            .filter((id): id is string => !!id) : []; 

        const providerFound = providerName ? providers.find(p => p.name.toLowerCase() === String(providerName).toLowerCase()) : undefined;

        // LÓGICA DE LA FECHA HISTÓRICA
        let baseDate = new Date().toISOString();
        if (historicalDate) {
            let parsedDate;
            if (typeof historicalDate === 'number') {
                parsedDate = new Date(Math.round((historicalDate - 25569) * 86400 * 1000));
            } else {
                parsedDate = new Date(historicalDate);
            }
            if (!isNaN(parsedDate.getTime())) {
                baseDate = parsedDate.toISOString();
            }
        }

        // LÓGICA DE SUB-ETAPA
        let tagIds: string[] = [];
        let tagHistory: { tagId: string, date: string }[] = [];
        
        if (tagName && stage.type !== 'won' && stage.type !== 'lost') {
            const tagFound = tags.find(t => t.name.toLowerCase() === String(tagName).toLowerCase());
            if (tagFound) {
                tagIds = [tagFound.id];
                tagHistory = [{ tagId: tagFound.id, date: baseDate }]; 
            }
        }

        const newLead: Lead = {
            id: `${new Date().toISOString()}-${index}`, 
            name: String(name),
            company: String(company),
            email: String(email),
            phone: String(phone) || '', 
            status: stage.id,
            createdAt: baseDate, 
            lastUpdate: baseDate,
            
            ownerId: owner.id, // <-- Ahora puede ser el ID del Administrador
            observations: String(observations) || '', 
            
            providerId: providerFound?.id || null, 
            affiliateNumber: affiliateNumber ? String(affiliateNumber) : null, 
            
            assignedOffice: null,
            notificationForManagerId: null, 
            clientStatus: stage.type === 'won' ? 'Activo' : null, 
            
            productIds: productIds, 
            tagIds: tagIds, 
            tagHistory: tagHistory, 
            
            statusHistory: [{ status: stage.id, date: baseDate }], 
            
            notificationForSeller: false, 
            sellerHasViewedNotification: false, 
            _version: 1 
        };

        validLeads.push(newLead);
    });

    return { validLeads, erroredRows };
};