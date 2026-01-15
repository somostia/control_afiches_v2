require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Buzta2026',
    database: process.env.DB_NAME || 'sistema_afiches',
    port: process.env.DB_PORT || 5432
});

async function verificar() {
    try {
        console.log('📋 Estado actual del sistema:\n');

        // Verificar implementadores
        console.log('👥 Implementadores:');
        const impl = await pool.query(`
            SELECT nombre, usuario, sucursal_asignada 
            FROM usuarios 
            WHERE rol = 'implementador'
            ORDER BY sucursal_asignada
        `);

        if (impl.rows.length === 0) {
            console.log('   ⚠️  No hay implementadores registrados\n');
        } else {
            impl.rows.forEach(r => {
                console.log(`   ${r.usuario.padEnd(20)} → ${r.sucursal_asignada || 'SIN ASIGNAR'}`);
            });
        }

        // Verificar sucursales
        console.log('\n🏢 Sucursales:');
        const suc = await pool.query('SELECT nombre FROM sucursales ORDER BY nombre');
        if (suc.rows.length === 0) {
            console.log('   ⚠️  No hay sucursales registradas');
        } else {
            suc.rows.forEach(r => {
                console.log(`   ✓ ${r.nombre}`);
            });
        }

        // Verificar relación
        console.log('\n🔗 Relación Sucursales-Implementadores:');
        const relacion = await pool.query(`
            SELECT 
                s.nombre as sucursal,
                COUNT(u.id) as implementadores,
                STRING_AGG(u.usuario, ', ') as usuarios
            FROM sucursales s
            LEFT JOIN usuarios u ON u.sucursal_asignada = s.nombre AND u.rol = 'implementador'
            GROUP BY s.nombre
            ORDER BY s.nombre
        `);

        relacion.rows.forEach(r => {
            const status = r.implementadores > 0 ? '✅' : '⚠️';
            console.log(`   ${status} ${r.sucursal} → ${r.usuarios || 'Sin implementador'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

verificar();
