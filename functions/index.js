// functions/index.js - VERSIÓN FINAL CON AUTENTICACIÓN

const { onCall } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference } = require("mercadopago");

admin.initializeApp();

const mercadopagoAccessToken = defineString("MERCADOPAGO_ACCESS_TOKEN");

exports.crearPreferenciaDePago = onCall(
  { secrets: [mercadopagoAccessToken] },
  async (request) => {
    // Para las onCall functions, los datos vienen en request.data
    const { carrito, datosCliente } = request.data;
    
    // Verificamos si el usuario está autenticado. Firebase lo hace por nosotros.
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "La función debe ser llamada por un usuario autenticado."
      );
    }
    
    // Validación de datos de entrada
    if (!carrito || !Array.isArray(carrito) || carrito.length === 0 || !datosCliente) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Datos de entrada inválidos."
      );
    }

    try {
      const db = admin.firestore();
      const mpClient = new MercadoPagoConfig({
        accessToken: mercadopagoAccessToken.value(),
      });
      
      const productosAgrupados = carrito.reduce((acc, prod) => {
        if (!acc[prod.slug]) { acc[prod.slug] = { ...prod, cantidad: 0 }; }
        acc[prod.slug].cantidad++;
        return acc;
      }, {});
      const carritoProcesado = Object.values(productosAgrupados);

      const total = carritoProcesado.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      
      // Obtenemos el ID del usuario que hizo la llamada
      const userId = request.auth.uid;

      // Creamos la orden AÑADIENDO EL userId
      const nuevaOrden = {
        userId: userId, // <-- ¡CAMBIO IMPORTANTE!
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
        payer: { name: datosCliente.nombre, email: request.auth.token.email || "test_user@test.com" },
        external_reference: numeroDeOrden,
        back_urls: { success: "https://skinsar.github.io/tienda/pagina-principal.html" },
        auto_return: "approved",
      };
      
      const preference = new Preference(mpClient);
      const response = await preference.create({ body: preferenceData });
      
      // En las onCall, devolvemos el objeto directamente
      return { url: response.sandbox_init_point };

    } catch (error) {
      console.error("Error en la Cloud Function:", error);
      throw new functions.https.HttpsError("internal", "Ocurrió un error interno al procesar la solicitud.");
    }
  }
);