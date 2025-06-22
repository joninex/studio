// src/lib/data/common-faults.ts
import type { CommonFault } from "@/types";

// Using Omit to let the action layer assign the ID
export const COMMON_FAULTS_DATA: Omit<CommonFault, 'id'>[] = [
    // Encendido
    { activator: "@no-enciende", category: "Encendido", fullText: "El equipo no enciende, no da imagen ni responde al cargador. Cliente desconoce el motivo.", keywords: ["apagado", "muerto", "no prende", "sin respuesta", "no arranca"] },
    { activator: "@reinicio-constante", category: "Encendido", fullText: "El equipo se reinicia constantemente por sí solo, a veces mostrando el logo y apagándose (bootloop).", keywords: ["reinicio", "bootloop", "loop", "manzana", "logo"] },
    { activator: "@se-apaga", category: "Encendido", fullText: "El equipo se apaga de forma inesperada mientras está en uso, incluso con batería.", keywords: ["apaga solo", "corta", "inesperado"] },
    
    // Pantalla
    { activator: "@pantalla-rota", category: "Pantalla", fullText: "Pantalla visiblemente rota, cristal trizado. El táctil puede o no funcionar.", keywords: ["rota", "cristal", "trizado", "astillado", "display"] },
    { activator: "@sin-imagen", category: "Pantalla", fullText: "El equipo enciende (vibra o suena) pero la pantalla se queda en negro, sin imagen.", keywords: ["negro", "sin imagen", "backlight", "display"] },
    { activator: "@lineas-pantalla", category: "Pantalla", fullText: "La pantalla muestra líneas verticales u horizontales de colores, o manchas.", keywords: ["lineas", "manchas", "rayas", "display"] },
    { activator: "@no-tactil", category: "Pantalla", fullText: "La pantalla da imagen correctamente pero el táctil no responde en toda o parte de la pantalla.", keywords: ["tactil", "touch", "no anda", "no funciona"] },
    { activator: "@parpadeo-pantalla", category: "Pantalla", fullText: "La pantalla parpadea o el brillo es inestable.", keywords: ["parpadea", "brillo", "flicker"] },
    
    // Batería y Carga
    { activator: "@no-carga", category: "Batería y Carga", fullText: "Al conectar el cargador, el equipo no muestra ninguna señal de estar cargando.", keywords: ["no carga", "pin", "puerto", "conector"] },
    { activator: "@carga-lento", category: "Batería y Carga", fullText: "El equipo carga, pero de forma muy lenta o intermitente.", keywords: ["carga lento", "falso contacto", "intermitente"] },
    { activator: "@bateria-dura-poco", category: "Batería y Carga", fullText: "La batería dura muy poco, se descarga rápidamente incluso con poco uso.", keywords: ["bateria", "dura poco", "descarga rapido"] },
    { activator: "@falsa-carga", category: "Batería y Carga", fullText: "El equipo muestra el ícono de carga pero el porcentaje no aumenta.", keywords: ["falsa carga", "no sube", "icono"] },
    { activator: "@bateria-hinchada", category: "Batería y Carga", fullText: "Batería visiblemente hinchada, puede estar levantando la tapa o pantalla.", keywords: ["hinchada", "inflada", "bateria"] },
    
    // Audio
    { activator: "@no-auricular", category: "Audio", fullText: "No se escucha el audio por el auricular durante las llamadas.", keywords: ["auricular", "llamadas", "no escucho"] },
    { activator: "@no-altavoz", category: "Audio", fullText: "No se escucha el audio por el altavoz (música, videos, altavoz de llamada).", keywords: ["altavoz", "parlante", "no suena"] },
    { activator: "@no-microfono", category: "Audio", fullText: "La otra persona no me escucha durante las llamadas o al grabar audios.", keywords: ["microfono", "no me escuchan"] },
    
    // Conectividad
    { activator: "@no-wifi", category: "Conectividad", fullText: "No detecta redes Wi-Fi o no se puede conectar a ninguna.", keywords: ["wifi", "no conecta", "sin internet"] },
    { activator: "@no-sim", category: "Conectividad", fullText: "El equipo no reconoce la tarjeta SIM o indica 'Sin Servicio' constantemente.", keywords: ["sim", "sin servicio", "no levanta señal", "banda base"] },
    { activator: "@no-bluetooth", category: "Conectividad", fullText: "No se puede activar el Bluetooth o no encuentra dispositivos para enlazar.", keywords: ["bluetooth", "no enlaza"] },
    
    // Cámaras
    { activator: "@camara-trasera-falla", category: "Cámaras", fullText: "La cámara trasera no funciona (pantalla negra) o las fotos salen borrosas/con manchas.", keywords: ["camara trasera", "no abre", "borrosa"] },
    { activator: "@camara-frontal-falla", category: "Cámaras", fullText: "La cámara frontal (selfie) no funciona o las fotos salen mal.", keywords: ["camara frontal", "selfie", "no funciona"] },
    
    // Software
    { activator: "@software-lento", category: "Software", fullText: "El equipo está lento, se tilda o algunas aplicaciones no funcionan correctamente.", keywords: ["lento", "tildado", "software", "virus"] },
    { activator: "@bloqueado-cuenta", category: "Software", fullText: "El equipo está bloqueado por cuenta Google/iCloud o patrón/contraseña olvidada.", keywords: ["bloqueado", "cuenta", "google", "icloud", "patron"] },
    
    // Otros
    { activator: "@mojado", category: "Otros", fullText: "El equipo tuvo contacto con líquido (agua, etc.). Puede presentar fallas múltiples.", keywords: ["mojado", "agua", "humedad", "sulfatado"] },
];
