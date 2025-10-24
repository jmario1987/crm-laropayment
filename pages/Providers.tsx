import React, { useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { Provider } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ProviderForm from '../components/providers/ProviderForm';
import ProviderRow from '../components/providers/ProviderRow';

// 1. Cambiamos el nombre del componente para que coincida
const Desarrolladores: React.FC = () => {
    const { providers, dispatch, allLeads } = useLeads();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);

    const handleEditClick = (provider: Provider) => {
        setSelectedProvider(provider);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedProvider(null);
    };

    const handleDelete = (providerId: string) => {
        const isProviderInUse = allLeads.some(lead => lead.providerId === providerId);
        if (isProviderInUse) {
            // 2. Cambiamos el texto de la alerta
            alert('No se puede eliminar un desarrollador que está referenciado en uno o más prospectos.');
            return;
        }

        // 3. Cambiamos el texto de la confirmación
        if (window.confirm('¿Está seguro de que desea eliminar este desarrollador?')) {
            dispatch({ type: 'DELETE_PROVIDER', payload: providerId });
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    {/* 4. Cambiamos el título de la página */}
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Catálogo de Desarrolladores</h3>
                    {/* 5. Cambiamos el texto del botón */}
                    <Button onClick={handleOpenCreateModal}>Crear Desarrollador</Button>
                </div>
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                {/* 6. Cambiamos el título de la columna */}
                                <th scope="col" className="px-6 py-3">Nombre del Desarrollador</th>
                                <th scope="col" className="px-6 py-3">Persona de Contacto</th>
                                
                                {/* --- ESTAS SON LAS NUEVAS COLUMNAS --- */}
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Teléfono</th>
                                
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {providers.map(provider => (
                                <ProviderRow
                                    key={provider.id}
                                    provider={provider}
                                    onEdit={handleEditClick}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 7. Cambiamos el título del modal de creación */}
            <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} title="Crear Nuevo Desarrollador">
                <ProviderForm onSuccess={handleCloseCreateModal} />
            </Modal>

            {selectedProvider && (
                <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Editar: ${selectedProvider.name}`}>
                    <ProviderForm providerToEdit={selectedProvider} onSuccess={handleCloseEditModal} />
                </Modal>
            )}
        </div>
    );
};

// 8. Cambiamos el nombre de la exportación
export default Desarrolladores;