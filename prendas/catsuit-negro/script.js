// =================================================================
//  PARTE 1: LÓGICA DE VARIANTES (TALLE, COLOR Y STOCK) - (Mi Aporte)
// =================================================================

// Asumimos que tienes una forma de obtener el ID del producto actual
// (por ejemplo, desde la URL o un atributo en el HTML)
// Para este ejemplo, lo hardcodearemos. Deberías cambiarlo dinámicamente.
const productoId = "lxOrQRiiATEOpP5UOrKD"; // <--- CAMBIAR ESTO PARA CADA PRODUCTO

// Importamos las funciones necesarias de Firebase
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { db } from "../../firebase.js"; // Ajusta la ruta a tu archivo firebase.js

// Referencias a los elementos del DOM para las variantes
const selectorTalle = document.getElementById('selector-talle');
const selectorColor = document.getElementById('selector-color');
const stockDisponible = document.getElementById('stock-disponible');
const btnAgregarCarrito = document.getElementById('btn-agregar-carrito');

let productoData = null;

// Función para cargar los datos del producto desde Firestore
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
    }
}

// Evento cuando se cambia el talle
selectorTalle.addEventListener('change', () => {
    const talleSeleccionado = selectorTalle.value;
    
    selectorColor.innerHTML = '<option value="">Selecciona un color</option>';
    selectorColor.disabled = true;
    stockDisponible.textContent = '';
    btnAgregarCarrito.disabled = true;

    if (talleSeleccionado && productoData) {
        const coloresDisponibles = Object.keys(productoData.variantes[talleSeleccionado]);
        
        coloresDisponibles.forEach(color => {
            const stock = productoData.variantes[talleSeleccionado][color];
            if (stock > 0) {
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


// =================================================================
//  PARTE 2: LÓGICA DE LA GALERÍA DE IMÁGENES - (Tu Código Original)
// =================================================================

const miniaturas = document.querySelectorAll('.miniaturas img');
const imgPrincipal = document.querySelector('.img-principal');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const closeModal = document.querySelector('.close');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

let currentIndex = 0;
// Corregimos para que tome todas las imágenes, incluyendo la principal inicial y las miniaturas
let imgSources = [imgPrincipal.src, ...Array.from(miniaturas).map(img => img.src)];
// Eliminamos duplicados por si la principal ya es una de las miniaturas
imgSources = [...new Set(imgSources)];


miniaturas.forEach((miniatura) => {
    miniatura.addEventListener('click', () => {
        imgPrincipal.classList.add('fade-out');
        setTimeout(() => {
            imgPrincipal.src = miniatura.src;
            imgPrincipal.classList.remove('fade-out');
        }, 200);
    });
});

imgPrincipal.addEventListener('click', () => {
    modal.style.display = 'block';
    modalImg.src = imgPrincipal.src;
    currentIndex = imgSources.indexOf(imgPrincipal.src);
});

function mostrarImagen(index) {
    modalImg.src = imgSources[index];
}

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + imgSources.length) % imgSources.length;
    mostrarImagen(currentIndex);
});

nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % imgSources.length;
    mostrarImagen(currentIndex);
});

document.addEventListener('keydown', (e) => {
    if (modal.style.display === 'block') {
        if (e.key === 'ArrowLeft') prevBtn.click();
        if (e.key === 'ArrowRight') nextBtn.click();
        if (e.key === 'Escape') modal.style.display = 'none';
    }
});

// =================================================================
//  PARTE 3: CONEXIÓN CON EL CARRITO (YA NO SE NECESITA AQUÍ)
// =================================================================
// La sección "CARRITO UNIFICADO" que tenías antes ya no es necesaria en este archivo,
// porque ahora la llamada a `agregarAlCarrito` se hace directamente
// desde el atributo `onclick` del botón en el archivo HTML.
