import React from 'react';
import { Provider } from '../../types';

interface ProviderRowProps {
    provider: Provider;
    onEdit: (provider: Provider) => void;
    onDelete: (providerId: string) => void;
}

const ProviderRow: React.FC<ProviderRowProps> = ({ provider, onEdit, onDelete }) => (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{provider.name}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{provider.contactPerson}</td>
        
        {/* --- INICIO DE CÓDIGO AÑADIDO --- */}
        {/* Estos son los campos nuevos. Darán error hasta el siguiente paso. */}
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{provider.email}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{provider.phone}</td>
        {/* --- FIN DE CÓDIGO AÑADIDO --- */}
        
        <td className="px-6 py-4 text-right space-x-4">
            <button onClick={() => onEdit(provider)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Editar</button>
            <button onClick={() => onDelete(provider.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Eliminar</button>
        </td>
    </tr>
);

export default ProviderRow;