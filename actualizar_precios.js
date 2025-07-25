// Contenido para el nuevo archivo actualizar_precios.js

const admin = require('firebase-admin');
const serviceAccount = require('./clave-admin.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 1. Definimos tu lista de precios directamente en el código
const preciosPorProvincia = {
    "BUENOS AIRES": { sucursal: 8000, domicilio: 10500 },
    "CAPITAL FEDERAL": { sucursal: 8000, domicilio: 10500 },
    "CATAMARCA": { sucursal: 7000, domicilio: 9500 },
    "CHACO": { sucursal: 8000, domicilio: 10500 },
    "CHUBUT": { sucursal: 9000, domicilio: 11500 },
    "CORDOBA": { sucursal: 7000, domicilio: 10000 },
    "CORRIENTES": { sucursal: 8000, domicilio: 11000 }, // Corregido el precio de domicilio
    "ENTRE RIOS": { sucursal: 8000, domicilio: 11000 },
    "FORMOSA": { sucursal: 8000, domicilio: 11000 },
    "JUJUY": { sucursal: 8000, domicilio: 11000 },
    "LA PAMPA": { sucursal: 8000, domicilio: 11000 },
    "LA RIOJA": { sucursal: 5000, domicilio: 8500 },
    "MENDOZA": { sucursal: 7000, domicilio: 9800 },
    "MISIONES": { sucursal: 9000, domicilio: 11700 },
    "NEUQUEN": { sucursal: 9000, domicilio: 11700 },
    "RIO NEGRO": { sucursal: 9000, domicilio: 11700 },
    "SALTA": { sucursal: 7000, domicilio: 9800 },
    "SAN JUAN": { sucursal: 7000, domicilio: 9800 },
    "SAN LUIS": { sucursal: 7000, domicilio: 9800 },
    "SANTA CRUZ": { sucursal: 9000, domicilio: 11700 },
    "SANTA FE": { sucursal: 8000, domicilio: 9955 },
    "SANTIAGO DEL ESTERO": { sucursal: 7000, domicilio: 9800 },
    "TIERRA DEL FUEGO": { sucursal: 9000, domicilio: 11700 },
    "TUCUMAN": { sucursal: 7000, domicilio: 9800 },
    // Casos especiales encontrados en la base de datos de CP
    "CIUDAD AUTONOMA DE BUENOS AIRES": { sucursal: 8000, domicilio: 10500 },
    "TIERRA DEL FUEGO, ANTARTIDA E ISLAS DEL ATLANTICO SUR": { sucursal: 9000, domicilio: 11700 }
};

async function actualizarDatos() {
    console.log("Iniciando actualización de precios en la colección 'localidades'...");
    console.log("Este proceso puede tardar MUCHO tiempo. Por favor, sé paciente y no cierres la terminal.");

    const localidadesRef = db.collection('localidades');
    const snapshot = await localidadesRef.get();

    if (snapshot.empty) {
        console.log('No se encontraron documentos en la colección "localidades".');
        return;
    }

    let contador = 0;
    for (const doc of snapshot.docs) {
        const localidad = doc.data();
        const provinciaNombre = localidad.provincia ? localidad.provincia.toUpperCase() : '';
        
        // Buscamos la tarifa correspondiente a la provincia
        const tarifa = preciosPorProvincia[provinciaNombre];
        
        if (tarifa) {
            // Si encontramos una tarifa, actualizamos el documento
            await doc.ref.update({
                precioSucursal: tarifa.sucursal,
                precioDomicilio: tarifa.domicilio
            });
            contador++;
            console.log(`(${contador}/${snapshot.size}) Actualizado: ${localidad.ciudad}, ${provinciaNombre}`);
        } else {
            console.warn(`!! No se encontró tarifa para la provincia: ${provinciaNombre}`);
        }
    }

    console.log(`¡Proceso completado! Se actualizaron ${contador} documentos.`);
}

actualizarDatos().catch(console.error);