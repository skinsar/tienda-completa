// Contenido FINAL para subir_codigos.js (usando el Admin SDK)

const fs = require('fs');
// Importamos las herramientas de administrador
const admin = require('firebase-admin');

// 1. Cargamos nuestra "llave maestra"
const serviceAccount = require('./clave-admin.json');

// 2. Inicializamos la conexión como administradores
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 3. Obtenemos la referencia a la base de datos
const db = admin.firestore();

async function subirDatos() {
    try {
        console.log("Leyendo archivo AR.txt...");
        const data = fs.readFileSync('AR.txt', 'utf8');
        const lineas = data.split('\n');

        console.log(`Se encontraron ${lineas.length} líneas. Empezando a subir a Firestore...`);
        console.log("Esto puede tardar varios minutos. Por favor, espera.");

        const localidadesRef = db.collection("localidades");

        for (const linea of lineas) {
            if (!linea.trim()) continue;
            
            const campos = linea.split('\t');
            if (campos.length >= 5) {
                const localidad = {
                    pais: campos[0],
                    cp: campos[1],
                    ciudad: campos[2],
                    provincia: campos[3],
                    codigo_provincia: campos[4]
                };
                await localidadesRef.add(localidad);
                console.log(`Subido: ${localidad.ciudad}, ${localidad.provincia}`);
            }
        }

        console.log("¡Proceso completado! Todos los códigos postales han sido subidos.");
        process.exit(0);

    } catch (error) {
        console.error("Error durante el proceso de subida:", error);
        process.exit(1);
    }
}

subirDatos();