// Contenido FINAL Y DEFINITIVO para functions/index.js

const functions = require("firebase-functions");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const cors = require("cors")({ origin: true }); // Importamos y configuramos CORS

// 1. Configuración del cliente
const client = new MercadoPagoConfig({
  accessToken: functions.config().mercadopago.token,
});

// 2. CAMBIO IMPORTANTE: Usamos onRequest en lugar de onCall
exports.crearPreferenciaDePago = functions.https.onRequest((req, res) => {
  // Envolvemos todo en el manejador de CORS
  cors(req, res, async () => {
    // Verificamos que el método sea POST
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    // Los datos ahora vienen en req.body
    const { carrito, datosCliente } = req.body;

    // Validación de datos de entrada
    if (!carrito || !Array.isArray(carrito) || carrito.length === 0 || !datosCliente) {
      return res.status(400).json({ error: "Datos de entrada inválidos." });
    }

    const productosAgrupados = carrito.reduce((acc, prod) => {
      if (!acc[prod.slug]) {
        acc[prod.slug] = { ...prod, cantidad: 0 };
      }
      acc[prod.slug].cantidad++;
      return acc;
    }, {});

    const carritoProcesado = Object.values(productosAgrupados);

    const items = carritoProcesado.map((producto) => ({
      title: producto.nombre,
      quantity: producto.cantidad,
      currency_id: "ARS",
      unit_price: producto.precio,
    }));

    const preferenceData = {
      items: items,
      payer: {
        name: datosCliente.nombre,
        email: "test_user_12345678@testuser.com",
        phone: { number: datosCliente.telefono },
        address: {
          street_name: datosCliente.direccion,
          zip_code: datosCliente.codigoPostal,
        },
      },
      back_urls: {
        success: "https://skinsar.github.io/tienda/pagina-principal.html",
        failure: "https://skinsar.github.io/tienda/pagina-principal.html",
        pending: "https://skinsar.github.io/tienda/pagina-principal.html",
      },
      auto_return: "approved",
    };

    try {
      const preference = new Preference(client);
      const response = await preference.create({ body: preferenceData });
      
      // Enviamos la respuesta con éxito
      return res.status(200).json({ url: response.sandbox_init_point });
    } catch (error) {
      console.error("Error al crear la preferencia de pago:", error);
      // Enviamos una respuesta de error
      return res.status(500).json({ error: "No se pudo crear la preferencia de pago." });
    }
  });
});