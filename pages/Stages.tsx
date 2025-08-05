
import React, { useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { Stage } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StageForm from '../components/stages/StageForm';

const Stages: React.FC = () => {
    const { stages, dispatch, allLeads } = useLeads();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
    const [draggedItem, setDraggedItem] = useState<Stage | null>(null);

    const sortedStages = [...stages].sort((a, b) => a.order - b.order);

    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);

    const handleEditClick = (stage: Stage) => {
        setSelectedStage(stage);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedStage(null);
    };

    const handleDelete = (stageId: string) => {
        const isStageInUse = allLeads.some(lead => lead.status === stageId);
        if (isStageInUse) {
            alert('No se puede eliminar una etapa que está asignada a uno o más prospectos.');
            return;
        }

        if (window.confirm('¿Está seguro de que desea eliminar esta etapa?')) {
            dispatch({ type: 'DELETE_STAGE', payload: stageId });
        }
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, stage: Stage) => {
        setDraggedItem(stage);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('opacity-50', 'bg-primary-200');
    };

    const handleDragOver = (e: React.DragEvent<HTMLLIElement>, stage: Stage) => {
        e.preventDefault();
        const targetItem = e.currentTarget;
        if(draggedItem?.id !== stage.id) {
            targetItem.classList.add('border-t-2', 'border-primary-500');
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.classList.remove('border-t-2', 'border-primary-500');
    };

    const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetStage: Stage) => {
        e.currentTarget.classList.remove('border-t-2', 'border-primary-500');
        if (!draggedItem || draggedItem.id === targetStage.id) return;

        let newStages = sortedStages.filter(s => s.id !== draggedItem.id);
        const targetIndex = newStages.findIndex(s => s.id === targetStage.id);

        newStages.splice(targetIndex, 0, draggedItem);
        
        const reorderedStages = newStages.map((s, index) => ({ ...s, order: index }));

        dispatch({ type: 'UPDATE_STAGES_ORDER', payload: reorderedStages });
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
         e.currentTarget.classList.remove('opacity-50', 'bg-primary-200');
         setDraggedItem(null);
    }


    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Gestionar Etapas</h3>
                    <Button onClick={handleOpenCreateModal}>Crear Etapa</Button>
                </div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Arrastra y suelta las etapas para reordenar el pipeline.</p>
                <ul className="space-y-3">
                    {sortedStages.map(stage => (
                        <li
                            key={stage.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, stage)}
                            onDragOver={(e) => handleDragOver(e, stage)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, stage)}
                            onDragEnd={handleDragEnd}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm cursor-grab"
                        >
                            <div className="flex items-center">
                                <span className="w-4 h-4 rounded-full mr-4" style={{ backgroundColor: stage.color }}></span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{stage.name}</span>
                                <span className="ml-4 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200 capitalize">{stage.type}</span>
                            </div>
                            <div className="space-x-4">
                                <button onClick={() => handleEditClick(stage)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Editar</button>
                                <button onClick={() => handleDelete(stage.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Eliminar</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} title="Crear Nueva Etapa">
                <StageForm onSuccess={handleCloseCreateModal} />
            </Modal>

            {selectedStage && (
                <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Editar Etapa: ${selectedStage.name}`}>
                    <StageForm stageToEdit={selectedStage} onSuccess={handleCloseEditModal} />
                </Modal>
            )}
        </div>
    );
};

export default Stages;
