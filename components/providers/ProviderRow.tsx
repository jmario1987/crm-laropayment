import React from 'react';
import { Provider } from '../../types';

interface ProviderRowProps {
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onDelete: (id: string) => void;
}

const ProviderRow: React.FC<ProviderRowProps> = ({ provider, onEdit, onDelete }) => {
  return (
    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150 ease-in-out">
      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
        {provider.name}
      </td>
      {/* --- NUEVA CELDA CON ESTILO PARA EL TIPO DE SOFTWARE --- */}
      <td className="px-6 py-4">
        {provider.softwareType ? (
            <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${
                provider.softwareType === 'Comercial' 
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
            }`}>
                {provider.softwareType}
            </span>
        ) : (
            <span className="text-gray-400 italic">No definido</span>
        )}
      </td>
      <td className="px-6 py-4">
        {provider.contactPerson}
      </td>
      <td className="px-6 py-4">
        {provider.email || 'N/A'}
      </td>
      <td className="px-6 py-4">
        {provider.phone || 'N/A'}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onEdit(provider)}
          className="font-medium text-primary-600 dark:text-primary-500 hover:underline mr-4"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(provider.id)}
          className="font-medium text-red-600 dark:text-red-500 hover:underline"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
};

export default ProviderRow;