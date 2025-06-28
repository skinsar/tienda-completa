import { db } from './firebase-config.js';
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const listaCarrito = document.getElementById('lista-carrito');
  const totalCarrito = document.getElementById('total-carrito');
  const botonVaciar = document.getElementById('vaciar-carrito');

  // Carga el carrito desde localStorage
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

  // Función para agrupar productos y contar cantidades
  function agruparProductos(carritoParaAgrupar) {
    return carritoParaAgrupar.reduce((acc, prod) => {
      if (!acc[prod.slug]) {
        acc[prod.slug] = { ...prod, cantidad: 0 };
      }
      acc[prod.slug].cantidad++;
      return acc;
    }, {});
  }

  // Función para mostrar/actualizar el carrito en el HTML
  async function mostrarCarrito() {
    listaCarrito.innerHTML = '';
    let total = 0;
    const productosAgrupados = agruparProductos(carrito);

    if (Object.keys(productosAgrupados).length === 0) {
      listaCarrito.innerHTML = '<li>Tu carrito está vacío.</li>';
      totalCarrito.textContent = 'Total: $0 ARS';
      return;
    }

    for (const slug in productosAgrupados) {
      const { nombre, precio, imagen, cantidad } = productosAgrupados[slug];
      
      const li = document.createElement('li');
      li.innerHTML = `
        <img src="${imagen}" alt="${nombre}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
        <span style="flex-grow: 1;">${nombre}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="restar" data-slug="${slug}" title="Restar uno">➖</button>
          <span>${cantidad}</span>
          <button class="sumar" data-slug="${slug}" title="Sumar uno">➕</button>
        </div>
        <span style="min-width: 100px; text-align: right;">$${(precio * cantidad).toFixed(2)} ARS</span>
        <button data-slug="${slug}" class="eliminar" title="Eliminar producto">❌</button>
      `;
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.gap = '15px';
      li.style.justifyContent = 'space-between';
      listaCarrito.appendChild(li);
      total += precio * cantidad;
    }

    totalCarrito.textContent = `Total: $${total.toFixed(2)} ARS`;
  }

  // Manejador de clics para toda la lista del carrito (más eficiente)
  listaCarrito.addEventListener('click', async (e) => {
    const slug = e.target.getAttribute('data-slug');
    if (!slug) return;

    const productoRef = doc(db, "productos", slug);
    let carritoModificado = false;

    try {
      if (e.target.classList.contains('restar')) {
        const index = carrito.findIndex(p => p.slug === slug);
        if (index !== -1) {
          carrito.splice(index, 1);
          const productoSnap = await getDoc(productoRef);
          if (productoSnap.exists()) {
            await updateDoc(productoRef, { stock: productoSnap.data().stock + 1 });
          }
          carritoModificado = true;
        }
      } else if (e.target.classList.contains('sumar')) {
        const productoSnap = await getDoc(productoRef);
        if (productoSnap.exists() && productoSnap.data().stock > 0) {
          const item = carrito.find(p => p.slug === slug);
          if(item) carrito.push(item);
          await updateDoc(productoRef, { stock: productoSnap.data().stock - 1 });
          carritoModificado = true;
        } else {
          alert('No hay más stock disponible.');
        }
      } else if (e.target.classList.contains('eliminar')) {
        const cantidadEliminada = carrito.filter(p => p.slug === slug).length;
        carrito = carrito.filter(p => p.slug !== slug);
        const productoSnap = await getDoc(productoRef);
        if (productoSnap.exists()) {
          await updateDoc(productoRef, { stock: productoSnap.data().stock + cantidadEliminada });
        }
        carritoModificado = true;
      }
    } catch (error) {
      console.error("Error al actualizar el producto en Firebase:", error);
      alert("Hubo un error al actualizar tu carrito. Inténtalo de nuevo.");
      // Opcional: podrías revertir el cambio en el `carrito` local si falla la actualización de DB
    }

    if (carritoModificado) {
      localStorage.setItem('carrito', JSON.stringify(carrito));
      mostrarCarrito();
    }
  });

  // Manejador para el botón de vaciar carrito
  botonVaciar.addEventListener('click', async () => {
    if (carrito.length > 0 && confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      try {
        const productosAgrupados = agruparProductos(carrito);
        for (const slug in productosAgrupados) {
          const { cantidad } = productosAgrupados[slug];
          const productoRef = doc(db, "productos", slug);
          const productoSnap = await getDoc(productoRef);
          if (productoSnap.exists()) {
            await updateDoc(productoRef, { stock: productoSnap.data().stock + cantidad });
          }
        }
      } catch (error) {
        console.error("Error al devolver el stock al vaciar el carrito:", error);
      } finally {
        carrito = [];
        localStorage.setItem('carrito', '[]');
        mostrarCarrito();
      }
    }
  });

  // Mostrar el carrito por primera vez al cargar la página
  mostrarCarrito();
});

// Función para agregar productos al carrito (usada por las páginas de producto)
export async function agregarAlCarrito({ nombre, precio, slug, imagen }) {
  try {
    const productoRef = doc(db, "productos", slug);
    const productoSnap = await getDoc(productoRef);

    if (!productoSnap.exists()) {
      alert("Este producto no existe en la base de datos.");
      return false;
    }

    const producto = productoSnap.data();
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const cantidadActual = carrito.filter(p => p.slug === slug).length;

    if (cantidadActual >= producto.stock) {
      alert("Alcanzaste el límite de stock disponible.");
      return false;
    }

    carrito.push({ nombre, precio, slug, imagen });
    localStorage.setItem('carrito', JSON.stringify(carrito));

    await updateDoc(productoRef, { stock: producto.stock - 1 });

    alert(`${nombre} fue agregado al carrito.`);
    return true;
  } catch(error) {
    console.error("Error al agregar producto al carrito:", error);
    alert("No se pudo agregar el producto. Inténtalo de nuevo.");
    return false;
  }
}