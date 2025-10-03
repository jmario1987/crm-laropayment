import React, { useState, useMemo } from 'react';
import { useLeads } from '../hooks/useLeads';
import { Tag, Stage } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { db } from '../firebaseConfig';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';

// Componente del formulario para crear/editar una sub-etapa
const TagForm: React.FC<{ tag?: Tag; stages: Stage[]; onSuccess: () => void }> = ({ tag, stages, onSuccess }) => {
  const [name, setName] = useState(tag?.name || '');
  const [color, setColor] = useState(tag?.color || '#4F46E5');
  const [stageId, setStageId] = useState(tag?.stageId || stages[0]?.id || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !stageId) {
      alert('El nombre y la etapa principal son obligatorios.');
      return;
    }

    const tagId = tag?.id || doc(collection(db, 'tags')).id;
    const newTagData: Tag = { id: tagId, name, color, stageId };

    try {
      await setDoc(doc(db, 'tags', tagId), newTagData);
      alert('¡Sub-Etapa guardada con éxito!');
      onSuccess();
    } catch (error) {
      console.error("Error guardando la sub-etapa:", error);
      alert('Error al guardar la sub-etapa.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Sub-Etapa</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
        <input
          type="color"
          id="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="mt-1 block w-full h-10 px-1 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div>
        <label htmlFor="stageId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asociar a Etapa Principal</label>
        <select
          id="stageId"
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          {stages.map(stage => (
            <option key={stage.id} value={stage.id}>{stage.name}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white">
          {tag ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

// Componente principal de la página de administración de sub-etapas
const Tags: React.FC = () => {
  const { tags, stages, reloadData } = useLeads();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | undefined>(undefined);

  const openModalForEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setIsModalOpen(true);
  };

  const openModalForNew = () => {
    setSelectedTag(undefined);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reloadData(); // Forzar recarga de datos al cerrar el modal
  };

  const handleDelete = async (tagId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta sub-etapa?')) {
      try {
        await deleteDoc(doc(db, 'tags', tagId));
        alert('Sub-Etapa eliminada.');
        reloadData();
      } catch (error) {
        console.error("Error eliminando sub-etapa:", error);
        alert('Error al eliminar.');
      }
    }
  };

  const getStageName = (stageId: string) => {
    return stages.find(s => s.id === stageId)?.name || 'Desconocida';
  };
  
  // Filtrar las etapas que no sean de tipo 'won' o 'lost'
  const assignableStages = useMemo(() => {
      return stages.filter(s => s.type !== 'won' && s.type !== 'lost');
  }, [stages]);

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Administrar Sub-Etapas</h1>
        <Button onClick={openModalForNew} className="bg-primary-600 hover:bg-primary-700 text-white">
          Crear Nueva
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Etapa Principal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Color</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tags.map(tag => (
                <tr key={tag.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tag.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{getStageName(tag.stageId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" style={{ backgroundColor: tag.color, color: '#FFF' }}>
                      &nbsp;
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-300">{tag.color}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModalForEdit(tag)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200 mr-4">Editar</button>
                    <button onClick={() => handleDelete(tag.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedTag ? 'Editar Sub-Etapa' : 'Crear Sub-Etapa'}>
          <TagForm tag={selectedTag} stages={assignableStages} onSuccess={closeModal} />
        </Modal>
      )}
    </div>
  );
};

export default Tags;