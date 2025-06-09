import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

async function mostrarProductos() {
    const productosContainer = document.querySelector('#productos .galeria-productos');
    if (!productosContainer) return;

     productosContainer.innerHTML = ''; // limpio antes
    
    const querySnapshot = await getDocs(collection(db, "productos"));
    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const productoHTML = `
            <div class="producto-card">
                <a href="prendas/${data.slug}/index.html">
                    <div class="imagen-hover-container">
                        <img src="${data.imagenPrincipal}" alt="${data.nombre}" class="img-default">
                        <img src="${data.imagenHover}" alt="${data.nombre} Hover" class="img-hover">
                    </div>
                    <h3>${data.nombre}</h3>
                    <p class="precio">$${data.precio} ARS</p>
                </a>
                <button
                    class="btn-agregar-carrito"
                    data-nombre="${data.nombre}"
                    data-precio="${data.precio}"
                    data-slug="${data.slug}"
                    data-imagen="${data.imagenPrincipal}"
                >Agregar al carrito</button>
            </div>
        `;
        productosContainer.innerHTML += productoHTML;
    });

    activarBotonesCarrito();
}

function activarBotonesCarrito() {
    const botones = document.querySelectorAll('.btn-agregar-carrito');

    botones.forEach(boton => {
        boton.addEventListener('click', async () => {
            const nombre = boton.getAttribute('data-nombre');
            const precio = parseInt(boton.getAttribute('data-precio'));
            const slug = boton.getAttribute('data-slug');
            const imagen = boton.getAttribute('data-imagen');

            const productoRef = doc(db, "productos", slug);
            const productoSnap = await getDoc(productoRef);

            if (!productoSnap.exists()) {
                alert("Este producto no existe en la base de datos.");
                return;
            }

            const producto = productoSnap.data();

            if (producto.stock <= 0) {
                alert("Lo sentimos, este producto está agotado.");
                return;
            }

            let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

            const productoEnCarrito = carrito.find(p => p.slug === slug);

            if (productoEnCarrito) {
                if (productoEnCarrito.cantidad < producto.stock) {
                    productoEnCarrito.cantidad += 1;
                } else {
                    alert("Alcanzaste el límite de stock disponible.");
                    return;
                }
            } else {
                carrito.push({
                    nombre,
                    precio,
                    slug,
                    imagen,
                    cantidad: 1
                });
            }

            localStorage.setItem('carrito', JSON.stringify(carrito));

            await updateDoc(productoRef, {
                stock: producto.stock - 1
            });

            alert(`${nombre} fue agregado al carrito.`);
            location.reload();
        });
    });
}

mostrarProductos();
