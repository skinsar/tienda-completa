// Contenido FINAL para checkout.js (usando fetch)

document.addEventListener('DOMContentLoaded', () => {
    const listaResumen = document.getElementById('lista-resumen-pedido');
    const totalResumen = document.getElementById('total-resumen');
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    if (carrito.length === 0) {
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
        const productosAgrupados = agruparProductos(carrito);
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

    mostrarResumen();

    const formEnvio = document.getElementById('form-envio');
    formEnvio.addEventListener('submit', async (event) => {
        event.preventDefault(); 
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

        // La URL de nuestra función que puedes ver en la consola de Firebase
        const functionURL = 'https://us-central1-skins-bf0b8.cloudfunctions.net/crearPreferenciaDePago';

        try {
            // Usamos fetch para llamar a nuestra función
            const response = await fetch(functionURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ carrito, datosCliente })
            });

            if (!response.ok) {
                throw new Error('La respuesta del servidor no fue OK: ' + response.status);
            }

            const resultado = await response.json();
            // Redirigimos al cliente a la URL de pago
            window.location.href = resultado.url;

        } catch (error) {
            console.error("Error al llamar a la Cloud Function:", error);
            alert('Hubo un error al crear el link de pago. Por favor, intenta de nuevo.');
            botonSubmit.disabled = false;
            botonSubmit.textContent = 'Continuar al Pago';
        }
    });
});