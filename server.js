// server.js
const express = require('express');
const { Client } = require('pg'); 
require('dotenv').config(); // Para cargar el archivo .env localmente

const app = express();
app.use(express.json());

// 1. Proceso de conexión entre aplicación y base de datos
const client = new Client({
    connectionString: process.env.DATABASE_URL, // Usa la URI del .env / Render
});

client.connect()
    .then(() => console.log('✅ Conexión exitosa a Supabase (PostgreSQL)'))
    .catch(err => console.error('❌ Error de conexión a la BD', err.stack));

// ------------------------------------------------------------------
// RUTA 1: Interfaz de Usuario (HTML simple para el Entregable 1: Interfaz de usuario)
// ------------------------------------------------------------------
app.get('/', (req, res) => {
    // Esto es una interfaz de usuario simple para el entregable
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <title>Academia de Danza API</title>
            <style>
                body { font-family: sans-serif; padding: 40px; text-align: center; }
                a { color: #3498db; text-decoration: none; }
                a:hover { text-decoration: underline; }
                .status { padding: 10px; border-radius: 5px; background-color: #eaf7e3; color: #27ae60; border: 1px solid #27ae60; display: inline-block; }
            </style>
        </head>
        <body>
            <h1>Bienvenido a la API de la Academia de Danza</h1>
            <p class="status">Aplicación Desplegada y Conectada a la Base de Datos.</p>
            <p><strong>Funcionalidad Principal:</strong> Consulta de Videos de Coreografías.</p>
            <p>Accede a la ruta de datos para ver los videos:</p>
            <p><a href="/videos">/videos</a></p>
        </body>
        </html>
    `);
});


// ------------------------------------------------------------------
// RUTA 2: Funcionalidad Principal (Consulta de Videos)
// ------------------------------------------------------------------
app.get('/videos', async (req, res) => {
    try {
        // Consulta para obtener el video, la versión y el grupo al que pertenece (Tu lógica de negocio)
        const query = `
            SELECT 
                v.titulo_video, v.enlace, 
                g.nombre_grupo, 
                vrs.nombre_version, c.nombre AS nombre_cancion
            FROM video v
            JOIN grupo g ON v.id_grupo = g.id_grupo
            JOIN version vrs ON v.id_cancion = vrs.id_cancion AND v.id_version = vrs.id_version
            JOIN cancion c ON v.id_cancion = c.id_cancion;
        `;
        const result = await client.query(query);
        
        // Muestra el JSON de datos
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener videos desde la BD' });
    }
});


// ------------------------------------------------------------------
// INICIO DEL SERVIDOR
// ------------------------------------------------------------------
// Render (o Node.js) asignará automáticamente una variable de entorno llamada PORT 
// que usará el puerto 80 o 443. Si no la encuentra (localmente), usa 3000.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en http://localhost:${PORT}`);
});