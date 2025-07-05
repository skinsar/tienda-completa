// Contenido DEFINITIVO Y FINAL para checkout.js

document.addEventListener('DOMContentLoaded', () => {

    const listaResumen = document.getElementById('lista-resumen-pedido');
    const totalResumen = document.getElementById('total-resumen');
    
    // Leemos el carrito aquí para la vista inicial
    const carritoInicial = JSON.parse(localStorage.getItem('carrito')) || [];

    if (carritoInicial.length === 0) {
        alert('Tu carrito está vacío. Serás redirigido a la página principal.');
        window.location.href = 'pagina-principal.html';
        return; 
    }
    
    function agruparProductos(carritoParaAgrupar) {
        return carritoParaAgrupar.reduce((acc, prod) => {
            if (!acc[prod.slug]) {
                acc[prod.slug] = { ...prod, cantidad: 0 };
            }
            acc[prod.slug].cantidad++;
            return acc;
        }, {});
    }

    function mostrarResumen() {
        listaResumen.innerHTML = '';
        let total = 0;
        const productosAgrupados = agruparProductos(carritoInicial);
        for (const slug in productosAgrupados) {
            const { nombre, precio, cantidad } = productosAgrupados[slug];
            const subtotal = precio * cantidad;
            total += subtotal;
            const li = document.createElement('li');
            li.innerHTML = `<span>${cantidad} x ${nombre}</span><strong>$${subtotal.toFixed(2)} ARS</strong>`;
            listaResumen.appendChild(li);
        }
        totalResumen.textContent = `Total: $${total.toFixed(2)} ARS`;
    }

    // Mostramos el resumen con el carrito inicial
    mostrarResumen();

    const formEnvio = document.getElementById('form-envio');

    formEnvio.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        // --- INICIO DE LA CORRECCIÓN FINAL ---
        // Leemos el carrito DESDE localStorage OTRA VEZ, justo antes de enviarlo.
        // Esto asegura que siempre tengamos los datos y evita el error de "scope".
        const carritoParaEnviar = JSON.parse(localStorage.getItem('carrito')) || [];
        // --- FIN DE LA CORRECCIÓN FINAL ---

        const botonSubmit = event.target.querySelector('button[type="submit"]');
        botonSubmit.disabled = true;
        botonSubmit.textContent = 'Procesando...';

        const datosCliente = {
            nombre: document.getElementById('nombre').value,
            direccion: document.getElementById('direccion').value,
            ciudad: document.getElementById('ciudad').value,
            provincia: document.getElementById('provincia').value,
            codigoPostal: document.getElementById('codigo-postal').value,
            telefono: document.getElementById('telefono').value,
        };

        const functionURL = 'https://us-central1-skins-bf0b8.cloudfunctions.net/crearPreferenciaDePago';

        try {
            const response = await fetch(functionURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Usamos la variable que acabamos de leer
                body: JSON.stringify({ carrito: carritoParaEnviar, datosCliente: datosCliente })
            });

            if (!response.ok) {
                throw new Error('La respuesta del servidor no fue OK: ' + response.status);
            }

            const resultado = await response.json();
            window.location.href = resultado.url;

        } catch (error) {
            console.error("Error detallado al llamar a la Cloud Function:", error);
            alert('Hubo un error al crear el link de pago. Por favor, intenta de nuevo.');
            botonSubmit.disabled = false;
            botonSubmit.textContent = 'Continuar al Pago';
        }
    });
});