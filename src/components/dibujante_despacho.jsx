import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const ModuloDespacho = () => {
    const [aprobados, setAprobados] = useState([]);

    const cargarParaDespacho = async () => {
        const res = await axios.get(`${API_BASE_URL}/dashboard`);
        // Filtramos lo que tiene VoBo de diseño pero aún no ha sido recibido en el local
        setAprobados(res.data.filter(t => t.vobo_diseno_ok && t.estado_logistica !== 'recibido'));
    };

    useEffect(() => { cargarParaDespacho(); }, []);

    const despachar = async (id) => {
        await axios.put(`${API_BASE_URL}/tareas/despacho/${id}`, { estado_logistica: 'en_transito' });
        alert("Paquete entregado al transporte interno");
        cargarParaDespacho();
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', marginTop: '20px' }}>
            <h3>Logística: Paquetes por Despachar</h3>
            {aprobados.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px dotted #ccc' }}>
                    <span><strong>{t.sucursal_nombre}</strong> ({t.tipo_afiche})</span>
                    <span>Estado actual: {t.estado_logistica}</span>
                    <button onClick={() => despachar(t.id)} disabled={t.estado_logistica === 'en_transito'}>
                        {t.estado_logistica === 'en_transito' ? '🚚 En Camión' : '📦 Enviar al Transporte'}
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ModuloDespacho;