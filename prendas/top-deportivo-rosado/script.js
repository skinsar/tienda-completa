const miniaturas = document.querySelectorAll('.miniaturas img');
const imgPrincipal = document.querySelector('.img-principal');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const closeModal = document.querySelector('.close');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

let currentIndex = 0;
let imgSources = [imgPrincipal.src, ...Array.from(miniaturas).map(img => img.src)];

// Al hacer clic en una miniatura, cambiar la imagen principal con transición
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

// Al hacer clic en la imagen principal, abre el modal
imgPrincipal.addEventListener('click', () => {
modal.style.display = 'block';
modalImg.src = imgPrincipal.src;
currentIndex = imgSources.indexOf(imgPrincipal.src);
});

// Mostrar imagen en el modal
function mostrarImagen(index) {
modalImg.src = imgSources[index];
}

// Cerrar modal
closeModal.addEventListener('click', () => {
modal.style.display = 'none';
});

// Cerrar si se hace clic fuera de la imagen
window.addEventListener('click', (e) => {
if (e.target === modal) {
    modal.style.display = 'none';
}
});

// Navegación dentro del modal
prevBtn.addEventListener('click', () => {
currentIndex = (currentIndex - 1 + imgSources.length) % imgSources.length;
mostrarImagen(currentIndex);
});

nextBtn.addEventListener('click', () => {
currentIndex = (currentIndex + 1) % imgSources.length;
mostrarImagen(currentIndex);
});

// Navegación con teclado
document.addEventListener('keydown', (e) => {
if (modal.style.display === 'block') {
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
    if (e.key === 'Escape') modal.style.display = 'none';
}
});
