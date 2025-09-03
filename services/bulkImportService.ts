import * as XLSX from 'xlsx';
import { Lead, Stage, User, Product, Provider, USER_ROLES } from '../types';

// Encabezados para la primera hoja. Se mantiene igual.
const HEADERS = [
    "Nombre Completo",
    "Empresa",
    "Email",
    "Teléfono",
    "Etapa",
    "Vendedor (Email)",
    "Productos de Interés (nombres separados por coma)",
    "Referido por (nombre del proveedor)",
    "Observaciones"
];


// --- ESTA ES LA FUNCIÓN MODIFICADA ---
// Ahora acepta las listas de datos y genera un archivo con 4 hojas.
export const generateTemplate = (
    stages: Stage[],
    products: Product[],
    providers: Provider[]
) => {
    // 1. Hoja de Prospectos
    const wsProspectos = XLSX.utils.aoa_to_sheet([HEADERS]);

    // 2. Crear hoja para Etapas
    const stagesData = [
        ["Etapas Válidas"], // Encabezado para esta hoja
        ...stages.map(s => [s.name]) // Lista de nombres
    ];
    const wsEtapas = XLSX.utils.aoa_to_sheet(stagesData);

    // 3. Crear hoja para Productos
    const productsData = [
        ["Productos Válidos"],
        ...products.map(p => [p.name])
    ];
    const wsProductos = XLSX.utils.aoa_to_sheet(productsData);

    // 4. Crear hoja para Proveedores
    const providersData = [
        ["Proveedores Válidos"],
        ...providers.map(p => [p.name])
    ];
    const wsProveedores = XLSX.utils.aoa_to_sheet(providersData);

    // 5. Crear el libro de trabajo y añadir todas las hojas
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsProspectos, 'Prospectos');
    XLSX.utils.book_append_sheet(wb, wsEtapas, 'Etapas');
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');
    XLSX.utils.book_append_sheet(wb, wsProveedores, 'Proveedores');

    // 6. Descargar el archivo
    XLSX.writeFile(wb, 'plantilla_prospectos_con_guias.xlsx');
};


// --- ESTA FUNCIÓN SE MANTIENE 100% IGUAL. NO SE HA TOCADO SU LÓGICA ---
interface ValidationResult {
    validLeads: Lead[];
    erroredRows: { rowData: any, error: string }[];
}

export const parseAndValidateLeads = async (
    file: File,
    stages: Stage[],
    users: User[],
    products: Product[],
    providers: Provider[]
): Promise<ValidationResult> => {

    const fileBuffer = await file.arrayBuffer();
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const wsname = wb.SheetNames[0]; // Siempre lee la primera hoja
    const ws = wb.Sheets[wsname];
    const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const validLeads: Lead[] = [];
    const erroredRows: { rowData: any, error: string }[] = [];
    const sellers = users.filter(u => u.role === USER_ROLES.Vendedor);

    data.forEach((row: any, index: number) => {
        const rowNumber = index + 2;
        // Nota: Aseguramos que los nombres aquí coincidan exactamente con la constante HEADERS
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

        const stage = stages.find(s => s.name.toLowerCase() === stageName.toString().toLowerCase());
        if (!stage) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: La etapa "${stageName}" no es válida.` });
            return;
        }

        const owner = sellers.find(s => s.email.toLowerCase() === ownerEmail.toString().toLowerCase());
        if (!owner) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: El vendedor con email "${ownerEmail}" no fue encontrado o no tiene el rol de vendedor.` });
            return;
        }

        const productIds = productNames ? productNames.toString().split(',')
            .map((pn: string) => pn.trim())
            .map((pn: string) => products.find(p => p.name.toLowerCase() === pn.toLowerCase())?.id)
            .filter((id: string | undefined): id is string => !!id) : [];

        const provider = providerName ? providers.find(p => p.name.toLowerCase() === providerName.toString().toLowerCase()) : undefined;

        const newLead: Lead = {
            id: `${new Date().toISOString()}-${index}`,
            name: name.toString(),
            company: company.toString(),
            email: email.toString(),
            phone: phone.toString(),
            status: stage.id,
            createdAt: new Date().toISOString(),
            statusHistory: [{ status: stage.id, date: new Date().toISOString() }],
            ownerId: owner.id,
            productIds,
            providerId: provider?.id,
            observations: observations?.toString() || '',
            lastUpdate: new Date().toISOString(),
        };

        validLeads.push(newLead);
    });

    return { validLeads, erroredRows };
};