import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config';

const Login = () => {
    const { login } = useAuth();
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ usuario, password });
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ecf0f1',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                maxWidth: '400px',
                width: '100%'
            }}>
                <h1 style={{
                    textAlign: 'center',
                    color: '#2c3e50',
                    marginBottom: '10px',
                    fontSize: '28px'
                }}>
                    Sistema de Afiches
                </h1>
                <p style={{
                    textAlign: 'center',
                    color: '#7f8c8d',
                    marginBottom: '30px',
                    fontSize: '14px'
                }}>
                    Ingresa tus credenciales
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '5px',
                            color: '#2c3e50',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            Usuario
                        </label>
                        <input
                            type="text"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            required
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '16px',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3498db'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '5px',
                            color: '#2c3e50',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '16px',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3498db'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            borderRadius: '5px',
                            marginBottom: '20px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: loading ? '#95a5a6' : '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#2980b9';
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#3498db';
                        }}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div style={{
                    marginTop: '30px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    fontSize: '12px',
                    color: '#7f8c8d',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#2c3e50' }}>Ayuda rápida</p>
                    <ul style={{ paddingLeft: '18px', margin: 0, lineHeight: 1.5 }}>
                        <li>API objetivo: {API_BASE_URL}</li>
                        <li>Si no tienes credenciales, solicita acceso al administrador.</li>
                        <li>Comprueba que el backend responda en /api/health antes de iniciar sesión.</li>
                        <li>Errores comunes: usuario/contraseña vacíos o URL del backend incorrecta.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Login;
