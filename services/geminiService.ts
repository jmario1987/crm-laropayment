import { GoogleGenerativeAI } from "@google/genai";
import { Lead } from '../types';

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  console.warn("La clave de API de Gemini no está configurada. Las funciones de IA estarán deshabilitadas.");
}

// Usamos el nombre 'GoogleGenerativeAI' que es el correcto para las versiones nuevas
const genAI = new GoogleGenerativeAI(apiKey!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

export const generateFollowUpEmail = async (lead: Lead): Promise<string> => {
  if (!apiKey) {
    return Promise.resolve("Estimado/a [Nombre del Prospecto],\n\nEspero que se encuentre bien. Quería hacer un seguimiento de nuestra conversación anterior sobre [Tema].\n\n¿Tendría un momento esta semana para conversar?\n\nSaludos cordiales,\n[Tu Nombre]");
  }
  
  const prompt = `
    Eres un asistente de ventas experto. Tu tarea es escribir un correo electrónico de seguimiento profesional y conciso para un prospecto.
    
    Información del Prospecto:
    - Nombre: ${lead.name}
    - Empresa: ${lead.company}
    - Estado Actual en el Pipeline: ${lead.status ?? 'No definido'}

    Instrucciones:
    1.  El tono debe ser amigable pero profesional.
    2.  El correo debe ser breve y directo.
    3.  El objetivo es reanudar la conversación y mover al prospecto al siguiente paso.
    4.  Personaliza el mensaje basado en su estado actual.
    5.  No incluyas un asunto, solo el cuerpo del correo.
    6.  Usa placeholders como "[Tu Nombre]".
    7.  El correo debe estar en español.
  `;

  try {
    // Usamos la sintaxis moderna que es compatible con la nueva versión
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();

  } catch (error) {
    console.error("Error al generar el correo con Gemini:", error);
    throw new Error("No se pudo generar el contenido del correo electrónico.");
  }
};
