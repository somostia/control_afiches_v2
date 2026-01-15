import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const VistaImplementador = ({ usuario }) => {
    const [tareas, setTareas] = useState([]);
    const [uploading, setUploading] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);

    // Estado para modales de imágenes
    const [modalPaquete, setModalPaquete] = useState({ visible: false, url: '', tarea: null });
    const [modalSucursal, setModalSucursal] = useState({ visible: false, url: '', tarea: null });

    const cargarRuta = async () => {
        // Si el usuario tiene sucursal asignada, filtrar por ella
        const params = usuario?.sucursal_asignada
            ? { params: { sucursal: usuario.sucursal_asignada } }
            : {};

        const res = await axios.get(`${API_BASE_URL}/dashboard`, params);

        // Mostrar paquetes listos para despacho, en tránsito, ya recibidos o pendientes de VoBo
        setTareas(res.data.filter(t =>
            (t.estado_logistica === 'en_preparacion' ||
                t.estado_logistica === 'en_transito' ||
                t.estado_logistica === 'recibido') &&
            !t.vobo_impl_ok  // Ocultar tareas ya aprobadas
        ));
    };

    useEffect(() => { cargarRuta(); }, []);

    const marcarRecibido = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/tareas/despacho/${id}`, { estado_logistica: 'recibido' });
            alert("Paquete marcado como 'Recibido en Local'");
            cargarRuta();
        } catch (err) {
            alert("Error: " + (err.response?.data?.error || err.message));
        }
    };

    const abrirModal = (id) => {
        setCurrentTask(id);
        setShowModal(true);
    };

    const finalizarConURL = async () => {
        const foto = prompt("Pega aquí el link de la foto:");
        if (!foto) return;

        const gps = "-33.4489, -70.6693"; // Aquí iría la API de Geolocation de JS

        try {
            await axios.put(`${API_BASE_URL}/tareas/implementacion/${currentTask}`, {
                foto_url: foto,
                gps: gps
            });
            alert("¡Tarea Finalizada!");
            setShowModal(false);
            cargarRuta();
        } catch (err) {
            alert("Error: " + (err.response?.data?.error || err.message));
        }
    };

    const finalizarConArchivo = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(currentTask);

        try {
            // Primero subir la foto
            const formData = new FormData();
            formData.append('archivo', file);

            const uploadRes = await axios.post(`${API_BASE_URL}/upload-diseno`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Luego finalizar la tarea con la URL de la foto
            const gps = "-33.4489, -70.6693"; // Aquí iría la API de Geolocation de JS

            await axios.put(`${API_BASE_URL}/tareas/implementacion/${currentTask}`, {
                foto_url: uploadRes.data.url,
                gps: gps
            });

            alert(`¡Tarea Finalizada! Foto "${uploadRes.data.nombreArchivo}" subida exitosamente`);
            setShowModal(false);
            cargarRuta();
        } catch (err) {
            alert("Error al subir la foto: " + (err.response?.data?.error || err.message));
        } finally {
            setUploading(null);
        }
    };

    // Funciones para modales
    const verPaquete = (tarea) => {
        if (tarea.foto_paquete_url) {
            setModalPaquete({ visible: true, url: tarea.foto_paquete_url, tarea: tarea });
        }
    };

    const verSucursal = (tarea) => {
        if (tarea.foto_evidencia_url) {
            setModalSucursal({ visible: true, url: tarea.foto_evidencia_url, tarea: tarea });
        }
    };

    const cerrarModalPaquete = () => {
        setModalPaquete({ visible: false, url: '', tarea: null });
    };

    const cerrarModalSucursal = () => {
        setModalSucursal({ visible: false, url: '', tarea: null });
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: '15px' }}>
                    <h2 style={{ margin: 0 }}>
                        Mi Ruta de Hoy ({tareas.length})
                        {usuario?.sucursal_asignada && (
                            <span style={{
                                marginLeft: '15px',
                                fontSize: '16px',
                                fontWeight: 'normal',
                                color: '#27ae60',
                                backgroundColor: '#d5f4e6',
                                padding: '5px 15px',
                                borderRadius: '20px'
                            }}>
                                📍 {usuario.sucursal_asignada}
                            </span>
                        )}
                    </h2>
                    <p style={{ color: '#7f8c8d', marginTop: '5px', marginBottom: 0 }}>
                        Paquetes asignados para instalación
                    </p>
                </div>
                {tareas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        ✅ No hay paquetes pendientes en tu ruta
                    </p>
                ) : (
                    tareas.map(t => (
                        <div key={t.id} style={{
                            padding: '15px',
                            borderBottom: '1px solid #eee',
                            marginBottom: '10px'
                        }}>
                            <div style={{ marginBottom: '10px' }}>
                                <p style={{ margin: '0 0 5px 0' }}>
                                    <strong>Campaña:</strong> {t.nombre_campana || 'N/A'} |
                                    <strong> Local:</strong> {t.sucursal_nombre} |
                                    <strong> Pieza:</strong> {t.tipo_afiche}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px', color: '#7f8c8d' }}>
                                    <strong>Cantidad:</strong> {t.cantidad} |
                                    <strong> Estado:</strong> {t.estado_logistica}
                                </p>
                            </div>
                            <div>
                                <div style={{ display: 'flex', gap: '5px', width: '100%', marginBottom: '10px' }}>
                                    {t.foto_paquete_url && (
                                        <button
                                            onClick={() => verPaquete(t)}
                                            style={{
                                                padding: '6px 14px',
                                                fontSize: '15px',
                                                backgroundColor: '#f39c12',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '7px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                flex: 1,
                                                textDecoration: 'none',
                                                textAlign: 'center',
                                                display: 'block'
                                            }}
                                        >
                                            Paquete
                                        </button>
                                    )}
                                    {t.foto_evidencia_url && (
                                        <button
                                            onClick={() => verSucursal(t)}
                                            style={{
                                                padding: '6px 14px',
                                                fontSize: '15px',
                                                backgroundColor: '#27ae60',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '7px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                flex: 1,
                                                textDecoration: 'none',
                                                textAlign: 'center',
                                                display: 'block'
                                            }}
                                        >
                                            Sucursal
                                        </button>
                                    )}
                                </div>
                                <div>
                                    {t.estado_logistica === 'en_transito' ? (
                                        <button
                                            onClick={() => marcarRecibido(t.id)}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#3498db',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            📦 Confirmar Recepción de Camión
                                        </button>
                                    ) : t.foto_evidencia_url ? (
                                        <div style={{
                                            padding: '15px',
                                            backgroundColor: '#fff3cd',
                                            border: '2px solid #ffc107',
                                            borderRadius: '5px',
                                            textAlign: 'center',
                                            color: '#856404',
                                            fontWeight: 'bold'
                                        }}>
                                            ⏳ En espera de VoBo de Implementación
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => abrirModal(t.id)}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#27ae60',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            📸 Subir Foto e Instalar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal para elegir método de subida */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Subir Foto de Evidencia</h3>
                        <p style={{ color: '#666', fontSize: '14px' }}>Elige cómo subir la foto:</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Subir desde archivo */}
                            <label
                                htmlFor="foto-archivo"
                                style={{
                                    padding: '15px',
                                    backgroundColor: uploading ? '#95a5a6' : '#3498db',
                                    color: 'white',
                                    borderRadius: '5px',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}
                            >
                                {uploading ? '⏳ Subiendo...' : '📁 Seleccionar Archivo'}
                            </label>
                            <input
                                id="foto-archivo"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={finalizarConArchivo}
                                disabled={uploading}
                                style={{ display: 'none' }}
                            />

                            {/* Subir desde URL */}
                            <button
                                onClick={finalizarConURL}
                                disabled={uploading}
                                style={{
                                    padding: '15px',
                                    backgroundColor: uploading ? '#95a5a6' : '#2ecc71',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                🔗 Usar URL
                            </button>

                            {/* Cancelar */}
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={uploading}
                                style={{
                                    padding: '10px',
                                    backgroundColor: 'transparent',
                                    color: '#e74c3c',
                                    border: '1px solid #e74c3c',
                                    borderRadius: '5px',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    marginTop: '10px'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>

                        <small style={{ display: 'block', marginTop: '15px', color: '#7f8c8d', textAlign: 'center' }}>
                            Formatos aceptados: JPG, PNG (máx. 10MB)
                        </small>
                    </div>
                </div>
            )}

            {/* MODALES DE IMÁGENES */}
            {modalPaquete.visible && (
                <div
                    onClick={cerrarModalPaquete}
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
                            onClick={cerrarModalPaquete}
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
                        {modalPaquete.tarea && (
                            <div style={{ marginBottom: '15px' }}>
                                <h3 style={{ margin: '0 0 10px 0' }}>Foto del Paquete</h3>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Campaña:</strong> {modalPaquete.tarea.nombre_campana || 'N/A'}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Local:</strong> {modalPaquete.tarea.sucursal_nombre} |
                                    <strong> Pieza:</strong> {modalPaquete.tarea.tipo_afiche}
                                </p>
                            </div>
                        )}
                        <img
                            src={modalPaquete.url}
                            alt="Foto del paquete"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                </div>
            )}

            {modalSucursal.visible && (
                <div
                    onClick={cerrarModalSucursal}
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
                            onClick={cerrarModalSucursal}
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
                        {modalSucursal.tarea && (
                            <div style={{ marginBottom: '15px' }}>
                                <h3 style={{ margin: '0 0 10px 0' }}>Foto de Sucursal</h3>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Campaña:</strong> {modalSucursal.tarea.nombre_campana || 'N/A'}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Local:</strong> {modalSucursal.tarea.sucursal_nombre} |
                                    <strong> Pieza:</strong> {modalSucursal.tarea.tipo_afiche}
                                </p>
                            </div>
                        )}
                        <img
                            src={modalSucursal.url}
                            alt="Foto de sucursal"
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

export default VistaImplementador;