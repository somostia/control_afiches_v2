import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const PanelVoBoDisenador = () => {
    const [pendientes, setPendientes] = useState([]);

    const cargarRevisiones = async () => {
        const res = await axios.get(`${API_BASE_URL}/dashboard`);
        // Filtramos tareas que tienen link de diseño pero aún no tienen VoBo
        setPendientes(res.data.filter(t => t.url_diseno_archivo && !t.vobo_diseno_ok));
    };

    useEffect(() => { cargarRevisiones(); }, []);

    const darVoBo = async (id, aprobado) => {
        await axios.put(`${API_BASE_URL}/tareas/vobo-diseno/${id}`, { aprobado });
        alert(aprobado ? "Diseño aprobado. Listo para producción." : "Diseño rechazado.");
        cargarRevisiones();
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px' }}>
            <h3>Revisiones Pendientes (VoBo Diseño)</h3>
            {pendientes.map(t => (
                <div key={t.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    <p><strong>Local:</strong> {t.sucursal_nombre} | <strong>Pieza:</strong> {t.tipo_afiche}</p>
                    <a href={t.url_diseno_archivo} target="_blank" rel="noreferrer">Ver Propuesta de Diseño</a>
                    <div style={{ marginTop: '10px' }}>
                        <button onClick={() => darVoBo(t.id, true)} style={{ backgroundColor: '#2ecc71', color: 'white' }}>Aprobar (🟢)</button>
                        <button onClick={() => darVoBo(t.id, false)} style={{ backgroundColor: '#e74c3c', color: 'white', marginLeft: '10px' }}>Rechazar (🔴)</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PanelVoBoDisenador;