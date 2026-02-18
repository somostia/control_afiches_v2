import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const VistaDiseñador = () => {
    const { user } = useAuth();

    // Estados generales
    const [nombreCampana, setNombreCampana] = useState('');
    const [tareas, setTareas] = useState([{ local: '', tipo: '', cantidad: 1 }]);
    const [disenoReferencia, setDisenoReferencia] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [sucursales, setSucursales] = useState([]);
    const [cargandoSucursales, setCargandoSucursales] = useState(false);

    // Estados de revisión
    const [pendientesDiseno, setPendientesDiseno] = useState([]);
    const [pendientesImplementacion, setPendientesImplementacion] = useState([]);

    // Estados de modales
    const [modalFoto, setModalFoto] = useState({ visible: false, url: '', tarea: null });
    const [modalDiseno, setModalDiseno] = useState({ visible: false, url: '', tarea: null });

    // Cargar revisiones pendientes
    const cargarRevisiones = async () => {
        const res = await api.get('/dashboard');

        setPendientesDiseno(res.data.filter(t => t.url_diseno_archivo && !t.vobo_diseno_ok));
        setPendientesImplementacion(
            res.data.filter(t => t.vobo_diseno_ok && t.foto_evidencia_url && !t.vobo_impl_ok)
        );
    };

    useEffect(() => {
        cargarRevisiones();
    }, []);

    const cargarSucursales = async () => {
        setCargandoSucursales(true);
        try {
            const res = await api.get('/sucursales');
            setSucursales(res.data);
        } catch (err) {
            console.error(err);
            alert('Error al cargar sucursales');
        } finally {
            setCargandoSucursales(false);
        }
    };

    const manejarCambioTarea = (index, e) => {
        const { name, value } = e.target;
        const nuevasTareas = [...tareas];
        nuevasTareas[index] = { ...nuevasTareas[index], [name]: value };
        setTareas(nuevasTareas);
    };

    const agregarFila = () => {
        setTareas([...tareas, { local: '', tipo: '', cantidad: 1 }]);
    };

    const subirDisenoReferencia = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('archivo', file);

            const uploadRes = await api.post('/upload-diseno', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (uploadRes.data?.url) {
                setDisenoReferencia(uploadRes.data.url);
            }
            alert('Archivo de referencia subido correctamente');
        } catch (err) {
            console.error(err);
            alert('Error al subir archivo de referencia');
        }
    };

    const enviarCampana = async (e) => {
        e.preventDefault();
        try {
            // Priorizar usuario de localStorage
            let disenadorId = null;
            const usuarioLocal = localStorage.getItem('usuario');

            if (usuarioLocal) {
                try {
                    const usuarioParsed = JSON.parse(usuarioLocal);
                    disenadorId = usuarioParsed.id;
                    console.log('✓ Usando usuario de localStorage:', usuarioParsed);
                } catch (err) {
                    console.error('Error parsing localStorage usuario:', err);
                }
            }

            // Fallback al contexto de auth
            if (!disenadorId) {
                disenadorId = user?.id;
                console.log('Fallback a useAuth context, user:', user);
            }

            // Último recurso
            if (!disenadorId) {
                disenadorId = 1;
                console.warn('No se pudo obtener disenador_id, usando fallback 1');
            }

            const datos = {
                nombre: nombreCampana,
                disenador_id: disenadorId,
                tareas,
                url_diseno_referencia: disenoReferencia
            };

            const res = await api.post('/campanas', datos);
            alert('Campaña creada con éxito. ID: ' + res.data.id);
            setNombreCampana('');
            setTareas([{ local: '', tipo: '', cantidad: 1 }]);
            setDisenoReferencia('');
            setMostrarFormulario(false);
            cargarRevisiones();
        } catch (err) {
            console.error(err);
            alert('Error al crear campaña: ' + (err.response?.data?.error || err.message));
        }
    };

    // Funciones para modales
    const verFoto = (tarea, url) => {
        if (url) {
            setModalFoto({ visible: true, url, tarea });
        }
    };

    const verDiseno = (tarea) => {
        if (tarea.url_diseno_archivo) {
            setModalDiseno({ visible: true, url: tarea.url_diseno_archivo, tarea });
        }
    };

    const cerrarModalFoto = () => setModalFoto({ visible: false, url: '', tarea: null });
    const cerrarModalDiseno = () => setModalDiseno({ visible: false, url: '', tarea: null });

    // Funciones para VoBo
    const darVoBoDiseno = async (id, aprobado) => {
        await api.put(`/tareas/vobo-diseno/${id}`, { aprobado });
        alert(aprobado ? 'Diseño aprobado. Listo para producción.' : 'Diseño rechazado.');
        cargarRevisiones();
    };

    const darVoBoImplementacion = async (id, aprobado) => {
        try {
            await api.put(`/tareas/vobo-implementacion/${id}`, { aprobado });
            alert(aprobado ? 'Implementación aprobada.' : 'Implementación rechazada.');
            cargarRevisiones();
        } catch (err) {
            console.error(err);
            alert('Error al dar VoBo de implementación');
        }
    };

    const containerStyle = {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
    };

    const sectionStyle = {
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };

    const buttonPrimaryStyle = {
        backgroundColor: '#3498db',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    };

    const cardStyle = {
        padding: '15px',
        borderBottom: '1px solid #eee',
        marginBottom: '10px'
    };

    return (
        <div style={containerStyle}>
            {/* SECCIÓN 1: CREAR NUEVA CAMPAÑA */}
            <div style={sectionStyle}>
                {!mostrarFormulario ? (
                    <div style={{ textAlign: 'center' }}>
                        <button
                            style={buttonPrimaryStyle}
                            onClick={() => {
                                setMostrarFormulario(true);
                                cargarSucursales();
                            }}
                        >
                            + Crear Nueva Campaña
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2>Crear Nueva Campaña</h2>
                            <button
                                onClick={() => setMostrarFormulario(false)}
                                style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                ✕ Cancelar
                            </button>
                        </div>
                        <form onSubmit={enviarCampana}>
                            <input
                                type="text"
                                placeholder="Nombre de la Campaña"
                                value={nombreCampana}
                                onChange={(e) => setNombreCampana(e.target.value)}
                                required
                                style={{ display: 'block', marginBottom: '20px', width: '100%', padding: '10px', fontSize: '16px' }}
                            />

                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px dashed #ccc' }}>
                                <h4 style={{ marginTop: 0, color: '#555' }}>📎 Diseño de Referencia (Opcional)</h4>
                                <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                    Sube un archivo de referencia que el dibujante pueda consultar
                                </p>
                                <label
                                    htmlFor="diseno-referencia"
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: disenoReferencia ? '#27ae60' : '#3498db',
                                        color: 'white',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        display: 'inline-block'
                                    }}
                                >
                                    {disenoReferencia ? '✓ Archivo Subido' : '📁 Seleccionar Archivo'}
                                </label>
                                <input
                                    id="diseno-referencia"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf,.ai,.psd"
                                    onChange={subirDisenoReferencia}
                                    style={{ display: 'none' }}
                                />
                                {disenoReferencia && (
                                    <div style={{ marginTop: '10px' }}>
                                        <a href={disenoReferencia} target="_blank" rel="noreferrer" style={{ color: '#3498db', fontSize: '14px' }}>
                                            Ver archivo subido
                                        </a>
                                    </div>
                                )}
                            </div>

                            <h3>Locales y Diseños</h3>
                            {cargandoSucursales ? (
                                <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Cargando sucursales...</p>
                            ) : (
                                tareas.map((tarea, index) => (
                                    <div key={index} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                                        <select
                                            name="local"
                                            value={tarea.local}
                                            onChange={(e) => manejarCambioTarea(index, e)}
                                            required
                                            style={{ flex: 2, padding: '8px', fontSize: '14px' }}
                                        >
                                            <option value="">Seleccionar Local</option>
                                            {sucursales.map(suc => (
                                                <option key={suc.id} value={suc.nombre}>
                                                    {suc.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            name="tipo"
                                            value={tarea.tipo}
                                            onChange={(e) => manejarCambioTarea(index, e)}
                                            required
                                            style={{ flex: 2, padding: '8px' }}
                                        >
                                            <option value="">Seleccionar Tamaño</option>
                                            <option value="S">S</option>
                                            <option value="M">M</option>
                                            <option value="L">L</option>
                                            <option value="XL">XL</option>
                                        </select>
                                        <input
                                            name="cantidad"
                                            type="number"
                                            min="1"
                                            value={tarea.cantidad}
                                            onChange={(e) => manejarCambioTarea(index, e)}
                                            style={{ width: '80px', padding: '8px' }}
                                        />
                                    </div>
                                ))
                            )}

                            <button
                                type="button"
                                onClick={agregarFila}
                                style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                + Agregar Local
                            </button>
                            <hr style={{ margin: '20px 0' }} />
                            <button
                                type="submit"
                                style={{ ...buttonPrimaryStyle, backgroundColor: '#27ae60' }}
                            >
                                ✓ Publicar Campaña y Notificar Dibujante
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* SECCIÓN 2: VoBo DE DIBUJO */}
            <div style={sectionStyle}>
                <h2>VoBo de Diseño ({pendientesDiseno.length})</h2>
                <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
                    Revisa y aprueba las propuestas de diseño del dibujante
                </p>
                {pendientesDiseno.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#95a5a6', padding: '20px' }}>
                        ✅ No hay diseños pendientes de revisión
                    </p>
                ) : (
                    pendientesDiseno.map(t => (
                        <div key={t.id} style={cardStyle}>
                            <div style={{ marginBottom: '10px' }}>
                                <p style={{ margin: '0 0 5px 0' }}>
                                    <strong>Campaña:</strong> {t.nombre_campana || 'N/A'} |
                                    <strong> Local:</strong> {t.sucursal_nombre} |
                                    <strong> Pieza:</strong> {t.tipo_afiche}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px', color: '#7f8c8d' }}>
                                    <strong>Cantidad:</strong> {t.cantidad}
                                </p>
                            </div>
                            <div>
                                <div style={{ display: 'flex', gap: '5px', width: '100%', marginBottom: '10px' }}>
                                    {t.url_diseno_archivo && (
                                        <button
                                            onClick={() => verDiseno(t)}
                                            style={{
                                                padding: '10px 20px',
                                                fontSize: '15px',
                                                backgroundColor: '#f39c12',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            Ver Diseño
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => darVoBoDiseno(t.id, true)}
                                        style={{ backgroundColor: '#2ecc71', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                    >
                                        ✓ Aprobar
                                    </button>
                                    <button
                                        onClick={() => darVoBoDiseno(t.id, false)}
                                        style={{ backgroundColor: '#e74c3c', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                    >
                                        ✕ Rechazar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* SECCIÓN 3: VoBo DE IMPLEMENTACIÓN */}
            <div style={sectionStyle}>
                <h2>VoBo de Implementación ({pendientesImplementacion.length})</h2>
                <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
                    Revisa y aprueba las fotos de implementación en los locales
                </p>
                {pendientesImplementacion.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#95a5a6', padding: '20px' }}>
                        ✅ No hay implementaciones pendientes de revisión
                    </p>
                ) : (
                    pendientesImplementacion.map(t => (
                        <div key={t.id} style={cardStyle}>
                            <div style={{ marginBottom: '10px' }}>
                                <p style={{ margin: '0 0 5px 0' }}>
                                    <strong>Campaña:</strong> {t.nombre_campana || 'N/A'} |
                                    <strong> Local:</strong> {t.sucursal_nombre} |
                                    <strong> Pieza:</strong> {t.tipo_afiche}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px', color: '#7f8c8d' }}>
                                    <strong>Instalación:</strong> {t.fecha_instalacion || 'N/A'} |
                                    <strong> GPS:</strong> {t.gps_coords || 'N/A'} |
                                    <strong> Estado Logística:</strong> {t.estado_logistica}
                                </p>
                            </div>
                            <div>
                                <div style={{ display: 'flex', gap: '5px', width: '100%', marginBottom: '10px' }}>
                                    {t.url_diseno_archivo && (
                                        <button
                                            onClick={() => verDiseno(t)}
                                            style={{
                                                padding: '10px 20px',
                                                fontSize: '15px',
                                                backgroundColor: '#f39c12',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            Ver Diseño
                                        </button>
                                    )}
                                    {t.foto_evidencia_url && (
                                        <button
                                            onClick={() => verFoto(t, t.foto_evidencia_url)}
                                            style={{
                                                padding: '10px 20px',
                                                fontSize: '15px',
                                                backgroundColor: '#27ae60',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Implementación
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => darVoBoImplementacion(t.id, true)}
                                        style={{ backgroundColor: '#2ecc71', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                    >
                                        ✓ Aprobar Instalación
                                    </button>
                                    <button
                                        onClick={() => darVoBoImplementacion(t.id, false)}
                                        style={{ backgroundColor: '#e74c3c', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                    >
                                        ✕ Rechazar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODALES */}
            {modalFoto.visible && (
                <div
                    onClick={cerrarModalFoto}
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
                            onClick={cerrarModalFoto}
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
                        {modalFoto.tarea && (
                            <div style={{ marginBottom: '15px' }}>
                                <h3 style={{ margin: '0 0 10px 0' }}>Foto de Sucursal</h3>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Campaña:</strong> {modalFoto.tarea.nombre_campana || 'N/A'}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Local:</strong> {modalFoto.tarea.sucursal_nombre} |
                                    <strong> Pieza:</strong> {modalFoto.tarea.tipo_afiche}
                                </p>
                            </div>
                        )}
                        <img
                            src={modalFoto.url}
                            alt="Foto de implementación"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                </div>
            )}

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
                                <h3 style={{ margin: '0 0 10px 0' }}>Diseño de Afiche</h3>
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
                            alt="Diseño de afiche"
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

export default VistaDiseñador;
