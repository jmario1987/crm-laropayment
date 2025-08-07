import { Lead } from '../types';

// Esta función ahora siempre devuelve una plantilla simple, sin llamar a la IA.
export const generateFollowUpEmail = async (lead: Lead): Promise<string> => {
  return Promise.resolve(
    `Estimado/a ${lead.name},\n\nEspero que se encuentre bien. Quería hacer un seguimiento de nuestra conversación anterior sobre su interés en nuestros servicios.\n\n¿Tendría un momento esta semana para conversar?\n\nSaludos cordiales,\n[Tu Nombre]`
  );
};
