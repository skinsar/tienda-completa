// Contenido para el archivo subir_codigos.js

// Este script se ejecuta en tu computadora (con Node.js), no en el navegador.
const fs = require('fs');
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

// IMPORTANTE: Copia y pega tu configuración de Firebase aquí
const firebaseConfig = {
    apiKey: "AIzaSyCMjPC6UxihcYQcfcfIVL_AMU2_cv6vFKk",
    authDomain: "skins-bf0b8.firebaseapp.com",
    projectId: "skins-bf0b8",
    storageBucket: "skins-bf0b8.firebasestorage.app",
    messagingSenderId: "1098242246222",
    appId: "1:1098242246222:web:c9369feb045f2cf251f"
};

// Inicializamos la conexión a Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function subirDatos() {
    try {
        console.log("Leyendo archivo AR.txt...");
        const data = fs.readFileSync('AR.txt', 'utf8');
        const lineas = data.split('\n');

        console.log(`Se encontraron ${lineas.length} líneas. Empezando a subir a Firestore...`);
        console.log("Esto puede tardar varios minutos. Por favor, espera.");

        const localidadesRef = collection(db, "localidades");

        for (const linea of lineas) {
            if (!linea.trim()) continue; // Ignora líneas vacías
            
            // El archivo usa tabulaciones (\t) para separar los campos
            const campos = linea.split('\t');
            
            if (campos.length >= 5) {
                const localidad = {
                    pais: campos[0],
                    cp: campos[1],
                    ciudad: campos[2],
                    provincia: campos[3],
                    codigo_provincia: campos[4]
                };

                // Guardamos cada línea como un nuevo documento
                await addDoc(localidadesRef, localidad);
                console.log(`Subido: ${localidad.ciudad}, ${localidad.provincia}`);
            }
        }

        console.log("¡Proceso completado! Todos los códigos postales han sido subidos.");
        process.exit(0); // Termina el script

    } catch (error) {
        console.error("Error durante el proceso de subida:", error);
        process.exit(1); // Termina el script con un error
    }
}

subirDatos();