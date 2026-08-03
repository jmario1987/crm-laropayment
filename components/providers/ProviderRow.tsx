import React from 'react';
import { Provider } from '../../types';

interface ProviderRowProps {
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onDelete: (id: string) => void;
}

// Función para asignar colores según el estado del contrato
const getContractStatusStyles = (status?: string) => {
  switch (status) {
    case 'Firmado':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'Contrato enviado/Revisión':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    case 'En espera de respuesta':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'Descartado':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'No contactado':
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  }
};

const ProviderRow: React.FC<ProviderRowProps> = ({ provider, onEdit, onDelete }) => {
  return (
    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150 ease-in-out">
      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
        {provider.name}
      </td>
      
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
      
      {/* --- NUEVA CELDA: ESTADO DEL CONTRATO --- */}
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border whitespace-nowrap ${getContractStatusStyles(provider.contractStatus)}`}>
            {provider.contractStatus || 'No contactado'}
        </span>
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