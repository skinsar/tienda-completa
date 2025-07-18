// Contenido FINAL Y DEFINITIVO para functions/index.js

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const fetch = require("node-fetch");

// Ya no usamos defineString

admin.initializeApp();

// ---------- FUNCIÓN 1: CREAR PAGO ----------
exports.crearPreferenciaDePago = onRequest(
  // Le decimos que esta función necesita acceso al secreto llamado "MERCADOPAGO_ACCESS_TOKEN"
  { secrets: ["MERCADOPAGO_ACCESS_TOKEN"] },
  async (req, res) => {
    // Manejamos CORS
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(204).send('');
    }

    try {
      // Leemos el secreto usando process.env
      const mpClient = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      });

      const { carrito, datosCliente } = req.body;
      if (!carrito || !Array.isArray(carrito) || !datosCliente) {
        return res.status(400).send({ error: "Datos de entrada inválidos." });
      }

      const db = admin.firestore();
      // ... (El resto de la lógica de esta función no cambia)
      const productosAgrupados = carrito.reduce((acc, prod) => {
        if (!acc[prod.slug]) { acc[prod.slug] = { ...prod, cantidad: 0 }; }
        acc[prod.slug].cantidad++;
        return acc;
      }, {});
      const carritoProcesado = Object.values(productosAgrupados);
      const total = carritoProcesado.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      const nuevaOrden = {
        cliente: datosCliente,
        items: carritoProcesado,
        total: total,
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        estado: "pendiente_de_pago"
      };
      const ordenRef = await db.collection("pedidos").add(nuevaOrden);
      const numeroDeOrden = ordenRef.id;
      const itemsParaMP = carritoProcesado.map((producto) => ({
        id: producto.slug,
        title: producto.nombre,
        quantity: producto.cantidad,
        currency_id: "ARS",
        unit_price: producto.precio,
      }));
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


// ---------- FUNCIÓN 2: COTIZAR ENVÍO ----------
exports.cotizarEnvio = onRequest(
  // Le decimos que esta función necesita acceso al secreto llamado "ENVIA_API_KEY"
  { secrets: ["ENVIA_API_KEY"] },
  async (req, res) => {
    // Manejamos CORS
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(204).send('');
    }

    try {
      const { datosDireccion } = req.body;
      if (!datosDireccion || !datosDireccion.postalCode) {
        return res.status(400).send({ error: "Faltan datos de dirección." });
      }

      const requestBody = {
        origin: {
            name: "Tienda SKINS", company: "SKINS", email: "tu-email-de-contacto@ejemplo.com",
            phone: "3801234567", street: "Av. Rivadavia", number: "500",
            district: "Centro", city: "La Rioja", state: "F",
            countryCode: "AR", postalCode: "F5300", reference: ""
        },
        destination: {
            street: datosDireccion.address, number: "0", city: datosDireccion.city,
            countryCode: "AR", postalCode: datosDireccion.postalCode,
            name: datosDireccion.nombre, email: "cliente@email.com",
            phone: datosDireccion.telefono
        },
        packages: [{
            content: "Ropa", amount: 1, type: "box", weight: 1,
            dimensions: { length: 20, width: 15, height: 10 },
            weightUnit: "KG", lengthUnit: "CM"
        }],
        shipment: { carrier: "shipnow", type: 0 }
      };

      const enviaURL = 'https://api-test.envia.com/ship/rate';
      const enviaResponse = await fetch(enviaURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ENVIA_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await enviaResponse.json();
      if (!enviaResponse.ok) {
        throw new Error('La API de Envia.com devolvió un error.');
      }
      return res.status(200).send(responseData);

    } catch (error) {
      console.error("Error en la función (envío):", error);
      return res.status(500).send({ error: "No se pudieron obtener las tarifas de envío." });
    }
  }
);