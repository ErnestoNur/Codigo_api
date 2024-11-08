function login(correo, contrasena) {
    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo, contrasena })
    })
    .then(response => response.json())
    .then(data => {
        if (data.usuario) {
            
            localStorage.setItem('usuario_id', data.usuario.id);
            console.log('Usuario autenticado:', data.usuario);
        } else {
            console.error('Error al iniciar sesión:', data.error);
        }
    })
    .catch(error => {
        console.error('Error en la solicitud de login:', error);
    });
}
