// server.js
// Carga las variables de entorno (.env)
require('dotenv').config(); 
const express = require('express');
const { Client } = require('pg'); // Importa el cliente de PostgreSQL

const app = express();
const PORT = process.env.PORT || 10000;

// Configuración del cliente de PostgreSQL
const client = new Client({
    connectionString: process.env.DATABASE_URL, // Usa la variable de Render/Supabase
    ssl: {
        rejectUnauthorized: false 
    }
});

// Middleware necesario para procesar datos del formulario (POST)
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());


// ------------------------------------------------------------------
// RUTA 1: Interfaz de Usuario (Ruta Raíz)
// ------------------------------------------------------------------

app.get('/', (req, res) => {
    // Esto es una interfaz de usuario simple para el entregable
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <title>Academia de Danza API</title>
            <style>
                body {
                    background-color: #FBEFF2; /* Rosado muy claro */
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding-top: 50px;
                }
                h1 {
                    color: #C71585; /* Rosa oscuro para el título */
                    margin-bottom: 20px;
                }
                h2 {
                    color: #A05299; /* Tono morado para contraste */
                }
                
                /* Estilo del Botón */
                .button {
                    display: inline-block;
                    padding: 10px 20px;
                    margin-top: 15px;
                    font-size: 16px;
                    font-weight: bold;
                    text-decoration: none; /* Quita el subrayado del enlace */
                    color: white; /* Color del texto del botón */
                    background-color: #C71585; /* Rosa oscuro como color principal */
                    border: none;
                    border-radius: 5px; /* Bordes redondeados */
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                
                .button:hover {
                    background-color: #B51378; /* Un poco más oscuro al pasar el ratón */
                }
            </style>
        </head>
        <body>
            <h1>Bienvenido a la API de la Academia de Danza</h1>
            <p class="status">Aplicación Desplegada y Conectada a la Base de Datos</p>
            <p><strong>Funcionalidad Principal:</strong> Consulta de Videos de Coreografías</p>
            <p>Esta es la interfaz de usuario requerida. Para iniciar sesión accede al siguiente enlace:</p>
            <a href="/login"class="button">INICIAR SESIÓN</a>
        </body>
        </html>
    `);
});

// Ruta GET /login: Muestra el formulario de inicio de sesión
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login - Práctica 4.1 SQLi</title>
            <style>
                body {
                    background-color: #FBEFF2; /* Rosado claro */
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding-top: 50px;
                }
                .login-container {
                    width: 300px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #C71585;
                    border-radius: 10px;
                    background-color: white;
                }
                input[type="text"], input[type="password"] {
                    width: 90%;
                    padding: 10px;
                    margin: 8px 0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                button {
                    background-color: #C71585;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="login-container">
                <h2>Inicio de Sesión VULNERABLE (Práctica 4.1)</h2>
                <form action="/login" method="POST">
                    <input type="text" name="username" placeholder="Usuario" required><br>
                    <input type="password" name="password" placeholder="Contraseña" required><br>
                    <button type="submit">Iniciar Sesión</button>
                </form>
                <p style="margin-top: 20px; font-size: 12px; color: gray;">
                    Instrucciones: Intenta iniciar sesión y luego prueba una inyección SQL para eludir la autenticación.
                </p>
            </div>
        </body>
        </html>
    `);
});


// Ruta POST /login: Procesa el formulario con una consulta vulnerable
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // **********************************************
    // 🛑 ESTA ES LA CONSULTA VULNERABLE (SQL INJECTION)
    // **********************************************
    const vulnerableQuery = `
        SELECT username 
        FROM users 
        WHERE username = '${username}' AND password = '${password}';
    `;

    console.log(`[VULNERABLE QUERY]: ${vulnerableQuery}`); // Útil para depurar

    try {
        const result = await client.query(vulnerableQuery);
        
        if (result.rows.length > 0) {
            // Éxito en el login (o éxito de la inyección)
            return res.send(`
                <h2>¡Inicio de Sesión Exitoso!</h2>
                <p>Bienvenido, ${result.rows[0].username}.</p>
                <p style="color: green;">La aplicación te permitió el acceso.</p>
                <a href="/login">Volver al login</a>
            `);
        } else {
            // Credenciales incorrectas
            return res.send(`
                <h2>Error de Autenticación</h2>
                <p>Usuario o contraseña incorrectos.</p>
                <a href="/login">Volver a intentar</a>
            `);
        }
    } catch (error) {
        // Manejo de errores de SQL (ej. error de sintaxis por la inyección)
        console.error('Error al ejecutar la consulta SQL:', error.message);
        return res.status(500).send(`
            <h2>ERROR INTERNO DEL SERVIDOR (Fallo de BD)</h2>
            <p>Ocurrió un error al procesar la solicitud (revisa los logs para el error SQL: ${error.message}).</p>
            <a href="/login">Volver al login</a>
        `);
    }
});


// ------------------------------------------------------------------
// FIX CRÍTICO: Mover app.listen para asegurar que la BD esté conectada
// ------------------------------------------------------------------
client.connect()
    .then(() => {
        console.log('Conexión a PostgreSQL exitosa para la Práctica 4.1');
        
        // El servidor Express solo empieza a escuchar una vez que la conexión de la BD es exitosa.
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor Express listo y escuchando en http://0.0.0.0:${PORT}`);
        });

    })
    .catch(err => {
        console.error('Error de conexión a PostgreSQL:', err.stack);
        // Si la BD falla, se termina el proceso para que Render lo sepa.
        process.exit(1); 
    });