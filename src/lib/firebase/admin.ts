import * as admin from 'firebase-admin';

// Intenta obtener la configuración de la cuenta de servicio desde una variable de entorno
// Esto es útil si el contenido del JSON de la cuenta de servicio se almacena como una variable de entorno.
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
let serviceAccount;

if (serviceAccountString) {
  try {
    serviceAccount = JSON.parse(serviceAccountString);
  } catch (e) {
    console.error('Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON:', e);
  }
}

// Evitar la reinicialización de la app en entornos de desarrollo con HMR
if (!admin.apps.length) {
  if (serviceAccount) {
    // Inicializar con cuenta de servicio desde variable de entorno
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Opcional: Especifica aquí tu databaseURL si es necesario, aunque generalmente se infiere.
      // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'TU_PROJECT_ID_AQUI'}.firebaseio.com`
    });
    console.log('Firebase Admin SDK inicializado con cuenta de servicio desde variable de entorno.');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Inicializar con cuenta de servicio desde ruta de archivo especificada en GOOGLE_APPLICATION_CREDENTIALS
     admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'TU_PROJECT_ID_AQUI'}.firebaseio.com`
    });
    console.log('Firebase Admin SDK inicializado con GOOGLE_APPLICATION_CREDENTIALS.');
  }
  else {
    // Inicializar con credenciales por defecto del entorno (para Google Cloud, por ejemplo)
    // O si tienes el archivo JSON referenciado por la variable de entorno GOOGLE_APPLICATION_CREDENTIALS
    admin.initializeApp({
      // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'TU_PROJECT_ID_AQUI'}.firebaseio.com`
    });
    console.log('Firebase Admin SDK inicializado con credenciales por defecto del entorno.');
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };
