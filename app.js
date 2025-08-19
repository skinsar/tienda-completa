// Contenido para tu nuevo archivo app.js

// Importamos la herramienta de autenticación desde tu archivo de configuración de Firebase
import { auth } from './firebase.js';

// Escuchador que se fija si un usuario inició o cerró sesión
auth.onAuthStateChanged((user) => {
    const loginNavItem = document.getElementById('login-nav-item');
    const miCuentaNavItem = document.getElementById('mi-cuenta-nav-item');
    const logoutNavItem = document.getElementById('logout-nav-item');

    // Comprobamos que existan los elementos antes de intentar modificarlos
    if (loginNavItem && miCuentaNavItem && logoutNavItem) {
        if (user) {
            // Si hay un usuario, mostramos "Mi Cuenta" y "Cerrar Sesión"
            console.log("Usuario conectado:", user.email);
            loginNavItem.style.display = 'none';
            miCuentaNavItem.style.display = 'list-item';
            logoutNavItem.style.display = 'list-item';
        } else {
            // Si no hay usuario, mostramos "Iniciar Sesión"
            console.log("No hay usuario conectado.");
            loginNavItem.style.display = 'list-item';
            miCuentaNavItem.style.display = 'none';
            logoutNavItem.style.display = 'none';
        }
    }
});

// Lógica para el botón de Cerrar Sesión
document.addEventListener('click', function(e) {
    // Nos aseguramos de que el elemento exista y que se hizo clic en él
    if (e.target && e.target.id == 'logout-link') {
        e.preventDefault(); // Prevenimos que el link '#'' recargue la página
        auth.signOut().then(() => {
            console.log("Sesión cerrada exitosamente.");
            // Redirigimos a la página principal tras cerrar sesión
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error("Error al cerrar sesión:", error);
        });
    }
});