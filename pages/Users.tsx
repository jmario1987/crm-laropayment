import React, { useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { User, USER_ROLES } from '../types';
import Modal from '../components/ui/Modal';
import UserForm from '../components/users/UserForm';
import Button from '../components/ui/Button';
import ResetPasswordForm from '../components/users/ResetPasswordForm';

interface UserRowProps {
    user: User;
    onEdit: (user: User) => void;
    onResetPassword: (user: User) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onEdit, onResetPassword }) => (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.role}</td>
        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
            {user.lastLogin 
                ? new Date(user.lastLogin).toLocaleString('es-ES', { 
                    year: 'numeric', month: 'short', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                  }) 
                : 'Nunca'}
        </td>
        <td className="px-6 py-4 text-right space-x-4">
            <button onClick={() => onEdit(user)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Editar</button>
            {/* SE ELIMINÓ LA CONDICIÓN 'user.role !== USER_ROLES.Admin' DE AQUÍ */}
            <button onClick={() => onResetPassword(user)} className="font-medium text-yellow-600 dark:text-yellow-500 hover:underline">
                Resetear Contraseña
            </button>
        </td>
    </tr>
);

const Users: React.FC = () => {
    const { users, roles, dispatch } = useLeads();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [newRole, setNewRole] = useState('');

    const defaultRoles = Object.values(USER_ROLES);

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };
    
    const handleOpenResetModal = (user: User) => {
        setUserToReset(user);
    };

    const handleCloseResetModal = () => {
        setUserToReset(null);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedUser(null);
    };

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };
    
    const handleAddRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRole && !roles.includes(newRole)) {
            dispatch({ type: 'ADD_ROLE', payload: newRole });
            setNewRole('');
        } else {
            alert('El rol no puede estar vacío o ya existe.');
        }
    };

    const handleDeleteRole = (roleToDelete: string) => {
        if (defaultRoles.includes(roleToDelete)) {
            alert('No se pueden eliminar los roles por defecto.');
            return;
        }
        if (users.some(user => user.role === roleToDelete)) {
            alert('No se puede eliminar un rol que está asignado a uno o más usuarios.');
            return;
        }
        if (window.confirm(`¿Está seguro de que desea eliminar el rol "${roleToDelete}"?`)) {
            dispatch({ type: 'DELETE_ROLE', payload: roleToDelete });
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Lista de Usuarios</h3>
                    <Button onClick={handleOpenCreateModal}>Crear Usuario</Button>
                </div>
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Rol</th>
                                <th scope="col" className="px-6 py-3">Último Login</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => <UserRow key={user.id} user={user} onEdit={handleEditClick} onResetPassword={handleOpenResetModal} />)}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Gestionar Roles</h3>
                 <form onSubmit={handleAddRole} className="flex items-center space-x-2 mb-4">
                    <input 
                        type="text" 
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        placeholder="Nombre del nuevo rol"
                        className="flex-grow px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    <Button type="submit">Agregar Rol</Button>
                 </form>
                 <ul className="space-y-2">
                    {roles.map(role => (
                        <li key={role} className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                            <span className="text-gray-800 dark:text-gray-200">{role}</span>
                            {!defaultRoles.includes(role) && (
                                <button onClick={() => handleDeleteRole(role)} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                                    Eliminar
                                </button>
                            )}
                        </li>
                    ))}
                 </ul>
            </div>
            
            {selectedUser && (
                <Modal 
                    isOpen={isEditModalOpen} 
                    onClose={handleCloseEditModal} 
                    title={`Editar Usuario: ${selectedUser.name}`}
                >
                    <UserForm 
                        userToEdit={selectedUser} 
          _              onSuccess={handleCloseEditModal} 
                    />
                </Modal>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                title="Crear Nuevo Usuario"
            >
    _           <UserForm onSuccess={handleCloseCreateModal} />
            </Modal>

            {userToReset && (
                <Modal 
                    isOpen={!!userToReset} 
                    onClose={handleCloseResetModal} 
                    title={`Resetear Contraseña para ${userToReset.name}`}
                >
                    <ResetPasswordForm 
                        user={userToReset} 
                        onSuccess={handleCloseResetModal} 
                    />
                </Modal>
            )}
        </div>
    );
};

export default Users;