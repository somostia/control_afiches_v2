import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const VistaDibujante = () => {
    const [pendientes, setPendientes] = useState([]);
    const [aprobados, setAprobados] = useState([]);
    const [paquetesListos, setPaquetesListos] = useState([]);
    const [uploading, setUploading] = useState(null);

    // Estado para modal
    const [modalDiseno, setModalDiseno] = useState({ visible: false, url: '', tarea: null });

    const cargarPendientes = async () => {
        const res = await axios.get(`${API_BASE_URL}/dashboard`);
        // Filtramos solo lo que está en rojo (pendiente de dibujo)
        setPendientes(res.data.filter(t => t.estado_diseno === 'pendiente'));
        // Filtramos tareas aprobadas pero no despachadas
        setAprobados(res.data.filter(t => t.vobo_diseno_ok && t.estado_logistica === 'en_bodega'));
        // Filtramos paquetes en preparación listos para despacho
        setPaquetesListos(res.data.filter(t => t.url_foto_paquete && t.estado_logistica === 'en_preparacion'));
    };

    useEffect(() => { cargarPendientes(); }, []);

    const subirDesdeURL = async (id) => {
        const url = prompt("Introduce el link del diseño (Drive/Dropbox/Cloudinary):");
        if (url) {
            try {
                await axios.put(`${API_BASE_URL}/tareas/dibujo/${id}`, { url_diseno: url });
                alert("Enviado a Visto Bueno del Diseñador");
                cargarPendientes();
            } catch (err) {
                alert("Error al subir el diseño: " + (err.response?.data?.error || err.message));
            }
        }
    };

    const subirDesdeArchivo = async (id, event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(id);

        try {
            // Primero subir el archivo
            const formData = new FormData();
            formData.append('archivo', file);

            const uploadRes = await axios.post(`${API_BASE_URL}/upload-diseno`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Luego actualizar la tarea con la URL del archivo
            await axios.put(`${API_BASE_URL}/tareas/dibujo/${id}`, {
                url_diseno: uploadRes.data.url
            });

            alert(`Archivo "${uploadRes.data.nombreArchivo}" subido exitosamente`);
            cargarPendientes();
        } catch (err) {
            alert("Error al subir el archivo: " + (err.response?.data?.error || err.message));
        } finally {
            setUploading(null);
        }
    };

    const subirFotoPaquete = async (id, event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(id);

        try {
            // Subir el archivo
            const formData = new FormData();
            formData.append('archivo', file);

            const uploadRes = await axios.post(`${API_BASE_URL}/upload-diseno`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Actualizar el estado de logística con la foto del paquete
            await axios.put(`${API_BASE_URL}/tareas/preparar-despacho/${id}`, {
                url_foto_paquete: uploadRes.data.url
            });

            alert(`Paquete confirmado. Listo para despacho.`);
            cargarPendientes();
        } catch (err) {
            alert("Error al subir la foto: " + (err.response?.data?.error || err.message));
        } finally {
            setUploading(null);
        }
    };

    const confirmarDespacho = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/tareas/despacho/${id}`, { estado_logistica: 'en_transito' });
            alert("Paquete despachado. 📦");
            cargarPendientes();
        } catch (err) {
            alert("Error al confirmar despacho: " + (err.response?.data?.error || err.message));
        }
    };

    // Funciones para modal
    const verDiseno = (tarea) => {
        if (tarea.url_diseno_referencia) {
            setModalDiseno({ visible: true, url: tarea.url_diseno_referencia, tarea: tarea });
        }
    };

    const cerrarModalDiseno = () => {
        setModalDiseno({ visible: false, url: '', tarea: null });
    };

    return (
        <div style={{ padding: '20px' }}>
            {/* SECCIÓN 1: PENDIENTES DE DISEÑO */}
            <div style={{ marginBottom: '40px' }}>
                <h2>📝 Pendientes de Diseño</h2>
                {pendientes.length === 0 ? (
                    <p style={{ color: '#7f8c8d', padding: '20px', backgroundColor: '#ecf0f1', borderRadius: '8px' }}>
                        ✅ No hay tareas pendientes de diseño
                    </p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {pendientes.map(t => (
                            <li key={t.id} style={{
                                marginBottom: '20px',
                                padding: '15px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                backgroundColor: '#f9f9f9'
                            }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>Campaña:</strong> {t.nombre_campana || 'N/A'}<br />
                                    <strong>Local:</strong> {t.sucursal_nombre} - {t.tipo_afiche} ({t.cantidad} unidades)
                                </div>

                                {t.url_diseno_referencia && (
                                    <div style={{ marginBottom: '15px', textAlign: window.innerWidth < 750 ? 'center' : 'left' }}>
                                        <button
                                            onClick={() => verDiseno(t)}
                                            style={{
                                                padding: '6px 14px',
                                                fontSize: '15px',
                                                backgroundColor: '#e74c3c',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '7px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                textDecoration: 'none',
                                                textAlign: 'center',
                                                display: 'inline-block'
                                            }}
                                        >
                                            Diseño
                                        </button>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {/* Subir desde archivo */}
                                    <label
                                        htmlFor={`file-${t.id}`}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: uploading === t.id ? '#95a5a6' : '#3498db',
                                            color: 'white',
                                            borderRadius: '5px',
                                            cursor: uploading === t.id ? 'not-allowed' : 'pointer',
                                            display: 'inline-block'
                                        }}
                                    >
                                        {uploading === t.id ? '⏳ Subiendo...' : '📁 Subir Archivo'}
                                    </label>
                                    <input
                                        id={`file-${t.id}`}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.ai,.psd,image/*"
                                        capture="environment"
                                        onChange={(e) => subirDesdeArchivo(t.id, e)}
                                        disabled={uploading === t.id}
                                        style={{ display: 'none' }}
                                    />

                                    <span style={{ color: '#7f8c8d' }}>o</span>

                                    {/* Subir desde URL */}
                                    <button
                                        onClick={() => subirDesdeURL(t.id)}
                                        disabled={uploading === t.id}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: uploading === t.id ? '#95a5a6' : '#2ecc71',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: uploading === t.id ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        🔗 Usar URL
                                    </button>
                                </div>

                                <small style={{ display: 'block', marginTop: '8px', color: '#7f8c8d' }}>
                                    Formatos aceptados: JPG, PNG, PDF, AI, PSD (máx. 10MB)
                                </small>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* SECCIÓN 2: PREPARAR DESPACHO */}
            <div style={{ borderTop: '2px solid #ddd', paddingTop: '20px' }}>
                <h2>📦 Preparar Despacho</h2>
                <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
                    Diseños aprobados. Sube foto del paquete armado para confirmar que está listo para despacho.
                </p>
                {aprobados.length === 0 ? (
                    <p style={{ color: '#7f8c8d', padding: '20px', backgroundColor: '#ecf0f1', borderRadius: '8px' }}>
                        ✅ No hay paquetes pendientes de preparación
                    </p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {aprobados.map(t => (
                            <li key={t.id} style={{
                                marginBottom: '20px',
                                padding: '15px',
                                border: '2px solid #27ae60',
                                borderRadius: '8px',
                                backgroundColor: '#d5f4e6'
                            }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>Campaña:</strong> {t.nombre_campana} <br />
                                    <strong>Local:</strong> {t.sucursal_nombre} - {t.tipo_afiche} ({t.cantidad} unidades)
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <a
                                        href={t.url_diseno_archivo}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: '#3498db', textDecoration: 'none' }}
                                    >
                                        📄 Ver Diseño Aprobado
                                    </a>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <label
                                        htmlFor={`paquete-${t.id}`}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: uploading === t.id ? '#95a5a6' : '#f39c12',
                                            color: 'white',
                                            borderRadius: '5px',
                                            cursor: uploading === t.id ? 'not-allowed' : 'pointer',
                                            display: 'inline-block',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {uploading === t.id ? '⏳ Subiendo...' : '📸 Subir Foto del Paquete'}
                                    </label>
                                    <input
                                        id={`paquete-${t.id}`}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => subirFotoPaquete(t.id, e)}
                                        disabled={uploading === t.id}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                <small style={{ display: 'block', marginTop: '8px', color: '#555' }}>
                                    📸 Toma una foto del paquete armado listo para despacho
                                </small>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* SECCIÓN 3: CONFIRMAR DESPACHO */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginTop: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2>📦 Confirmar Despacho ({paquetesListos.length})</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    Paquetes listos para envío. Confirma cuando sean despachados al local.
                </p>
                {paquetesListos.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                        ✅ No hay paquetes pendientes de despacho
                    </p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {paquetesListos.map(t => (
                            <li key={t.id} style={{
                                padding: '15px',
                                border: '2px solid #f39c12',
                                borderRadius: '8px',
                                marginBottom: '15px',
                                backgroundColor: '#fffbf0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{t.sucursal_nombre}</strong> | {t.tipo_afiche} (x{t.cantidad})
                                        {t.url_foto_paquete && (
                                            <div style={{ marginTop: '8px' }}>
                                                <a href={t.url_foto_paquete} target="_blank" rel="noreferrer" style={{ color: '#3498db', fontSize: '14px' }}>
                                                    📸 Ver Foto del Paquete
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => confirmarDespacho(t.id)}
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: '#27ae60',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '16px'
                                        }}
                                    >
                                        🚚 Confirmar Despacho
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* MODAL */}
            {modalDiseno.visible && (
                <div
                    onClick={cerrarModalDiseno}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            position: 'relative'
                        }}
                    >
                        <button
                            onClick={cerrarModalDiseno}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}
                        >
                            ×
                        </button>
                        {modalDiseno.tarea && (
                            <div style={{ marginBottom: '15px' }}>
                                <h3 style={{ margin: '0 0 10px 0' }}>Diseño de Referencia</h3>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Campaña:</strong> {modalDiseno.tarea.nombre_campana || 'N/A'}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Local:</strong> {modalDiseno.tarea.sucursal_nombre} |
                                    <strong> Pieza:</strong> {modalDiseno.tarea.tipo_afiche}
                                </p>
                            </div>
                        )}
                        <img
                            src={modalDiseno.url}
                            alt="Diseño de referencia"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VistaDibujante;