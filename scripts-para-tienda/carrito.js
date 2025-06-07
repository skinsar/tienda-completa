import { db } from './firebase-config.js';
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const listaCarrito = document.getElementById('lista-carrito');
  const totalCarrito = document.getElementById('total-carrito');
  const botonVaciar = document.getElementById('vaciar-carrito');

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

  function agruparProductos(carrito) {
    const agrupado = {};
    carrito.forEach(prod => {
      if (!agrupado[prod.slug]) {
        agrupado[prod.slug] = { ...prod, cantidad: 1 };
      } else {
        agrupado[prod.slug].cantidad++;
      }
    });
    return Object.values(agrupado);
  }

  function mostrarCarrito() {
    listaCarrito.innerHTML = '';
    let total = 0;
    const productosAgrupados = agruparProductos(carrito);

    if (productosAgrupados.length === 0) {
      listaCarrito.innerHTML = '<li>Tu carrito está vacío.</li>';
      totalCarrito.textContent = 'Total: $0 ARS';
      return;
    }

    productosAgrupados.forEach(({ nombre, precio, slug, imagen, cantidad }) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <img src="${imagen}" alt="${nombre}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
        <span>${nombre} x${cantidad} - $${(precio * cantidad).toFixed(2)} ARS</span>
        <button data-slug="${slug}" class="eliminar">❌</button>
      `;
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.gap = '10px';
      listaCarrito.appendChild(li);
      total += precio * cantidad;
    });

    totalCarrito.textContent = `Total: $${total.toFixed(2)} ARS`;
  }

  listaCarrito.addEventListener('click', async (e) => {
    if (e.target.classList.contains('eliminar')) {
      const slug = e.target.getAttribute('data-slug');
      const index = carrito.findIndex(p => p.slug === slug);

      if (index !== -1) {
        carrito.splice(index, 1);
        localStorage.setItem('carrito', JSON.stringify(carrito));
        mostrarCarrito();

        const productoRef = doc(db, "productos", slug);
        const productoSnap = await getDoc(productoRef);

        if (productoSnap.exists()) {
          const producto = productoSnap.data();
          await updateDoc(productoRef, {
            stock: producto.stock + 1
          });
        }
      }
    }
  });

  botonVaciar.addEventListener('click', async () => {
    if (confirm('¿Querés vaciar el carrito?')) {
      const productosAgrupados = agruparProductos(carrito);

      for (const { slug, cantidad } of productosAgrupados) {
        const productoRef = doc(db, "productos", slug);
        const productoSnap = await getDoc(productoRef);

        if (productoSnap.exists()) {
          const producto = productoSnap.data();
          await updateDoc(productoRef, {
            stock: producto.stock + cantidad
          });
        }
      }

      carrito = [];
      localStorage.removeItem('carrito');
      mostrarCarrito();
    }
  });

  mostrarCarrito();
});


//
export async function agregarAlCarrito({ nombre, precio, slug, imagen }) {
  const productoRef = doc(db, "productos", slug);
  const productoSnap = await getDoc(productoRef);

  if (!productoSnap.exists()) {
    alert("Este producto no existe en la base de datos.");
    return false;
  }

  const producto = productoSnap.data();

  if (producto.stock <= 0) {
    alert("Lo sentimos, este producto está agotado.");
    return false;
  }

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (carrito.find(p => p.slug === slug)) {
    alert("Ya agregaste este producto al carrito.");
    return false;
  }

  carrito.push({ nombre, precio, slug, imagen });
  localStorage.setItem('carrito', JSON.stringify(carrito));

  await updateDoc(productoRef, {
    stock: producto.stock - 1
  });

  alert(`${nombre} fue agregado al carrito.`);
  return true;
}