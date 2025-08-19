// Contenido para script.js en la página de un producto

// Asumimos que tienes una forma de obtener el ID del producto actual
// (por ejemplo, desde la URL o un atributo en el HTML)
// Para este ejemplo, lo hardcodearemos. Deberías cambiarlo dinámicamente.
const productoId = "qhpihcE7MptmZ5zqc17n"; // <--- CAMBIAR ESTO

// Importamos las funciones necesarias de Firebase
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { db } from "../../firebase.js"; // Ajusta la ruta a tu archivo firebase.js

// Referencias a los elementos del DOM
const selectorTalle = document.getElementById('selector-talle');
const selectorColor = document.getElementById('selector-color');
const stockDisponible = document.getElementById('stock-disponible');
const btnAgregarCarrito = document.getElementById('btn-agregar-carrito');

let productoData = null;

// Función para cargar los datos del producto
async function cargarProducto() {
    const docRef = doc(db, "productos", productoId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        productoData = docSnap.data();
        
        // Llenar el selector de talles
        const tallesDisponibles = Object.keys(productoData.variantes);
        selectorTalle.innerHTML = '<option value="">Selecciona un talle</option>';
        tallesDisponibles.forEach(talle => {
            const option = document.createElement('option');
            option.value = talle;
            option.textContent = talle;
            selectorTalle.appendChild(option);
        });
        
        selectorTalle.disabled = false;
    } else {
        console.log("No se encontró el producto!");
        // Manejar el caso en que el producto no exista
    }
}

// Evento cuando se cambia el talle
selectorTalle.addEventListener('change', () => {
    const talleSeleccionado = selectorTalle.value;
    
    // Limpiar y deshabilitar selector de color y botón
    selectorColor.innerHTML = '<option value="">Selecciona un color</option>';
    selectorColor.disabled = true;
    stockDisponible.textContent = '';
    btnAgregarCarrito.disabled = true;

    if (talleSeleccionado && productoData) {
        const coloresDisponibles = Object.keys(productoData.variantes[talleSeleccionado]);
        
        coloresDisponibles.forEach(color => {
            const stock = productoData.variantes[talleSeleccionado][color];
            if (stock > 0) { // Solo mostrar colores con stock
                const option = document.createElement('option');
                option.value = color;
                option.textContent = color;
                selectorColor.appendChild(option);
            }
        });

        selectorColor.disabled = false;
    }
});

// Evento cuando se cambia el color
selectorColor.addEventListener('change', () => {
    const talleSeleccionado = selectorTalle.value;
    const colorSeleccionado = selectorColor.value;

    btnAgregarCarrito.disabled = true;

    if (talleSeleccionado && colorSeleccionado && productoData) {
        const stock = productoData.variantes[talleSeleccionado][colorSeleccionado];
        stockDisponible.textContent = `Stock: ${stock}`;
        
        if (stock > 0) {
            btnAgregarCarrito.disabled = false;
        }
    } else {
        stockDisponible.textContent = '';
    }
});

// Inicializar la carga del producto
cargarProducto();