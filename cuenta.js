// Contenido final para cuenta.js (con manejo de dirección)

import { auth, db } from './firebase.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
// (El resto de las importaciones para la sección de pedidos ya no son necesarias aquí)

auth.onAuthStateChanged(async (user) => {
    if (user) {
        // --- LÓGICA DEL PERFIL ---
        const formPerfil = document.getElementById('form-perfil');
        const inputNombre = document.getElementById('perfil-nombre');
        const inputApellido = document.getElementById('perfil-apellido');
        const inputEmail = document.getElementById('perfil-email');
        // Nuevos campos de dirección
        const selectProvincia = document.getElementById('perfil-provincia');
        const inputCiudad = document.getElementById('perfil-ciudad');
        const inputDireccion = document.getElementById('perfil-direccion');
        
        const btnEditar = document.getElementById('btn-editar-perfil');
        const btnGuardar = document.getElementById('btn-guardar-perfil');

        const userDocRef = doc(db, 'usuarios', user.uid);
        
        // Función para rellenar el formulario
        const rellenarDatos = (datos) => {
            inputNombre.value = datos.nombre || '';
            inputApellido.value = datos.apellido || '';
            inputEmail.value = datos.email;
            selectProvincia.value = datos.provincia || '';
            inputCiudad.value = datos.ciudad || '';
            inputDireccion.value = datos.direccion || '';
        };

        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            rellenarDatos(userDocSnap.data());
        } else {
            inputEmail.value = user.email;
        }

        // Habilitar la edición
        btnEditar.addEventListener('click', () => {
            [inputNombre, inputApellido, selectProvincia, inputCiudad, inputDireccion].forEach(el => el.disabled = false);
            btnGuardar.style.display = 'inline-block';
            btnEditar.style.display = 'none';
        });

        // Guardar los cambios del formulario
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            const datosActualizados = {
                nombre: inputNombre.value,
                apellido: inputApellido.value,
                provincia: selectProvincia.value,
                ciudad: inputCiudad.value,
                direccion: inputDireccion.value
            };

            try {
                await updateDoc(userDocRef, datosActualizados);
                alert('¡Perfil actualizado con éxito!');
                [inputNombre, inputApellido, selectProvincia, inputCiudad, inputDireccion].forEach(el => el.disabled = true);
                btnGuardar.style.display = 'none';
                btnEditar.style.display = 'inline-block';
            } catch (error) {
                console.error("Error al actualizar el perfil:", error);
                alert('Hubo un error al guardar tus datos.');
            }
        });

        // La lógica para mostrar los pedidos no necesita estar aquí,
        // ya que la movimos a su propio script en la página de pedidos.
        // Si quieres mantenerla aquí, asegúrate de importar todo lo necesario de Firestore.

    } else {
        alert("Debes iniciar sesión para ver tu cuenta.");
        window.location.href = 'login.html';
    }
});