const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function limpiarDatos() {
    try {
        console.log('🔄 Conectando a PostgreSQL...');
        const client = await pool.connect();

        // Opción 1: Eliminar todas las tareas de prueba
        console.log('🗑️  Limpiando tareas de prueba...');
        const result = await client.query('DELETE FROM tareas_implementacion');
        console.log(`✅ ${result.rowCount} tareas eliminadas`);

        // También limpiar campañas huérfanas
        const result2 = await client.query('DELETE FROM campanas');
        console.log(`✅ ${result2.rowCount} campañas eliminadas`);

        console.log('\n✅ Base de datos limpiada. Puedes empezar de nuevo con datos frescos.');

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

limpiarDatos();
