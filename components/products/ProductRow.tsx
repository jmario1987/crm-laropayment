import React from 'react';
import { Product } from '../../types';

interface ProductRowProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, onEdit, onDelete }) => (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{product.description}</td>
        <td className="px-6 py-4 text-right space-x-4">
            <button onClick={() => onEdit(product)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Editar</button>
            <button onClick={() => onDelete(product.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Eliminar</button>
        </td>
    </tr>
);

export default ProductRow;