
import * as XLSX from 'xlsx';
import { Lead, Stage, User, Product, Provider, USER_ROLES } from '../types';

const HEADERS = [
    "Nombre Completo",
    "Empresa",
    "Email",
    "Teléfono",
    "Etapa",
    "Vendedor Asignado (Email)",
    "Productos de Interés (nombres separados por coma)",
    "Referido por (nombre del proveedor)",
    "Observaciones"
];

export const generateTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prospectos');
    XLSX.writeFile(wb, 'plantilla_prospectos.xlsx');
};

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
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const validLeads: Lead[] = [];
    const erroredRows: { rowData: any, error: string }[] = [];
    const sellers = users.filter(u => u.role === USER_ROLES.Vendedor);

    data.forEach((row: any, index: number) => {
        const rowNumber = index + 2; // +1 for header, +1 for 0-index
        const {
            "Nombre Completo": name,
            "Empresa": company,
            "Email": email,
            "Teléfono": phone,
            "Etapa": stageName,
            "Vendedor Asignado (Email)": ownerEmail,
            "Productos de Interés (nombres separados por coma)": productNames,
            "Referido por (nombre del proveedor)": providerName,
            "Observaciones": observations,
        } = row;

        // Basic validation
        if (!name || !company || !email || !stageName || !ownerEmail) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: Faltan datos obligatorios (Nombre, Empresa, Email, Etapa o Vendedor).` });
            return;
        }

        // Validate and find Stage
        const stage = stages.find(s => s.name.toLowerCase() === stageName.toString().toLowerCase());
        if (!stage) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: La etapa "${stageName}" no es válida.` });
            return;
        }

        // Validate and find Owner
        const owner = sellers.find(s => s.email.toLowerCase() === ownerEmail.toString().toLowerCase());
        if (!owner) {
            erroredRows.push({ rowData: row, error: `Fila ${rowNumber}: El vendedor con email "${ownerEmail}" no fue encontrado o no tiene el rol de vendedor.` });
            return;
        }

        // Find product IDs
        const productIds = productNames ? productNames.toString().split(',')
            .map((pn: string) => pn.trim())
            .map((pn: string) => products.find(p => p.name.toLowerCase() === pn.toLowerCase())?.id)
            .filter((id: string | undefined): id is string => !!id) : [];

        // Find provider ID
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
        };

        validLeads.push(newLead);
    });

    return { validLeads, erroredRows };
};
