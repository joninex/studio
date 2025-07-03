import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_AUTH_DOMAIN_AQUI",
  projectId: "TU_PROJECT_ID_AQUI",
  storageBucket: "TU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUI",
  appId: "TU_APP_ID_AQUI",
  // measurementId: "TU_MEASUREMENT_ID_AQUI" // Opcional, descomentar si lo usas
};

// Inicializar Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED // Opcional: Configura el tamaño de la caché. También puedes usar un valor numérico en bytes.
});

// Habilitar persistencia offline para Firestore
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Persistencia offline de Firestore habilitada.");
  })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn(
        "Error al habilitar la persistencia offline (failed-precondition): " +
        "Probablemente múltiples pestañas abiertas. La persistencia solo se puede habilitar en una pestaña a la vez."
      );
    } else if (err.code == 'unimplemented') {
      console.warn(
        "Error al habilitar la persistencia offline (unimplemented): " +
        "El navegador actual no soporta la persistencia offline."
      );
    } else {
      console.error("Error al habilitar la persistencia offline de Firestore: ", err);
    }
  });

export { app, auth, db };
