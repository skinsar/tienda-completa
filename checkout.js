import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {

    const listaResumen = document.getElementById('lista-resumen-pedido');
    const subtotalResumen = document.getElementById('subtotal-resumen');
    const envioResumen = document.getElementById('envio-resumen');
    const totalResumen = document.getElementById('total-resumen');
    const formEnvio = document.getElementById('form-envio');
    const inputCodigoPostal = document.getElementById('codigo-postal');
    const divResultadoEnvio = document.getElementById('opciones-envio-resultado');

    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) {
        window.location.href = 'pagina-principal.html';
        return;
    }

    let totalProductos = 0;
    let infoEnvioSeleccionado = null;
    let tarifas = [];

    function mostrarResumen() {
        let total = 0;
        const productosAgrupados = carrito.reduce((acc, prod) => {
            if (!acc[prod.slug]) { acc[prod.slug] = { ...prod, cantidad: 0 }; }
            acc[prod.slug].cantidad++;
            return acc;
        }, {});
        listaResumen.innerHTML = '';
        Object.values(productosAgrupados).forEach(prod => {
            const subtotal = prod.precio * prod.cantidad;
            total += subtotal;
            const li = document.createElement('li');
            li.innerHTML = `<span>${prod.cantidad} x ${prod.nombre}</span><span>$${subtotal.toFixed(2)}</span>`;
            listaResumen.appendChild(li);
        });
        totalProductos = total;
        subtotalResumen.textContent = `$${totalProductos.toFixed(2)}`;
        actualizarTotal();
    }

    function actualizarTotal() {
        const costoEnvio = infoEnvioSeleccionado ? infoEnvioSeleccionado.precio : 0;
        envioResumen.textContent = infoEnvioSeleccionado ? `$${costoEnvio.toFixed(2)}` : '--';
        const totalFinal = totalProductos + costoEnvio;
        totalResumen.innerHTML = `<strong>Total: $${totalFinal.toFixed(2)} ARS</strong>`;
    }

    inputCodigoPostal.addEventListener('blur', async () => {
        const postalCode = inputCodigoPostal.value.trim();
        if (postalCode.length < 4) {
            divResultadoEnvio.innerHTML = '';
            infoEnvioSeleccionado = null;
            actualizarTotal();
            return;
        }
        divResultadoEnvio.innerHTML = '<p>Cotizando...</p>';
        try {
            const functionURL = 'https://us-central1-skins-bf0b8.cloudfunctions.net/cotizarEnvio';
            const response = await fetch(functionURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postalCode })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Respuesta del servidor no válida');
            }
            const tarifas = await response.json();
            divResultadoEnvio.innerHTML = `
                <div class="opcion-envio">
                    <input type="radio" name="opcion-envio" id="envio-sucursal" value="${tarifas.precioSucursal}" data-zona="Retiro en Sucursal (${tarifas.provincia})">
                    <label for="envio-sucursal">Retiro en Sucursal - <b>$${tarifas.precioSucursal}</b></label>
                </div>
                <div class="opcion-envio">
                    <input type="radio" name="opcion-envio" id="envio-domicilio" value="${tarifas.precioDomicilio}" data-zona="Envío a Domicilio (${tarifas.provincia})">
                    <label for="envio-domicilio">Envío a Domicilio - <b>$${tarifas.precioDomicilio}</b></label>
                </div>
            `;
        } catch (error) {
            console.error("Error al cotizar envío:", error);
            divResultadoEnvio.innerHTML = `<p>${error.message}</p>`;
        }
    });

    divResultadoEnvio.addEventListener('change', (e) => {
        if (e.target.name === 'opcion-envio') {
            infoEnvioSeleccionado = {
                precio: parseFloat(e.target.value),
                zona: e.target.getAttribute('data-zona')
            };
            actualizarTotal();
        }
    });

    // --- LÓGICA FINAL PARA EL BOTÓN "CONTINUAR AL PAGO" ---
    formEnvio.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!infoEnvioSeleccionado) {
            alert("Por favor, ingresa tu código postal y selecciona un método de envío.");
            return;
        }

        const botonSubmit = document.querySelector('button[form="form-envio"]');
        botonSubmit.disabled = true;
        botonSubmit.textContent = 'Procesando...';

        const datosCliente = {
            nombre: document.getElementById('nombre').value,
            direccion: document.getElementById('direccion').value,
            ciudad: document.getElementById('ciudad').value,
            provincia: document.getElementById('provincia').value,
            codigoPostal: inputCodigoPostal.value,
            telefono: document.getElementById('telefono').value,
        };

        try {
            const functionURL = 'https://us-central1-skins-bf0b8.cloudfunctions.net/crearPreferenciaDePago';
            const response = await fetch(functionURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    carrito: carrito,
                    datosCliente: datosCliente,
                    envio: infoEnvioSeleccionado
                })
            });
            if (!response.ok) {
                throw new Error('Error del servidor al crear el pago');
            }
            const resultado = await response.json();
            window.location.href = resultado.url;
        } catch (error) {
            console.error("Error al procesar el pago:", error);
            alert('Hubo un error al crear el link de pago. Por favor, intenta de nuevo.');
            botonSubmit.disabled = false;
            botonSubmit.textContent = 'Continuar al Pago';
        }
    });
    
    mostrarResumen();
});