import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

// --- 1. GESTIÓN DE LA AUTENTICACIÓN ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Si el usuario está logueado, cargamos sus datos
        cargarDatosUsuario(user);
        cargarPedidos(user);
    } else {
        // Si no está logueado, lo redirigimos a la página de login
        window.location.href = "login.html";
    }
});

// --- 2. CARGAR DATOS DEL USUARIO ---
async function cargarDatosUsuario(user) {
    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const nombreCompleto = `${data.nombre} ${data.apellido}`;
        document.getElementById('nombre-usuario').textContent = data.nombre;
        document.getElementById('perfil-nombre').textContent = nombreCompleto;
        document.getElementById('perfil-email').textContent = data.email;
    } else {
        console.log("No se encontraron datos de perfil para el usuario.");
    }
}

// --- 3. CARGAR HISTORIAL DE PEDIDOS ---
async function cargarPedidos(user) {
    const pedidosRef = collection(db, "pedidos");
    const q = query(pedidosRef, where("userId", "==", user.uid), orderBy("fecha", "desc"));
    
    const querySnapshot = await getDocs(q);
    const listaPedidos = document.getElementById('lista-pedidos');
    
    if (querySnapshot.empty) {
        listaPedidos.innerHTML = '<p>No has realizado ningún pedido todavía.</p>';
        return;
    }

    listaPedidos.innerHTML = ''; // Limpiar el contenedor
    querySnapshot.forEach((doc) => {
        const pedido = doc.data();
        const fecha = new Date(pedido.fecha.seconds * 1000).toLocaleDateString();

        const pedidoHTML = `
            <div class="pedido-item">
                <div class="pedido-header">
                    <div>
                        <strong>FECHA:</strong> ${fecha}
                    </div>
                    <div>
                        <strong>TOTAL:</strong> $${pedido.total.toFixed(2)} ARS
                    </div>
                    <div>
                        <strong>ESTADO:</strong> ${pedido.estado || 'Procesando'}
                    </div>
                </div>
                <div class="pedido-body">
                    <p>ID del Pedido: ${doc.id}</p>
                </div>
            </div>
        `;
        listaPedidos.innerHTML += pedidoHTML;
    });
}


// --- 4. LÓGICA PARA EL MENÚ DE NAVEGACIÓN LATERAL ---
const navLinks = document.querySelectorAll('.cuenta-sidebar .nav-link');
const contentSections = document.querySelectorAll('.content-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que el link recargue la página

        // Quita la clase 'active' de todos los links y secciones
        navLinks.forEach(l => l.classList.remove('active'));
        contentSections.forEach(s => s.classList.remove('active'));

        // Añade la clase 'active' al link clickeado y a su sección correspondiente
        const targetId = link.getAttribute('data-target');
        const targetSection = document.querySelector(targetId);
        
        link.classList.add('active');
        if (targetSection) {
            targetSection.classList.add('active');
        }
    });
});