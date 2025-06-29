// Contenido FINAL SIMPLIFICADO para functions/index.js

// Ya no importamos 'defineString'
const { onRequest } = require("firebase-functions/v2/https"); 
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference } = require("mercadopago");

admin.initializeApp();

// Exportamos la función, indicando directamente que necesita el secreto.
exports.crearPreferenciaDePago = onRequest(
  // Ya no definimos un parámetro, solo pedimos el secreto que ya creamos.
  { secrets: ["MERCADOPAGO_ACCESS_TOKEN"] },
  async (req, res) => {
    
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    }

    try {
      // Para leer el secreto, ahora usamos process.env
      const mpClient = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      });
      
      const { carrito, datosCliente } = req.body;

      if (!carrito || !Array.isArray(carrito) || carrito.length === 0 || !datosCliente) {
        return res.status(400).send({ error: "Datos de entrada inválidos." });
      }

      // El resto de la lógica sigue igual...
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
        payer: { name: datosCliente.nombre, email: "test_user_12345678@testuser.com" },
        external_reference: numeroDeOrden,
        back_urls: { success: "https://skinsar.github.io/tienda/pagina-principal.html" },
        auto_return: "approved",
      };
      
      const preference = new Preference(mpClient);
      const response = await preference.create({ body: preferenceData });
      
      return res.status(200).send({ url: response.sandbox_init_point });

    } catch (error) {
      console.error("Error en la Cloud Function:", error);
      return res.status(500).send({ error: "Ocurrió un error interno al procesar la solicitud." });
    }
  }
);