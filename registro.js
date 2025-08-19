// Contenido CORREGIDO para registro.js

import { auth, db } from './firebase.js';
// Aseguramos que la versión sea la misma que en tus otros archivos
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const formRegistro = document.getElementById('form-registro');
const msg = document.getElementById('msg');

formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // 1. Verificamos que las contraseñas coincidan
    if (password !== passwordConfirm) {
        msg.style.color = 'red';
        msg.textContent = 'Las contraseñas no coinciden.';
        return;
    }

    try {
        // 2. Creamos el usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 3. Creamos el documento en la colección "usuarios" con todos los datos
        await setDoc(doc(db, "usuarios", user.uid), {
            nombre: nombre,
            apellido: apellido,
            email: user.email,
            fechaDeCreacion: serverTimestamp(),
            rol: "cliente"
        });

        // 4. Redirigimos a la página principal
        alert('¡Registro exitoso! Ya puedes iniciar sesión.');
        window.location.href = "index.html";

    } catch (error) {
        console.error("Error en el registro:", error);
        msg.style.color = 'red';
        if (error.code === 'auth/email-already-in-use') {
            msg.textContent = 'El correo electrónico ya está en uso.';
        } else {
            msg.textContent = 'Hubo un error al registrar el usuario.';
        }
    }
});