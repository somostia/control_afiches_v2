import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const VistaSupervisor = () => {
    const [tareas, setTareas] = useState([]);
    const [campanas, setCampanas] = useState([]);
    const [modalFoto, setModalFoto] = useState({ visible: false, url: '', tarea: null });
    const [modalDiseno, setModalDiseno] = useState({ visible: false, url: '', tarea: null });
    const [modalReferencia, setModalReferencia] = useState({ visible: false, url: '', tarea: null });

    useEffect(() => {
        const obtenerDatos = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/dashboard`);
                setTareas(res.data);
                agruparPorCampana(res.data);
            } catch (err) {
                console.error("Error al cargar dashboard", err);
            }
        };
        obtenerDatos();
    }, []);

    // Agrupar tareas por campaña
    const agruparPorCampana = (tareas) => {
        const grupos = {};
        tareas.forEach(t => {
            const nombreCampana = t.nombre_campana || 'Sin Campaña';
            if (!grupos[nombreCampana]) {
                grupos[nombreCampana] = {
                    nombre: nombreCampana,
                    tareas: [],
                    url_diseno_referencia: t.url_diseno_referencia
                };
            }
            grupos[nombreCampana].tareas.push(t);
        });
        setCampanas(Object.values(grupos));
    };

    // Función para asignar la clase de color
    const getColorClase = (vobo_diseno, vobo_impl) => {
        if (vobo_impl) return 'verde';
        if (vobo_diseno) return 'amarillo';
        return 'rojo';
    };

    const getEstadoTexto = (vobo_diseno, vobo_impl) => {
        if (vobo_impl) return 'Implementado';
        if (vobo_diseno) return 'En Proceso';
        return 'Pendiente';
    };

    // Determinar la etapa actual del proceso
    const getEtapa = (tarea) => {
        if (tarea.vobo_impl_ok) return 'implementación';
        if (tarea.foto_evidencia_url) return 'implementación';
        if (tarea.estado_logistica === 'en_transito') return 'despacho';
        if (tarea.foto_paquete_url || tarea.estado_logistica === 'en_preparacion') return 'paquete';
        if (tarea.vobo_diseno_ok) return 'paquete';
        if (tarea.url_diseno_archivo) return 'dibujo';
        if (tarea.url_diseno_referencia) return 'dibujante';
        return 'diseño';
    };

    // Determinar el siguiente paso pendiente
    const getSiguientePaso = (tarea) => {
        if (tarea.vobo_impl_ok) {
            return { texto: 'Completado', icono: '✅', color: '#27ae60' };
        }
        if (tarea.foto_evidencia_url && !tarea.vobo_impl_ok) {
            return { texto: 'Aprobar Impl.', icono: '👨‍💼', color: '#e67e22' };
        }
        if (tarea.estado_logistica === 'recibido' && !tarea.foto_evidencia_url) {
            return { texto: 'Subir Foto', icono: '📸', color: '#e67e22' };
        }
        if (tarea.estado_logistica === 'en_transito') {
            return { texto: 'Recibir', icono: '📦', color: '#3498db' };
        }
        if (tarea.foto_paquete_url && !tarea.estado_logistica) {
            return { texto: 'Despachar', icono: '🚚', color: '#3498db' };
        }
        if (tarea.vobo_diseno_ok && !tarea.foto_paquete_url) {
            return { texto: 'Preparar Paquete', icono: '📦', color: '#f39c12' };
        }
        if (tarea.url_diseno_archivo && !tarea.vobo_diseno_ok) {
            return { texto: 'Aprobar Diseño', icono: '👨‍🎨', color: '#9b59b6' };
        }
        if (!tarea.url_diseno_archivo) {
            return { texto: 'Dibujar', icono: '🎨', color: '#e74c3c' };
        }
        return { texto: 'En Proceso', icono: '⏳', color: '#95a5a6' };
    };

    // Abrir modal con foto de implementación
    const verFotoImplementacion = (tarea) => {
        if (tarea.foto_evidencia_url) {
            setModalFoto({
                visible: true,
                url: tarea.foto_evidencia_url,
                tarea: tarea
            });
        }
    };

    // Cerrar modal
    const cerrarModal = () => {
        setModalFoto({ visible: false, url: '', tarea: null });
    };

    // Abrir modal con diseño
    const verDiseno = (tarea) => {
        if (tarea.url_diseno_archivo) {
            setModalDiseno({
                visible: true,
                url: tarea.url_diseno_archivo,
                tarea: tarea
            });
        }
    };

    // Cerrar modal de diseño
    const cerrarModalDiseno = () => {
        setModalDiseno({ visible: false, url: '', tarea: null });
    };

    // Abrir modal con diseño de referencia
    const verDisenoReferencia = (tarea) => {
        if (tarea.url_diseno_referencia) {
            setModalReferencia({
                visible: true,
                url: tarea.url_diseno_referencia,
                tarea: tarea
            });
        }
    };

    // Cerrar modal de diseño de referencia
    const cerrarModalReferencia = () => {
        setModalReferencia({ visible: false, url: '', tarea: null });
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: 0 }}>Panel de Control - Supervisor</h2>
                <p style={{ color: '#7f8c8d', marginTop: '5px' }}>
                    Total de campañas: {campanas.length} | Total de tareas: {tareas.length}
                </p>
            </div>

            {campanas.map((campana, index) => {
                const totalTareas = campana.tareas.length;
                const completadas = campana.tareas.filter(t => t.vobo_impl_ok).length;
                const enProceso = campana.tareas.filter(t => t.vobo_diseno_ok && !t.vobo_impl_ok).length;
                const pendientes = campana.tareas.filter(t => !t.vobo_diseno_ok).length;

                return (
                    <div key={index} style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '15px' }}>
                            <div>
                                <h3
                                    style={{
                                        margin: 0,
                                        color: '#2c3e50',
                                        cursor: campana.url_diseno_referencia ? 'pointer' : 'default',
                                        textDecoration: campana.url_diseno_referencia ? 'underline' : 'none'
                                    }}
                                    onClick={() => campana.url_diseno_referencia && verDisenoReferencia(campana.tareas[0])}
                                >
                                    📋 {campana.nombre}
                                </h3>
                                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#7f8c8d' }}>
                                    Total: {totalTareas} tareas |
                                    <span style={{ color: '#27ae60', fontWeight: 'bold' }}> ✓ {completadas}</span> |
                                    <span style={{ color: '#f39c12', fontWeight: 'bold' }}> ⏳ {enProceso}</span> |
                                    <span style={{ color: '#e74c3c', fontWeight: 'bold' }}> ⭕ {pendientes}</span>
                                </p>
                            </div>
                        </div>

                        {/* Lista de locales con sus tamaños */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                            {campana.tareas.map((tarea, idx) => {
                                const colorClase = getColorClase(tarea.vobo_diseno_ok, tarea.vobo_impl_ok);
                                const etapa = getEtapa(tarea);
                                const siguientePaso = getSiguientePaso(tarea);

                                return (
                                    <div key={idx} style={{
                                        padding: '12px',
                                        border: `2px solid ${colorClase === 'verde' ? '#27ae60' : colorClase === 'amarillo' ? '#f39c12' : '#e74c3c'}`,
                                        borderRadius: '6px',
                                        backgroundColor: colorClase === 'verde' ? '#eafaf1' : colorClase === 'amarillo' ? '#fef9e7' : '#fdedec'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#2c3e50' }}>
                                                    📍 {tarea.sucursal_nombre}
                                                </p>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px', flexWrap: 'nowrap' }}>
                                                    <p style={{ margin: 0, fontSize: '13px', color: '#555', whiteSpace: 'nowrap' }}>
                                                        <strong>Tipo:</strong> {tarea.tipo_afiche} | <strong>Cant:</strong> {tarea.cantidad}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: '13px', color: siguientePaso.color, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                        {siguientePaso.icono} {siguientePaso.texto}
                                                    </p>
                                                </div>
                                            </div>
                                            {!tarea.vobo_impl_ok && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', flexShrink: 0 }}>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                                        color: '#555',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 'bold',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {etapa}
                                                    </span>
                                                    <span style={{ fontSize: '20px' }}>
                                                        {colorClase === 'verde' ? '✅' : colorClase === 'amarillo' ? '⏳' : '⭕'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                                                {tarea.url_diseno_referencia && (
                                                    <button
                                                        onClick={() => verDisenoReferencia(tarea)}
                                                        style={{
                                                            padding: '6px 14px',
                                                            fontSize: '15px',
                                                            backgroundColor: '#e74c3c',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '7px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            flex: 1
                                                        }}
                                                    >
                                                        Diseño
                                                    </button>
                                                )}
                                                {tarea.url_diseno_archivo && (
                                                    <button
                                                        onClick={() => verDiseno(tarea)}
                                                        style={{
                                                            padding: '6px 14px',
                                                            fontSize: '15px',
                                                            backgroundColor: '#f39c12',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '7px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            flex: 1
                                                        }}
                                                    >
                                                        Afiche
                                                    </button>
                                                )}
                                                {tarea.foto_evidencia_url && (
                                                    <button
                                                        onClick={() => verFotoImplementacion(tarea)}
                                                        style={{
                                                            padding: '6px 14px',
                                                            fontSize: '15px',
                                                            backgroundColor: '#27ae60',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '7px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            flex: 1
                                                        }}
                                                    >
                                                        Sucursal
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {campanas.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d', backgroundColor: 'white', borderRadius: '8px' }}>
                    No hay campañas registradas
                </p>
            )
            }

            {/* Modal para ver foto de implementación */}
            {
                modalFoto.visible && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }}
                        onClick={cerrarModal}
                    >
                        <div
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '20px',
                                maxWidth: '90%',
                                maxHeight: '90%',
                                overflow: 'auto',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={cerrarModal}
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
                                ✕
                            </button>
                            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Foto de Implementación</h3>
                            {modalFoto.tarea && (
                                <div style={{ marginBottom: '15px', color: '#555' }}>
                                    <p style={{ margin: '5px 0' }}><strong>Campaña:</strong> {modalFoto.tarea.nombre_campana}</p>
                                    <p style={{ margin: '5px 0' }}><strong>Local:</strong> {modalFoto.tarea.sucursal_nombre}</p>
                                    <p style={{ margin: '5px 0' }}><strong>Afiche:</strong> {modalFoto.tarea.tipo_afiche}</p>
                                    {modalFoto.tarea.gps_coords && (
                                        <p style={{ margin: '5px 0' }}><strong>GPS:</strong> {modalFoto.tarea.gps_coords}</p>
                                    )}
                                    {modalFoto.tarea.fecha_instalacion && (
                                        <p style={{ margin: '5px 0' }}><strong>Fecha:</strong> {modalFoto.tarea.fecha_instalacion}</p>
                                    )}
                                </div>
                            )}
                            <img
                                src={modalFoto.url}
                                alt="Foto de implementación"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                    borderRadius: '4px',
                                    display: 'block',
                                    margin: '0 auto'
                                }}
                            />
                        </div>
                    </div>
                )
            }

            {/* Modal para ver diseño original */}
            {
                modalDiseno.visible && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }}
                        onClick={cerrarModalDiseno}
                    >
                        <div
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '20px',
                                maxWidth: '90%',
                                maxHeight: '90%',
                                overflow: 'auto',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
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
                                ✕
                            </button>
                            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Diseño Original</h3>
                            {modalDiseno.tarea && (
                                <div style={{ marginBottom: '15px', color: '#555' }}>
                                    <p style={{ margin: '5px 0' }}><strong>Campaña:</strong> {modalDiseno.tarea.nombre_campana}</p>
                                    <p style={{ margin: '5px 0' }}><strong>Local:</strong> {modalDiseno.tarea.sucursal_nombre}</p>
                                    <p style={{ margin: '5px 0' }}><strong>Afiche:</strong> {modalDiseno.tarea.tipo_afiche}</p>
                                    <p style={{ margin: '5px 0' }}><strong>Cantidad:</strong> {modalDiseno.tarea.cantidad}</p>
                                </div>
                            )}
                            <img
                                src={modalDiseno.url}
                                alt="Diseño original"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                    borderRadius: '4px',
                                    display: 'block',
                                    margin: '0 auto'
                                }}
                            />
                        </div>
                    </div>
                )
            }

            {/* Modal para ver diseño de referencia */}
            {
                modalReferencia.visible && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }}
                        onClick={cerrarModalReferencia}
                    >
                        <div
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '20px',
                                maxWidth: '90%',
                                maxHeight: '90%',
                                overflow: 'auto',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={cerrarModalReferencia}
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
                                ✕
                            </button>
                            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>📋 Diseño de Referencia</h3>
                            {modalReferencia.tarea && (
                                <div style={{ marginBottom: '15px', color: '#555' }}>
                                    <p style={{ margin: '5px 0' }}><strong>Campaña:</strong> {modalReferencia.tarea.nombre_campana}</p>
                                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#7f8c8d' }}>
                                        Este es el diseño de referencia cargado por el diseñador para guiar al dibujante
                                    </p>
                                </div>
                            )}
                            <img
                                src={modalReferencia.url}
                                alt="Diseño de referencia"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                    borderRadius: '4px',
                                    display: 'block',
                                    margin: '0 auto'
                                }}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default VistaSupervisor;