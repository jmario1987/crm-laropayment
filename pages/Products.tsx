import React, { useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { Product } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ProductForm from '../components/products/ProductForm';
import ProductRow from '../components/products/ProductRow';
// --- 1. IMPORTAMOS LAS FUNCIONES DE FIREBASE ---
import { db } from '../firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';

const Products: React.FC = () => {
    const { products, dispatch, allLeads } = useLeads();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedProduct(null);
    };

    // --- 2. CONVERTIMOS HANDLEDELETE EN ASÍNCRONO ---
    const handleDelete = async (productId: string) => {
        // Verificación para evitar errores si productIds no existe en algún prospecto
        const isProductInUse = allLeads.some(lead => lead.productIds && lead.productIds.includes(productId));
        
        if (isProductInUse) {
            alert('No se puede eliminar un producto que está asociado a uno o más prospectos.');
            return;
        }

        if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
           try {
                // --- 3. AÑADIMOS EL BORRADO DE FIREBASE ---
                // 1. Borramos de Firebase
                const docRef = doc(db, 'products', productId);
                await deleteDoc(docRef);

                // 2. Borramos del estado local (memoria)
                dispatch({ type: 'DELETE_PRODUCT', payload: productId });

            } catch (error) {
                console.error("Error al eliminar producto de Firebase:", error);
                alert("Error: No se pudo eliminar el producto.");
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Catálogo de Productos</h3>
                    <Button onClick={handleOpenCreateModal}>Crear Producto</Button>
                </div>
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre del Producto</th>
                                <th scope="col" className="px-6 py-3">Descripción</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    onEdit={handleEditClick}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} title="Crear Nuevo Producto">
                <ProductForm onSuccess={handleCloseCreateModal} />
            </Modal>

            {selectedProduct && (
                <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Editar: ${selectedProduct.name}`}>
                    <ProductForm productToEdit={selectedProduct} onSuccess={handleCloseEditModal} />
                </Modal>
            )}
        </div>
    );
};

export default Products;