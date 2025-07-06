// Contenido FINAL para functions/index.js

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const fetch = require("node-fetch");

admin.initializeApp();

// ---------- FUNCIÓN 1: CREAR PAGO ----------
// Le decimos que esta función necesita acceso al secreto llamado "MERCADOPAGO_ACCESS_TOKEN"
exports.crearPreferenciaDePago = onRequest(
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
// Le decimos que esta función necesita acceso al secreto llamado "ENVIA_API_KEY"
// Dentro de tu index.js, la función cotizarEnvio
exports.cotizarEnvio = onRequest(
  { secrets: ["ENVIA_API_KEY"] }, 
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    }

    try {
      const { postalCode } = req.body;
      if (!postalCode) {
        return res.status(400).send({ error: "Falta el código postal." });
      }

      console.log(`Cotizando envío para el código postal: ${postalCode}`);

      const requestBody = {
        origin: {
          "postalCode": "F5300", // Origen: La Rioja
          "countryCode": "AR"
        },
        destination: {
          "postalCode": postalCode,
          "countryCode": "AR"
        },
        packages: [
          {
            "weight": 1,
            "dimensions": { "length": 20, "width": 15, "height": 10 }
          }
        ]
      };

      const enviaURL = 'https://ship-test.envia.com/ship/rate';

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
        console.error("Error desde la API de Envia.com:", responseData);
        throw new Error('La API de Envia.com devolvió un error.');
      }
      
      return res.status(200).send(responseData);

    } catch (error) {
      console.error("Error en la función cotizarEnvio:", error);
      return res.status(500).send({ error: "No se pudieron obtener las tarifas de envío." });
    }
  }
);