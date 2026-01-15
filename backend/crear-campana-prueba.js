require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Buzta2026',
    database: process.env.DB_NAME || 'sistema_afiches',
    port: process.env.DB_PORT || 5432
});

async function crearCampanaPrueba() {
    try {
        console.log('🎯 Creando campaña de prueba con sucursales correctas...\n');

        // Crear una campaña
        const campana = await pool.query(
            'INSERT INTO campanas (nombre, disenador_id) VALUES ($1, $2) RETURNING id',
            ['Campaña Demo - Todas las Sucursales', 2] // disenador_id = 2
        );

        const campanaId = campana.rows[0].id;
        console.log(`✅ Campaña creada con ID: ${campanaId}\n`);

        // Crear tareas para cada sucursal
        const sucursales = [
            'Mall Plaza',
            'Costanera Center',
            'Portal La Dehesa',
            'Parque Arauco',
            'Alto Las Condes'
        ];

        const tipos = ['Banner 2x1m', 'Afiche A3', 'Display Vitrina', 'Poster Entrada', 'Volante Promocional'];

        for (let i = 0; i < sucursales.length; i++) {
            await pool.query(`
                INSERT INTO tareas_implementacion 
                (campana_id, sucursal_nombre, tipo_afiche, cantidad, estado_diseno, estado_logistica)
                VALUES ($1, $2, $3, $4, 'pendiente', 'en_bodega')
            `, [campanaId, sucursales[i], tipos[i], Math.floor(Math.random() * 5) + 1]);

            console.log(`   ✅ Tarea creada: ${sucursales[i]} → ${tipos[i]}`);
        }

        console.log('\n✅ Campaña de prueba creada exitosamente!');
        console.log('\n📋 Ahora cada implementador verá su tarea:');
        console.log('   • impl_plaza → Mall Plaza');
        console.log('   • impl_costanera → Costanera Center');
        console.log('   • impl_dehesa → Portal La Dehesa');
        console.log('   • impl_arauco → Parque Arauco');
        console.log('   • impl_altocondes → Alto Las Condes');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

crearCampanaPrueba();
