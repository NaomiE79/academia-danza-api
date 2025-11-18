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

//datos agregados
// Función de ayuda para convertir datos SQL en una tabla HTML
function generateGalleryTableHTML(data) {
    if (data.length === 0) {
        return '<p>No se encontraron videos en la galería.</p>';
    }

    // 1. Obtener los encabezados de la tabla (usando las keys del primer objeto)
    const headers = Object.keys(data[0]);

    let html = `
        <style>
            .gallery-table {
                width: 90%; 
                margin: 20px auto; 
                border-collapse: collapse; 
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .gallery-table th, .gallery-table td {
                border: 1px solid #ddd; 
                padding: 10px; 
                text-align: left;
            }
            .gallery-table th {
                background-color: #C71585; 
                color: white; 
                font-size: 0.9em;
            }
            .gallery-table tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            .gallery-table td a {
                color: #C71585;
                text-decoration: none;
            }
            .gallery-table td a:hover {
                text-decoration: underline;
            }
        </style>
        <table class="gallery-table">
            <thead>
                <tr>
                    ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    // 2. Llenar las filas con los datos
    data.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
            const value = row[header];
            // Si la columna es "Link", la convierte en un hipervínculo
            if (header === 'Link' && value) {
                 html += `<td><a href="${value}" target="_blank">Ver Video</a></td>`;
            } else {
                 html += `<td>${value === null ? 'N/A' : value}</td>`;
            }
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}


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
                    Ingresa tu nombre de usuario y tu contraseña
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
            // ==============================================================
            // ✅ CAMBIO CLAVE: Éxito en el login -> Ejecutar consulta de galería
            // ==============================================================
            
            // 1. Definir la consulta de la galería de videos
            const galleryQuery = `
                SELECT
                    v.id_video AS "ID",
                    v.titulo_video AS "Título del Video",
                    v.enlace AS "Link", 
                    c.nombre AS "Canción Principal",
                    ve.nombre_version AS "Versión",
                    COALESCE(g.nombre_grupo, '[Solista/General]') AS "Grupo Asignado",
                    CONCAT(v.dia, '/', v.mes, '/', v.año) AS "Fecha Grabación",
                    CASE
                        WHEN pr.id_video IS NOT NULL THEN 'Presentación'
                        WHEN e.id_video IS NOT NULL THEN 'Ensayo'
                        ELSE 'General'
                    END AS "Tipo de Contenido"
                FROM
                    video v
                JOIN
                    version ve ON v.id_cancion = ve.id_cancion AND v.id_version = ve.id_version
                JOIN
                    cancion c ON ve.id_cancion = c.id_cancion
                LEFT JOIN
                    grupo g ON v.id_grupo = g.id_grupo
                LEFT JOIN
                    presentacion pr ON v.id_video = pr.id_video
                LEFT JOIN
                    ensayo e ON v.id_video = e.id_video
                ORDER BY
                    v.año DESC, v.mes DESC, v.dia DESC;
            `;

            // 2. Ejecutar la consulta de la galería
            const galleryResult = await client.query(galleryQuery);
            const galleryHTML = generateGalleryTableHTML(galleryResult.rows);

            // 3. Devolver la vista con la tabla
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Galería de Videos</title>
                    <style>
                        body { background-color: #FBEFF2; font-family: Arial, sans-serif; text-align: center; padding-top: 20px; }
                        h1 { color: #C71585; }
                        a { color: #A05299; margin: 20px; display: inline-block; }
                    </style>
                </head>
                <body>
                    <h1>¡Bienvenido! Galería de Videos de la Academia</h1>
                    ${galleryHTML} 
                    <a href="/login">Volver al login</a>
                </body>
                </html>
            `);
            
        } else {
            // Credenciales incorrectas (no hay cambio aquí)
            return res.send(`
                <h2>Error de Autenticación</h2>
                <p>Usuario o contraseña incorrectos.</p>
                <a href="/login">Volver a intentar</a>
            `);
        }
    } catch (error) {
        // Manejo de errores de SQL (no hay cambio aquí)
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