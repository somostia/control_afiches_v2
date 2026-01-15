require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Buzta2026',
    database: process.env.DB_NAME || 'sistema_afiches',
    port: process.env.DB_PORT || 5432
});

async function actualizarTareas() {
    try {
        console.log('🔄 Actualizando tareas con sucursales correctas...\n');

        // Obtener sucursales válidas de la BD
        const sucursalesDB = await pool.query(`
            SELECT nombre FROM sucursales WHERE activo = TRUE ORDER BY id
        `);

        const sucursales = sucursalesDB.rows.map(s => s.nombre);
        console.log('✅ Sucursales disponibles:', sucursales.join(', '));

        // Obtener tareas actuales
        const tareasActuales = await pool.query(`
            SELECT id, sucursal_nombre, tipo_afiche 
            FROM tareas_implementacion 
            ORDER BY id
        `);

        console.log(`\n📋 Actualizando ${tareasActuales.rows.length} tareas...\n`);

        let index = 0;
        for (const tarea of tareasActuales.rows) {
            // Asignar sucursal de forma cíclica
            const nuevaSucursal = sucursales[index % sucursales.length];

            await pool.query(
                'UPDATE tareas_implementacion SET sucursal_nombre = $1 WHERE id = $2',
                [nuevaSucursal, tarea.id]
            );

            console.log(`   ✅ Tarea ${tarea.id}: ${tarea.sucursal_nombre.padEnd(20)} → ${nuevaSucursal}`);
            index++;
        }

        // Mostrar resumen
        console.log('\n📊 RESUMEN POR SUCURSAL:');
        const resumen = await pool.query(`
            SELECT 
                sucursal_nombre,
                COUNT(*) as total_tareas
            FROM tareas_implementacion
            GROUP BY sucursal_nombre
            ORDER BY sucursal_nombre
        `);

        resumen.rows.forEach(r => {
            console.log(`   📍 ${r.sucursal_nombre.padEnd(25)} → ${r.total_tareas} tareas`);
        });

        console.log('\n✅ Actualización completada!');
        console.log('\n💡 Ahora cada implementador podrá ver sus tareas:');

        const implementadores = await pool.query(`
            SELECT usuario, sucursal_asignada
            FROM usuarios
            WHERE rol = 'implementador'
            ORDER BY sucursal_asignada
        `);

        implementadores.rows.forEach(impl => {
            const count = resumen.rows.find(r => r.sucursal_nombre === impl.sucursal_asignada);
            console.log(`   • ${impl.usuario} → ${impl.sucursal_asignada} (${count ? count.total_tareas : 0} tareas)`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

actualizarTareas();
