// Contenido FINAL Y DEFINITIVO para functions/index.js

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.firestore(); // Obtenemos la instancia de Firestore aquí

// ---------- FUNCIÓN 1: CREAR PAGO (Corregida con la sintaxis correcta) ----------
exports.crearPreferenciaDePago = onRequest(
  { secrets: ["MERCADOPAGO_ACCESS_TOKEN"] },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }
    try {
        const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const { carrito, datosCliente, envio } = req.body;
        if (!carrito || !Array.isArray(carrito) || !datosCliente || !envio) {
            return res.status(400).send({ error: "Datos de entrada inválidos." });
        }
        const productosAgrupados = carrito.reduce((acc, prod) => {
            if (!acc[prod.slug]) { acc[prod.slug] = { ...prod, cantidad: 0 }; }
            acc[prod.slug].cantidad++;
            return acc;
        }, {});
        const carritoProcesado = Object.values(productosAgrupados);
        const totalProductos = carritoProcesado.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const totalFinal = totalProductos + envio.precio;
        const nuevaOrden = {
            cliente: datosCliente,
            items: carritoProcesado,
            envio: envio,
            total: totalFinal,
            fecha: admin.firestore.FieldValue.serverTimestamp(),
            estado: "pendiente_de_pago",
            userId: req.body.userId || null
        };
        const ordenRef = await db.collection("pedidos").add(nuevaOrden);
        const numeroDeOrden = ordenRef.id;
        let itemsParaMP = carritoProcesado.map((producto) => ({
            id: producto.slug,
            title: producto.nombre,
            quantity: producto.cantidad,
            currency_id: "ARS",
            unit_price: producto.precio,
        }));
        if (envio.precio > 0) {
            itemsParaMP.push({
                title: `Costo de Envío (${envio.zona})`,
                quantity: 1,
                currency_id: "ARS",
                unit_price: envio.precio,
            });
        }
        const preferenceData = {
            items: itemsParaMP,
            payer: { name: datosCliente.nombre, email: "test_user@test.com" },
            external_reference: numeroDeOrden,
            back_urls: { success: "https://skinsar.github.io/tienda/pagina-principal.html" },
            auto_return: "approved",
        };
        const preference = new Preference(mpClient);
        const response = await preference.create({ body: preferenceData });
        return res.status(200).send({ url: response.sandbox_init_point });
    } catch (error) {
        console.error("Error en la Cloud Function (pago):", error);
        return res.status(500).send({ error: "Error interno al procesar el pago." });
    }
  }
);

// ---------- FUNCIÓN 2: COTIZAR ENVÍO (Corregida con la sintaxis correcta) ----------
exports.cotizarEnvio = onRequest(
  {}, 
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }
    try {
        const { postalCode } = req.body;
        if (!postalCode) {
            return res.status(400).send({ error: "Falta el código postal." });
        }
        
        const localidadesRef = db.collection('localidades');
        const q = localidadesRef.where("cp", "==", postalCode).limit(1);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return res.status(404).send({ error: "Código postal no encontrado." });
        }

        const localidadData = querySnapshot.docs[0].data();
        const nombreProvincia = localidadData.provincia;
        
        const provinciaId = nombreProvincia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
        
        const costoRef = db.collection("costos_envio").doc(provinciaId);
        const costoSnap = await costoRef.get();

        if (!costoSnap.exists) {
            return res.status(404).send({ error: "No hay envíos disponibles para esta provincia." });
        }

        const tarifas = costoSnap.data();
        return res.status(200).send({
            provincia: nombreProvincia,
            precioSucursal: tarifas.precioSucursal,
            precioDomicilio: tarifas.precioDomicilio
        });
    } catch (error) {
        console.error("Error en la función cotizarEnvio:", error);
        return res.status(500).send({ error: "No se pudieron obtener las tarifas de envío." });
    }
  }
);