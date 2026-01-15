import React, { useState, useEffect } from 'react';
import Login from './components/login';
import VistaSupervisor from './components/supervisor_vista';
import VistaDiseñador from './components/diseñador_vista';
import VistaDibujante from './components/dibujante_vista';
import VistaImplementador from './components/implementador_vista';

const App = () => {
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        // Verificar si hay usuario en localStorage
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            setUsuario(JSON.parse(usuarioGuardado));
        }
    }, []);

    const handleLoginSuccess = (user) => {
        setUsuario(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('usuario');
        setUsuario(null);
    };

    // Si no hay usuario, mostrar login
    if (!usuario) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    // Estilos
    const headerStyle = {
        backgroundColor: '#2c3e50',
        padding: '15px 20px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };

    const userInfoStyle = {
        display: 'flex',
        alignItems: 'stretch',
        gap: '15px',
        height: '100%'
    };

    const userBlockStyle = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    };

    const roleTagStyle = {
        padding: '5px 12px',
        backgroundColor: '#3498db',
        borderRadius: '5px',
        fontSize: '14px',
        fontWeight: 'bold',
        marginTop: '5px'
    };

    const logoutButtonStyle = {
        padding: '15px 20px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    // Función para renderizar la vista según el rol
    const renderVista = () => {
        switch (usuario.rol) {
            case 'supervisor':
                return <VistaSupervisor />;
            case 'disenador':
                return <VistaDiseñador />;
            case 'dibujante':
                return <VistaDibujante />;
            case 'implementador':
                return <VistaImplementador usuario={usuario} />;
            case 'admin':
                // Admin puede ver todas las vistas
                return (
                    <div>
                        <div style={{ padding: '20px', backgroundColor: '#ecf0f1' }}>
                            <h2>Panel de Administrador</h2>
                            <p>Como administrador, puedes ver todas las vistas del sistema.</p>
                        </div>
                        <div style={{ borderBottom: '3px solid #2c3e50', marginBottom: '20px' }}>
                            <h3 style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', margin: 0 }}>
                                Vista Supervisor
                            </h3>
                        </div>
                        <VistaSupervisor />

                        <div style={{ borderBottom: '3px solid #2c3e50', marginTop: '40px', marginBottom: '20px' }}>
                            <h3 style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', margin: 0 }}>
                                Vista Diseñador
                            </h3>
                        </div>
                        <VistaDiseñador />

                        <div style={{ borderBottom: '3px solid #2c3e50', marginTop: '40px', marginBottom: '20px' }}>
                            <h3 style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', margin: 0 }}>
                                Vista Dibujante
                            </h3>
                        </div>
                        <VistaDibujante />

                        <div style={{ borderBottom: '3px solid #2c3e50', marginTop: '40px', marginBottom: '20px' }}>
                            <h3 style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', margin: 0 }}>
                                Vista Implementador
                            </h3>
                        </div>
                        <VistaImplementador usuario={usuario} />
                    </div>
                );
            default:
                return (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <h2>Rol no reconocido</h2>
                        <p>Contacta al administrador del sistema</p>
                    </div>
                );
        }
    };

    return (
        <div>
            <header style={headerStyle}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>Sistema de Gestión de Afiches</h1>
                </div>
                <div style={userInfoStyle}>
                    <div style={userBlockStyle}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{usuario.nombre}</div>
                        <div style={roleTagStyle}>
                            {usuario.rol === 'disenador' ? 'Diseñador' :
                                usuario.rol === 'supervisor' ? 'Supervisor' :
                                    usuario.rol === 'implementador' ? 'Implementador' :
                                        usuario.rol === 'dibujante' ? 'Dibujante' :
                                            usuario.rol === 'admin' ? 'Administrador' : usuario.rol}
                        </div>
                    </div>
                    <button onClick={handleLogout} style={logoutButtonStyle}>
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main>
                {renderVista()}
            </main>
        </div>
    );
};

export default App;
