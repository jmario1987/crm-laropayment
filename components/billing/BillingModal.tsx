import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// Helper para generar los últimos 6 meses en formato "MM-YYYY"
const getLastSixMonths = () => {
    const months = [];
    let date = new Date();
    for (let i = 0; i < 6; i++) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        months.push(`${month}-${year}`);
        date.setMonth(date.getMonth() - 1);
    }
    return months;
};

interface BillingModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<Lead>) => void;
}

const BillingModal: React.FC<BillingModalProps> = ({ lead, isOpen, onClose, onSave }) => {
  const [history, setHistory] = useState<{ [key: string]: boolean }>({});
  const [status, setStatus] = useState<'Activo' | 'Inactivo'>('Activo');

  // Cargar el estado inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setHistory(lead.billingHistory || {});
      setStatus(lead.clientStatus || 'Activo');
    }
  }, [isOpen, lead]);

  const monthsToDisplay = getLastSixMonths();

  const handleToggle = (monthYear: string) => {
    setHistory(prev => ({
      ...prev,
      [monthYear]: !prev[monthYear], // Invierte el valor actual (true/false)
    }));
  };

  const handleSave = () => {
    const updatedData: Partial<Lead> = {
      billingHistory: history,
      clientStatus: status,
      lastUpdate: new Date().toISOString(), // Actualizamos la fecha
    };
    onSave(updatedData);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Conciliación de Facturación: ${lead.name}`}>
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Registro de Facturación Mensual</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Activa el interruptor para los meses en que este cliente ha facturado.
          </p>
          <div className="space-y-3">
            {monthsToDisplay.map(monthYear => (
              <div key={monthYear} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <span className="font-medium text-gray-700 dark:text-gray-200">{monthYear}</span>
                <button
                  onClick={() => handleToggle(monthYear)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${history[monthYear] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${history[monthYear] ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Estado del Cliente</h4>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                    Actualmente: <span className={status === 'Activo' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{status}</span>
                </span>
                <Button 
                    variant={status === 'Activo' ? 'danger' : 'secondary'}
                    onClick={() => setStatus(status === 'Activo' ? 'Inactivo' : 'Activo')}
                >
                   {status === 'Activo' ? 'Marcar como Inactivo' : 'Reactivar Cliente'}
                </Button>
            </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </div>
      </div>
    </Modal>
  );
};

export default BillingModal;
