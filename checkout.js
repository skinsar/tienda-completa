// Espera a que todo el contenido del HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // 1. Obtenemos las referencias a los elementos del HTML donde mostraremos los datos
    const listaResumen = document.getElementById('lista-resumen-pedido');
    const totalResumen = document.getElementById('total-resumen');
    
    // 2. Leemos el carrito desde el localStorage
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // Si el carrito está vacío, no debería estar en esta página. Lo redirigimos.
    if (carrito.length === 0) {
        alert('Tu carrito está vacío. Serás redirigido a la página principal.');
        window.location.href = 'pagina-principal.html';
        return; // Detenemos la ejecución del script
    }
    
    // 3. Función auxiliar para agrupar productos (igual que en carrito.js)
    function agruparProductos(carritoParaAgrupar) {
        return carritoParaAgrupar.reduce((acc, prod) => {
            if (!acc[prod.slug]) {
                acc[prod.slug] = { ...prod, cantidad: 0 };
            }
            acc[prod.slug].cantidad++;
            return acc;
        }, {});
    }

    // 4. Función principal para mostrar el resumen
    function mostrarResumen() {
        // Limpiamos cualquier contenido previo
        listaResumen.innerHTML = '';
        let total = 0;
        
        const productosAgrupados = agruparProductos(carrito);

        // Por cada producto agrupado, creamos un elemento en la lista
        for (const slug in productosAgrupados) {
            const { nombre, precio, cantidad } = productosAgrupados[slug];
            const subtotal = precio * cantidad;
            total += subtotal;

            const li = document.createElement('li');
            li.innerHTML = `
                <span>${cantidad} x ${nombre}</span>
                <strong>$${subtotal.toFixed(2)} ARS</strong>
            `;
            listaResumen.appendChild(li);
        }

        // Mostramos el total final
        totalResumen.textContent = `Total: $${total.toFixed(2)} ARS`;
    }

    // 5. Llamamos a la función para que se ejecute al cargar la página
    mostrarResumen();


    // Dentro del 'DOMContentLoaded' en checkout.js, después del código del resumen.

// 6. Manejo del formulario de envío
const formEnvio = document.getElementById('form-envio');

formEnvio.addEventListener('submit', (event) => {
    // Prevenimos el comportamiento por defecto del formulario (que es recargar la página)
    event.preventDefault(); 

    // Creamos un objeto para guardar los datos del cliente
    const datosCliente = {
        nombre: document.getElementById('nombre').value,
        direccion: document.getElementById('direccion').value,
        ciudad: document.getElementById('ciudad').value,
        provincia: document.getElementById('provincia').value,
        codigoPostal: document.getElementById('codigo-postal').value,
        telefono: document.getElementById('telefono').value,
    };

    // Por ahora, solo mostraremos los datos en la consola para verificar que los capturamos bien.
    console.log('Datos del Cliente:', datosCliente);
    console.log('Productos en el carrito:', carrito); // La variable 'carrito' ya la tenemos del paso anterior.

    alert('Datos del cliente capturados. Revisa la consola (F12) para verlos. ¡Listos para el siguiente paso!');

    // Aquí, en el futuro, llamaremos a la función para procesar el pago con Mercado Pago.
});
});