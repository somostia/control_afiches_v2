require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Buzta2026',
    database: process.env.DB_NAME || 'sistema_afiches',
    port: process.env.DB_PORT || 5432
});

async function actualizarSucursales() {
    try {
        console.log('🔄 Actualizando sucursales y implementadores...\n');

        // 1. Limpiar datos anteriores
        console.log('1️⃣  Limpiando datos anteriores...');
        await pool.query('DELETE FROM tareas_implementacion');
        await pool.query('DELETE FROM campanas');
        await pool.query('DELETE FROM usuarios WHERE rol = \'implementador\'');
        await pool.query('DELETE FROM sucursales');
        console.log('✅ Datos anteriores eliminados\n');

        // 2. Crear nuevas sucursales
        console.log('2️⃣  Creando nuevas sucursales...');
        const sucursales = [
            'San Fernando',
            'Rengo',
            'Las Cabras',
            'Coltauco',
            'Requinoa',
            'Chépica',
            'Peralillo',
            'Pichilemu',
            'Hualañé',
            'Quinta de Tilcoco',
            'Nancagua',
            'Chanco',
            'Villa Alegre',
            'Colbún',
            'Teno',
            'Yerbas Buenas',
            'Longaví',
            'Maule'
        ];

        for (const sucursal of sucursales) {
            await pool.query(
                'INSERT INTO sucursales (nombre, activo) VALUES ($1, TRUE)',
                [sucursal]
            );
            console.log(`   ✅ ${sucursal}`);
        }

        // 3. Crear implementadores para cada sucursal
        console.log('\n3️⃣  Creando implementadores...');
        const implementadores = [
            { nombre: 'San Fernando', usuario: 'impl_sf', email: 'sf@sistema.com' },
            { nombre: 'Rengo', usuario: 'impl_rengo', email: 'rengo@sistema.com' },
            { nombre: 'Las Cabras', usuario: 'impl_cabras', email: 'cabras@sistema.com' },
            { nombre: 'Coltauco', usuario: 'impl_coltauco', email: 'coltauco@sistema.com' },
            { nombre: 'Requinoa', usuario: 'impl_requinoa', email: 'requinoa@sistema.com' },
            { nombre: 'Chépica', usuario: 'impl_chepica', email: 'chepica@sistema.com' },
            { nombre: 'Peralillo', usuario: 'impl_peralillo', email: 'peralillo@sistema.com' },
            { nombre: 'Pichilemu', usuario: 'impl_pich', email: 'pich@sistema.com' },
            { nombre: 'Hualañé', usuario: 'impl_hualane', email: 'hualane@sistema.com' },
            { nombre: 'Quinta de Tilcoco', usuario: 'impl_tilcoco', email: 'tilcoco@sistema.com' },
            { nombre: 'Nancagua', usuario: 'impl_nancagua', email: 'nancagua@sistema.com' },
            { nombre: 'Chanco', usuario: 'impl_chanco', email: 'chanco@sistema.com' },
            { nombre: 'Villa Alegre', usuario: 'impl_valegre', email: 'valegre@sistema.com' },
            { nombre: 'Colbún', usuario: 'impl_colbun', email: 'colbun@sistema.com' },
            { nombre: 'Teno', usuario: 'impl_teno', email: 'teno@sistema.com' },
            { nombre: 'Yerbas Buenas', usuario: 'impl_ybuenas', email: 'ybuenas@sistema.com' },
            { nombre: 'Longaví', usuario: 'impl_longavi', email: 'longavi@sistema.com' },
            { nombre: 'Maule', usuario: 'impl_maule', email: 'maule@sistema.com' }
        ];

        for (const impl of implementadores) {
            await pool.query(`
                INSERT INTO usuarios (nombre, usuario, password, rol, email, sucursal_asignada)
                VALUES ($1, $2, $3, 'implementador', $4, $5)
            `, [
                `Implementador ${impl.nombre}`,
                impl.usuario,
                impl.usuario, // password = usuario
                impl.email,
                impl.nombre
            ]);
            console.log(`   ✅ ${impl.usuario.padEnd(20)} → ${impl.nombre}`);
        }

        // 4. Resumen
        console.log('\n📊 RESUMEN FINAL:\n');
        console.log('┌────────────────────────────────────────────────────────┐');
        console.log('│ SUCURSALES Y SUS IMPLEMENTADORES                       │');
        console.log('├────────────────────────────────────────────────────────┤');

        const resumen = await pool.query(`
            SELECT 
                s.nombre as sucursal,
                u.usuario,
                u.usuario as password
            FROM sucursales s
            LEFT JOIN usuarios u ON u.sucursal_asignada = s.nombre AND u.rol = 'implementador'
            ORDER BY s.id
        `);

        resumen.rows.forEach((r, i) => {
            console.log(`│ ${String(i + 1).padStart(2)}. ${r.sucursal.padEnd(22)} │ ${r.usuario.padEnd(18)} │`);
        });

        console.log('└────────────────────────────────────────────────────────┘');

        console.log('\n✅ ¡Actualización completada!\n');
        console.log('💡 Ahora el diseñador puede seleccionar entre 18 sucursales.');
        console.log('💡 Cada sucursal tiene su implementador asignado.');
        console.log('💡 Los implementadores pueden iniciar sesión con: usuario/usuario\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

actualizarSucursales();
