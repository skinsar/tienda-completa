// Contenido DEFINITIVO para tu archivo carrito.js

import { db } from './firebase.js'; // Asegúrate que la ruta a tu firebase.js sea correcta
import { doc, updateDoc, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

// --- Lógica Principal del Carrito ---
document.addEventListener('DOMContentLoaded', () => {
    const listaCarrito = document.getElementById('lista-carrito'); // Asume que tienes este elemento en carrito.html
    const totalCarrito = document.getElementById('total-carrito');   // Asume que tienes este elemento
    const botonVaciar = document.getElementById('vaciar-carrito');     // Asume que tienes este elemento

    // Función para mostrar/actualizar el carrito en el HTML
    function mostrarCarrito() {
        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        if (!listaCarrito || !totalCarrito) return; // No hacer nada si no estamos en la página del carrito

        listaCarrito.innerHTML = '';
        let totalGeneral = 0;

        if (carrito.length === 0) {
            listaCarrito.innerHTML = '<li>Tu carrito está vacío.</li>';
            totalCarrito.textContent = 'Total: $0 ARS';
            return;
        }

        carrito.forEach(item => {
            const totalItem = item.precio * item.cantidad;
            totalGeneral += totalItem;
            
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.nombre} (Talle: ${item.talle}, Color: ${item.color})</span>
                <div>
                    <button class="restar" data-idvariante="${item.idVariante}" title="Restar uno">➖</button>
                    <span>${item.cantidad}</span>
                    <button class="sumar" data-idvariante="${item.idVariante}" title="Sumar uno">➕</button>
                </div>
                <span>$${totalItem.toFixed(2)} ARS</span>
                <button data-idvariante="${item.idVariante}" class="eliminar" title="Eliminar producto">❌</button>
            `;
            // Puedes añadir estilos si lo necesitas
            listaCarrito.appendChild(li);
        });

        totalCarrito.textContent = `Total: $${totalGeneral.toFixed(2)} ARS`;
    }

    // --- Manejadores de Eventos para los botones del carrito ---
    if (listaCarrito) {
        listaCarrito.addEventListener('click', async (e) => {
            const idVariante = e.target.getAttribute('data-idvariante');
            if (!idVariante) return;

            if (e.target.classList.contains('restar')) {
                // Lógica para restar cantidad
                // (Se omite por simplicidad, se puede añadir si es necesario)
            } else if (e.target.classList.contains('sumar')) {
                // Lógica para sumar cantidad
                // (Se omite por simplicidad, se puede añadir si es necesario)
            } else if (e.target.classList.contains('eliminar')) {
                eliminarItemCompleto(idVariante);
            }
        });
    }

    if (botonVaciar) {
        botonVaciar.addEventListener('click', vaciarCarrito);
    }
    
    // Mostrar el carrito por primera vez al cargar la página
    mostrarCarrito();
});


// --- Funciones Globales para ser llamadas desde otras páginas ---

// NUEVA función para agregar productos al carrito (reemplaza la tuya)
window.agregarAlCarrito = async function(productoId, nombreProducto, precioProducto) {
    const talle = document.getElementById('selector-talle').value;
    const color = document.getElementById('selector-color').value;

    if (!talle || !color) {
        alert("Por favor, selecciona un talle y un color.");
        return;
    }

    const productoRef = doc(db, "productos", productoId);
    
    try {
        await runTransaction(db, async (transaction) => {
            const productoSnap = await transaction.get(productoRef);
            if (!productoSnap.exists()) {
                throw "El producto no existe!";
            }

            const stockActual = productoSnap.data().variantes[talle]?.[color] ?? 0;

            if (stockActual <= 0) {
                throw "No hay más stock disponible para esta variante.";
            }

            // CAMBIO: La ruta al stock ahora es dinámica usando `.`
            const nuevoStock = stockActual - 1;
            const rutaStock = `variantes.${talle}.${color}`;
            transaction.update(productoRef, { [rutaStock]: nuevoStock });

            // Lógica para guardar en localStorage
            let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
            const idVariante = `${productoId}-${talle}-${color}`;
            const itemExistente = carrito.find(item => item.idVariante === idVariante);

            if (itemExistente) {
                itemExistente.cantidad++;
            } else {
                carrito.push({
                    idVariante: idVariante,
                    idProducto: productoId,
                    nombre: nombreProducto,
                    precio: precioProducto,
                    talle: talle,
                    color: color,
                    cantidad: 1
                });
            }
            localStorage.setItem('carrito', JSON.stringify(carrito));
        });

        alert(`'${nombreProducto}' (Talle: ${talle}, Color: ${color}) se ha añadido al carrito.`);
        // Aquí puedes actualizar un contador visual del carrito si lo tienes
        
    } catch (error) {
        console.error("Error al agregar al carrito:", error);
        alert("No se pudo agregar el producto. " + error);
    }
}

// NUEVA función para eliminar un item (todas sus cantidades)
async function eliminarItemCompleto(idVariante) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const itemAEliminar = carrito.find(item => item.idVariante === idVariante);

    if (!itemAEliminar) return;

    const { idProducto, talle, color, cantidad } = itemAEliminar;
    const productoRef = doc(db, "productos", idProducto);

    try {
        // Devolver el stock a la base de datos
        const productoSnap = await getDoc(productoRef);
        if (productoSnap.exists()) {
            const stockActual = productoSnap.data().variantes[talle]?.[color] ?? 0;
            const nuevoStock = stockActual + cantidad;
            const rutaStock = `variantes.${talle}.${color}`;
            await updateDoc(productoRef, { [rutaStock]: nuevoStock });
        }
        
        // Eliminar del localStorage
        const nuevoCarrito = carrito.filter(item => item.idVariante !== idVariante);
        localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
        
        // Volver a renderizar el carrito
        location.reload(); // La forma más simple de actualizar la vista
        
    } catch (error) {
        console.error("Error al eliminar el item:", error);
        alert("Hubo un error al eliminar el producto del carrito.");
    }
}

// NUEVA función para vaciar todo el carrito
async function vaciarCarrito() {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0 || !confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        return;
    }

    try {
        for (const item of carrito) {
            const { idProducto, talle, color, cantidad } = item;
            const productoRef = doc(db, "productos", idProducto);
            const productoSnap = await getDoc(productoRef);

            if (productoSnap.exists()) {
                const stockActual = productoSnap.data().variantes[talle]?.[color] ?? 0;
                const nuevoStock = stockActual + cantidad;
                const rutaStock = `variantes.${talle}.${color}`;
                await updateDoc(productoRef, { [rutaStock]: nuevoStock });
            }
        }
    } catch(error) {
        console.error("Error al devolver el stock:", error);
    } finally {
        // Limpiar el carrito localmente sin importar si hubo error
        localStorage.setItem('carrito', '[]');
        location.reload(); // Recargar para mostrar el carrito vacío
    }
}