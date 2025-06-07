// GALERÍA DE IMÁGENES
const miniaturas = document.querySelectorAll('.miniaturas img');
const imgPrincipal = document.querySelector('.img-principal');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const closeModal = document.querySelector('.close');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

let currentIndex = 0;
let imgSources = [imgPrincipal.src, ...Array.from(miniaturas).map(img => img.src)];

miniaturas.forEach((miniatura, index) => {
miniatura.addEventListener('click', () => {
    imgPrincipal.classList.add('fade-out');
    currentIndex = index + 1;
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


// ✅ CARRITO UNIFICADO
import { agregarAlCarrito } from '../../scripts-para-tienda/carrito.js';

document.querySelectorAll('.btn-agregar-carrito').forEach(boton => {
boton.addEventListener('click', async () => {
    const nombre = boton.getAttribute('data-nombre');
    const precio = parseInt(boton.getAttribute('data-precio'));
    const slug = boton.getAttribute('data-slug');
    const imagen = boton.getAttribute('data-imagen');

    const agregado = await agregarAlCarrito({ nombre, precio, slug, imagen });
    if (agregado) {
    location.reload();
    }
});
});
