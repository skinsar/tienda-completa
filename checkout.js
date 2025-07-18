// Contenido FINAL para checkout.js (con cálculo de envío por provincia)

import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {

    // --- Referencias a elementos del HTML ---
    const listaResumen = document.getElementById('lista-resumen-pedido');
    const totalResumen = document.getElementById('total-resumen');
    const formEnvio = document.getElementById('form-envio');
    
    // Elementos nuevos para el envío
    const selectProvincia = document.getElementById('select-provincia');
    const divResultadoEnvio = document.getElementById('opciones-envio-resultado');

    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) {
        // Redirigimos si el carrito está vacío
        window.location.href = 'pagina-principal.html';
        return;
    }

    let totalProductos = 0;
    let infoEnvioSeleccionado = null; // Guardará el envío que el cliente elija
    let tarifas = []; // Aquí guardaremos todas las tarifas de la base de datos

    // --- Función para mostrar el resumen de productos ---
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
            li.innerHTML = `<span>${prod.cantidad} x ${prod.nombre}</span><strong>$${subtotal.toFixed(2)} ARS</strong>`;
            listaResumen.appendChild(li);
        });
        totalProductos = total;
        actualizarTotal(); // Llamamos a la nueva función para mostrar el total
    }

    // --- Nueva función para actualizar el total general ---
    function actualizarTotal() {
        const costoEnvio = infoEnvioSeleccionado ? infoEnvioSeleccionado.precio : 0;
        const totalFinal = totalProductos + costoEnvio;
        totalResumen.textContent = `Total: $${totalFinal.toFixed(2)} ARS`;
    }

    // --- LÓGICA DE CARGA Y MANEJO DE ENVÍOS ---
    try {
        // 1. Leemos todas las tarifas de envío desde Firestore, ordenadas por nombre
        const q = query(collection(db, "costos_envio"), orderBy("nombre", "asc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            tarifas.push({ id: doc.id, ...doc.data() });
        });

        // 2. Rellenamos el menú desplegable de provincias
        selectProvincia.innerHTML = '<option value="">-- Elige tu provincia --</option>';
        tarifas.forEach(tarifa => {
            selectProvincia.innerHTML += `<option value="${tarifa.id}">${tarifa.nombre}</option>`;
        });

        // 3. Escuchamos cuando el cliente elige una provincia
        selectProvincia.addEventListener('change', (e) => {
            const provinciaId = e.target.value;
            infoEnvioSeleccionado = null; // Reseteamos cualquier envío previo
            divResultadoEnvio.innerHTML = ''; // Limpiamos las opciones de envío
            actualizarTotal(); // Volvemos al total de solo productos

            if (provinciaId) {
                const tarifaElegida = tarifas.find(t => t.id === provinciaId);
                // Mostramos las opciones de domicilio y sucursal para la provincia elegida
                divResultadoEnvio.innerHTML = `
                    <div class="opcion-envio">
                        <input type="radio" name="opcion-envio" id="envio-domicilio" value="${tarifaElegida.precioDomicilio}" data-zona="Envío a Domicilio">
                        <label for="envio-domicilio">Envío a Domicilio - <b>$${tarifaElegida.precioDomicilio}</b></label>
                    </div>
                    <div class="opcion-envio">
                        <input type="radio" name="opcion-envio" id="envio-sucursal" value="${tarifaElegida.precioSucursal}" data-zona="Retiro en Sucursal">
                        <label for="envio-sucursal">Retiro en Sucursal - <b>$${tarifaElegida.precioSucursal}</b></label>
                    </div>
                `;
            }
        });

        // 4. Escuchamos cuando el cliente elige un tipo de envío (domicilio o sucursal)
        divResultadoEnvio.addEventListener('change', (e) => {
            if (e.target.name === 'opcion-envio') {
                infoEnvioSeleccionado = {
                    precio: parseFloat(e.target.value),
                    zona: e.target.getAttribute('data-zona')
                };
                actualizarTotal(); // Actualizamos el total general
            }
        });

    } catch (error) {
        console.error("Error al cargar las tarifas de envío:", error);
    }
    
    // --- Lógica del formulario de pago (ahora envía la info de envío) ---
    formEnvio.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        if (!infoEnvioSeleccionado) {
            alert("Por favor, selecciona una provincia y un método de envío.");
            return;
        }

        const botonSubmit = event.target.querySelector('button[type="submit"]') || document.querySelector('button[form="form-envio"]');
        botonSubmit.disabled = true;
        botonSubmit.textContent = 'Procesando...';

        const datosCliente = {
            nombre: document.getElementById('nombre').value,
            direccion: document.getElementById('direccion').value,
            ciudad: document.getElementById('ciudad').value,
            provincia: selectProvincia.options[selectProvincia.selectedIndex].text, // Guardamos el nombre de la provincia
            codigoPostal: document.getElementById('codigo-postal').value,
            telefono: document.getElementById('telefono').value,
        };
        const carritoParaEnviar = JSON.parse(localStorage.getItem('carrito')) || [];

        // Aquí iría la lógica para llamar a tu Cloud Function, asegurándote
        // de enviar 'carritoParaEnviar', 'datosCliente' y 'infoEnvioSeleccionado'.
        console.log("Enviando al backend:", {
            carrito: carritoParaEnviar,
            datosCliente: datosCliente,
            envio: infoEnvioSeleccionado
        });
        
        // Descomenta y ajusta la siguiente sección cuando la Cloud Function esté lista para recibir estos datos.
        /*
        const functionURL = '...';
        try {
            const response = await fetch(functionURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carrito: carritoParaEnviar, datosCliente, envio: infoEnvioSeleccionado })
            });

            if (!response.ok) throw new Error('Error del servidor');
            
            const resultado = await response.json();
            window.location.href = resultado.url;

        } catch (error) {
            console.error("Error al procesar el pago:", error);
            alert('Hubo un error al crear el link de pago.');
            botonSubmit.disabled = false;
            botonSubmit.textContent = 'Continuar al Pago';
        }
        */
    });
    
    // Carga inicial del resumen de productos
    mostrarResumen();
});