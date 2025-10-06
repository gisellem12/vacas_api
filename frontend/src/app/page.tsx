'use client';

import { useState, useEffect, useRef } from 'react';
import { APP_CONFIG, PredictionResult } from '@/config/app';
import { ResultsDisplay, VeterinaryRecommendationsDisplay } from '@/components/ResultsDisplay';
import { formatPriceForDisplay, calculateCowPrice } from '@/utils/formatters';

// Declaraciones de tipos para Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export default function Home() {
  const [activeSection, setActiveSection] = useState('inicio');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PredictionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debug: Monitorear cambios en analysisResult
  useEffect(() => {
    console.log('🔄 analysisResult cambió:', analysisResult);
  }, [analysisResult]);

  const showSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
  };

  const handleFileUpload = async (file: File) => {
    console.log('Archivo seleccionado:', file.name);
    
    if (!file.type.match('image.*')) {
      alert('❌ Por favor, sube solo imágenes (JPG, PNG, WEBP)');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      alert('❌ La imagen debe ser menor a 50MB');
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);
    setAnalysisResult(null);
    
    console.log('Iniciando análisis con calibración por dispositivo...');
    
    try {
      // Crear FormData para enviar la imagen al backend
      const formData = new FormData();
      formData.append('file', file);
      
      // Usar el endpoint con FormData que es más eficiente
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/predict-file`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Respuesta completa del backend:', data);
      console.log('🔍 Tipo de data:', typeof data);
      console.log('🔍 Keys en data:', Object.keys(data));
      
      // Usar directamente la respuesta del backend que ya incluye recomendaciones
      const result: PredictionResult = {
        peso: data.peso || 0,
        recomendaciones: data.recomendaciones || {
          nutricion: ['Mantener dieta balanceada'],
          manejo: ['Control regular'],
          salud: ['Revisión veterinaria']
        },
        metodologia: data.metodologia,
        peso_openai: data.peso_openai,
        peso_dataset: data.peso_dataset,
        peso_original: data.peso_original,
        factor_correccion_global: data.factor_correccion_global,
        confianza: data.confianza,
        observaciones: data.observaciones
      };
      
      console.log('🎯 Resultado final procesado:', result);
      console.log('🔍 Verificando datos antes de setAnalysisResult:');
      console.log('- Peso:', result.peso);
      console.log('- Metodología:', result.metodologia);
      console.log('- Recomendaciones:', result.recomendaciones);
      setAnalysisResult(result);
      console.log('✅ analysisResult establecido');
      
    } catch (error) {
      console.error('Error en el análisis:', error);
      alert(`❌ Error en el análisis: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    setAnalysisResult(null);
  };

  // ===== FUNCIONES DE NOTIFICACIÓN =====
  const showNotification = (message: string, type: 'success' | 'error') => {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  // ===== MANEJO DE FORMULARIOS =====
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (email && password) {
      try {
        const response = await fetch(`${APP_CONFIG.API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
          showNotification(`✅ Bienvenido ${data.user?.name || data.user?.email}`, 'success');
          setIsAuthenticated(true);
          setUser({
            name: data.user?.name || data.user?.email,
            email: data.user?.email
          });
          setShowLoginModal(false);
          setMobileMenuOpen(false); // Cerrar menú móvil al hacer login exitoso
          // Reset del formulario de manera segura
          try {
            if (e.currentTarget) {
              e.currentTarget.reset();
            }
          } catch (error) {
            console.log('⚠ No se pudo resetear el formulario, pero el login fue exitoso');
          }
        } else {
          showNotification(`⚠ Error: ${data.message}`, 'error');
        }
      } catch (error) {
        showNotification(`⚠ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
      }
    } else {
      showNotification('⚠ Por favor, completa todos los campos', 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('🔐 Iniciando proceso de registro...');
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    console.log('📝 Datos del formulario:', { email, password: password ? '***' : 'vacío', confirmPassword: confirmPassword ? '***' : 'vacío' });
    
    if (!email || !password || !confirmPassword) {
      console.log('❌ Campos vacíos detectados');
      showNotification('⚠ Por favor, completa todos los campos', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      console.log('❌ Contraseñas no coinciden');
      showNotification('⚠ Las contraseñas no coinciden', 'error');
      return;
    }
    
    if (password.length < 8) {
      console.log('❌ Contraseña muy corta');
      showNotification('⚠ La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    console.log('📡 Enviando datos al backend...');
    try {
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('📨 Respuesta del backend:', response.status, response.statusText);
      const data = await response.json();
      console.log('📊 Datos recibidos:', data);
      
      if (response.ok) {
        console.log('✅ Registro exitoso');
        showNotification('✅ ¡Registro exitoso! Bienvenido a AgroTech Vision', 'success');
        setShowRegisterModal(false);
        // Reset del formulario de manera segura
        try {
          if (e.currentTarget) {
            e.currentTarget.reset();
          }
        } catch (error) {
          console.log('⚠ No se pudo resetear el formulario, pero el registro fue exitoso');
        }
      } else {
        console.log('❌ Error del backend:', data.message);
        showNotification(`⚠ Error: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      showNotification(`⚠ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    }
  };

  // ===== GOOGLE OAUTH CONFIGURATION =====
  useEffect(() => {
    // Cargar el script de Google Identity Services solo si no existe
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      // Configurar Google OAuth cuando el script se carga
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: '490126152605-00mok4vj7o1m1m2n5v7i6udhmrn6f180.apps.googleusercontent.com',
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
        }
      };
    } else if (window.google) {
      // Si el script ya existe, solo inicializar
      window.google.accounts.id.initialize({
        client_id: '490126152605-00mok4vj7o1m1m2n5v7i6udhmrn6f180.apps.googleusercontent.com',
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });
    }
  }, []);

  // Renderizar botones cuando se abren los modales
  useEffect(() => {
    if (showLoginModal || showRegisterModal) {
      setTimeout(() => {
        renderGoogleButtons();
      }, 200);
    }
  }, [showLoginModal, showRegisterModal]);

  const renderGoogleButtons = () => {
    // Renderizar botón de login
    const loginButton = document.querySelector('#g_id_onload') as HTMLElement;
    if (loginButton && window.google) {
      window.google.accounts.id.renderButton(loginButton, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'signin_with',
        size: 'large',
        width: '100%'
      });
    }

    // Renderizar botón de registro
    const registerButton = document.querySelector('#g_id_onload_register') as HTMLElement;
    if (registerButton && window.google) {
      window.google.accounts.id.renderButton(registerButton, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'signup_with',
        size: 'large',
        width: '100%'
      });
    }
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      console.log('🔐 Respuesta de Google recibida:', response);
      
      // Enviar el token de Google al backend
      const backendResponse = await fetch(`${APP_CONFIG.API_BASE_URL}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential
        })
      });

      const userData = await backendResponse.json();
      console.log('📡 Respuesta del backend:', userData);
      
      if (backendResponse.ok) {
        showNotification(`✅ Bienvenido ${userData.user?.name || userData.user?.email}`, 'success');
        setIsAuthenticated(true);
        setUser({
          name: userData.user?.name || userData.user?.email,
          email: userData.user?.email
        });
        setShowLoginModal(false);
        setShowRegisterModal(false);
        setMobileMenuOpen(false); // Cerrar menú móvil al hacer login exitoso
        // Aquí podrías guardar el token en localStorage o en el estado global
        // localStorage.setItem('authToken', userData.token);
      } else {
        showNotification(`❌ Error: ${userData.message}`, 'error');
      }
    } catch (error) {
      console.error('Error al procesar respuesta de Google:', error);
      showNotification('❌ Error al iniciar sesión con Google', 'error');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setMobileMenuOpen(false); // Cerrar menú móvil al hacer logout
    showNotification('👋 ¡Hasta luego!', 'success');
    // Aquí podrías limpiar el token del localStorage si lo guardaste
    // localStorage.removeItem('authToken');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Modales */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-t-2xl text-center relative">
              <button className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-lg transition-colors" onClick={() => setShowLoginModal(false)}>&times;</button>
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
              </h2>
              <p>Accede a tu cuenta de AgroTech Vision</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleLogin}>
                <div className="mb-5">
                  <label htmlFor="loginEmail" className="block mb-2 font-semibold text-gray-900">
                    <i className="fas fa-envelope mr-2"></i> Correo Electrónico
                  </label>
                  <input type="email" name="email" id="loginEmail" placeholder="tu.email@ejemplo.com" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" />
                </div>
                <div className="mb-5">
                  <label htmlFor="loginPassword" className="block mb-2 font-semibold text-gray-900">
                    <i className="fas fa-lock mr-2"></i> Contraseña
                  </label>
                  <input type="password" name="password" id="loginPassword" placeholder="Tu contraseña" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" />
                </div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <input type="checkbox" id="rememberMe" className="mr-2" />
                    <label htmlFor="rememberMe" className="text-sm">Recordarme</label>
                  </div>
                  <a href="#" className="text-emerald-600 text-sm hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
                <button type="submit" className="bg-emerald-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-600 transition-colors shadow-md hover:shadow-lg w-full">
                  <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
                </button>
              </form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o continuar con</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div 
                  id="g_id_onload"
                  className="w-full"
                ></div>
              </div>
              
              <div className="text-center mt-6 text-gray-600">
                ¿No tienes cuenta? <a href="#" className="text-emerald-600 font-semibold hover:underline" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}>Regístrate aquí</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRegisterModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-t-2xl text-center relative">
              <button className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-lg transition-colors" onClick={() => setShowRegisterModal(false)}>&times;</button>
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <i className="fas fa-user-plus"></i> Crear Cuenta
              </h2>
              <p>Únete a AgroTech Vision y comienza a transformar tu ganadería</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleRegister}>
                <div className="mb-5">
                  <label htmlFor="registerEmail" className="block mb-2 font-semibold text-gray-900">
                    <i className="fas fa-envelope mr-2"></i> Correo Electrónico
                  </label>
                  <input type="email" name="email" id="registerEmail" placeholder="tu.email@ejemplo.com" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" />
                </div>
                <div className="mb-5">
                  <label htmlFor="registerPassword" className="block mb-2 font-semibold text-gray-900">
                    <i className="fas fa-lock mr-2"></i> Contraseña
                  </label>
                  <input type="password" name="password" id="registerPassword" placeholder="Mínimo 8 caracteres" required minLength={8} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" />
                </div>
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block mb-2 font-semibold text-gray-900">
                    <i className="fas fa-lock mr-2"></i> Confirmar Contraseña
                  </label>
                  <input type="password" name="confirmPassword" id="confirmPassword" placeholder="Repite tu contraseña" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" />
                </div>
                <button type="submit" className="bg-emerald-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-600 transition-colors shadow-md hover:shadow-lg w-full" onClick={() => console.log('🔘 Botón de registro clickeado')}>
                  <i className="fas fa-user-plus"></i> Registrarse
                </button>
              </form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o registrarse con</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div 
                  id="g_id_onload_register"
                  className="w-full"
                ></div>
              </div>
              
              <div className="text-center mt-6 text-gray-600">
                ¿Ya tienes cuenta? <a href="#" className="text-emerald-600 font-semibold hover:underline" onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}>Inicia sesión aquí</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <a href="#" className="text-2xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
              AgroTech
            </a>
            
            {/* Botones de autenticación para móvil en el header */}
            <div className="md:hidden flex items-center gap-2">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-600 hidden sm:block">
                    ¡Hola, {user.name}!
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="bg-gray-100 text-gray-700 py-1 px-3 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="bg-gray-100 text-gray-700 py-1 px-2 rounded text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Entrar
                  </button>
                  <button 
                    onClick={() => setShowRegisterModal(true)}
                    className="bg-emerald-500 text-white py-1 px-2 rounded text-sm font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    Reg.
                  </button>
                </div>
              )}
              <button className="p-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </button>
            </div>
            
            <nav className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:relative top-full left-0 w-full md:w-auto bg-white md:bg-transparent shadow-lg md:shadow-none border-t md:border-t-0 border-gray-200 md:border-0 p-4 md:p-0 gap-1 md:gap-8`}>
              <a href="#" className={`px-3 py-2 rounded-lg transition-colors text-center md:text-left text-sm font-medium ${activeSection === 'inicio' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('inicio'); }}>Inicio</a>
              <a href="#" className={`px-3 py-2 rounded-lg transition-colors text-center md:text-left text-sm font-medium ${activeSection === 'mision' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('mision'); }}>Misión</a>
              <a href="#" className={`px-3 py-2 rounded-lg transition-colors text-center md:text-left text-sm font-medium ${activeSection === 'como-funciona' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('como-funciona'); }}>Cómo Funciona</a>
              <a href="#" className={`px-3 py-2 rounded-lg transition-colors text-center md:text-left text-sm font-medium ${activeSection === 'chat' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('chat'); }}>IA Chat</a>
              <a href="#" className={`px-3 py-2 rounded-lg transition-colors text-center md:text-left text-sm font-medium ${activeSection === 'contacto' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('contacto'); }}>Contacto</a>
              <a href="#" className={`px-3 py-2 rounded-lg transition-colors text-center md:text-left text-sm font-medium ${activeSection === 'planes' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('planes'); }}>Planes</a>
              
              {/* Botones de autenticación para móvil */}
              <div className="md:hidden flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200">
                {isAuthenticated && user ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <i className="fas fa-user-circle text-emerald-500 text-xl"></i>
                        <span className="text-emerald-700 font-semibold text-lg">
                          ¡Hola, {user.name}!
                        </span>
                      </div>
                      <p className="text-emerald-600 text-sm">{user.email}</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300 flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <>
                    <a href="#" className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300 text-center flex items-center justify-center gap-2" onClick={(e) => { e.preventDefault(); setShowLoginModal(true); }}>
                      <i className="fas fa-sign-in-alt"></i>
                      Entrar
                    </a>
                    <a href="#" className="bg-emerald-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-600 transition-colors shadow-md hover:shadow-lg text-center flex items-center justify-center gap-2" onClick={(e) => { e.preventDefault(); setShowRegisterModal(true); }}>
                      <i className="fas fa-user-plus"></i>
                      Registrarse
                    </a>
                  </>
                )}
              </div>
            </nav>
            
        <div className="hidden md:flex gap-3 items-center">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-semibold">
                ¡Hola, {user.name}!
              </span>
              <button 
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <>
              <a href="#" className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300" onClick={(e) => { e.preventDefault(); setShowLoginModal(true); }}>Entrar</a>
              <a href="#" className="bg-emerald-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-600 transition-colors shadow-md hover:shadow-lg" onClick={(e) => { e.preventDefault(); setShowRegisterModal(true); }}>Registrarse</a>
            </>
          )}
        </div>
          </div>
        </div>
      </header>

      {/* Sección Principal con Imagen de Fondo */}
      <section className="min-h-screen min-h-dvh bg-gradient-to-br from-white/98 to-emerald-50/30 bg-[url('https://certifiedhumanelatino.org/wp-content/uploads/2021/06/Design-sem-nome-2-1.png')] bg-cover bg-center bg-fixed flex items-center relative py-24 px-4">
        {/* Overlay adicional con gradiente diagonal */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-emerald-50/15 z-1"></div> 
        
        {/* Contenido principal centrado */}
        <div className="w-full max-w-6xl mx-auto relative z-10 text-center">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-emerald-200">
            <i className="fas fa-star"></i>
            Revolucionando la ganadería con IA
          </div>
          
          {/* Título principal */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Pesaje Inteligente de Ganado con Inteligencia Artificial
          </h1>
          
          {/* Subtítulo */}
          <p className="text-base md:text-lg lg:text-xl text-gray-800 mb-8 max-w-2xl mx-auto leading-relaxed">
            La solución más innovadora para la gestión moderna de ganado. 
            Precisa, no invasiva y accesible desde tu dispositivo móvil.
          </p>
        
          {/* Botón de acción */}
          <div className="flex justify-center">
            <a href="#" className="bg-transparent border-2 border-emerald-500 text-emerald-600 px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold text-sm md:text-base hover:bg-emerald-500 hover:text-white transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 min-h-[54px]" onClick={(e) => { e.preventDefault(); showSection('chat'); }}>
              <i className="fas fa-robot"></i>
              Probar IA Gratis
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Sección Inicio */}
        <section id="inicio" className={`${activeSection === 'inicio' ? 'block' : 'hidden'}`}>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Transforma tu Gestión Ganadera</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              AgroTech Vision utiliza inteligencia artificial de vanguardia para estimar 
              el peso de tu ganado con precisión excepcional.
            </p>
          </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-emerald-600 block mb-2">94%</span>
              <span className="text-sm text-gray-600 font-medium">Precisión</span>
            </div>
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-emerald-600 block mb-2">0%</span>
              <span className="text-sm text-gray-600 font-medium">Estrés Animal</span>
            </div>
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-emerald-600 block mb-2">24/7</span>
              <span className="text-sm text-gray-600 font-medium">Disponible</span>
            </div>
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-emerald-600 block mb-2">100%</span>
              <span className="text-sm text-gray-600 font-medium">Mobile</span>
            </div>
          </div>
        </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-camera"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Captura Simple</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Toma una foto lateral del animal con tu smartphone. 
                Nuestra IA hace el resto automáticamente.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-brain"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Análisis Inteligente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Algoritmos de machine learning entrenados con miles 
                de imágenes para máxima precisión.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Resultados Inmediatos</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Recibe el peso estimado en segundos y almacena 
                el historial de crecimiento automáticamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-bullseye text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Precisión del 94%</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Comparable a básculas tradicionales con tecnología de vanguardia.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-heart text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cero Estrés Animal</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Medición completamente no invasiva y respetuosa.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-piggy-bank text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ahorro Significativo</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Reduce costos en equipamiento costoso tradicional.
              </p>
            </div>
          </div>
        </section>

        {/* Sección Misión */}
        <section id="mision" className={`${activeSection === 'mision' ? 'block' : 'hidden'}`}>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Nuestro Compromiso</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Modernizando la ganadería mediante soluciones tecnológicas accesibles y efectivas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-bullseye text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Misión</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Democratizar el acceso a tecnología de punta para ganaderos, proporcionando herramientas 
                innovadoras que optimicen la gestión, reduzcan costos y mejoren la rentabilidad.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-eye text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Visión</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Liderar la transformación digital del sector ganadero en Latinoamérica, siendo reconocidos 
                por nuestra innovación, precisión y compromiso con el desarrollo sostenible.
              </p>
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Valores Fundamentales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-lightbulb text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Innovación</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Desarrollamos tecnología de vanguardia adaptada a las necesidades reales del campo moderno.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-handshake text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Compromiso</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Estamos dedicados al éxito y crecimiento sostenible de nuestros clientes ganaderos.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-bullseye text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Precisión</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Garantizamos resultados confiables y exactos en cada medición y análisis.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-seedling text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Sostenibilidad</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Promovemos prácticas ganaderas eficientes y respetuosas con el medio ambiente.
              </p>
            </div>
          </div>
        </section>

        {/* Sección Cómo Funciona */}
        <section id="como-funciona" className={`${activeSection === 'como-funciona' ? 'block' : 'hidden'}`}>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Cómo Funciona</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Tres simples pasos para transformar tu gestión ganadera
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-500">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Paso 1: Captura</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Toma una foto lateral clara del animal con tu dispositivo móvil en un entorno bien iluminado.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-500">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Paso 2: Análisis</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nuestra IA procesa la imagen utilizando algoritmos avanzados de visión por computadora.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-500">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Paso 3: Resultados</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Recibe el peso estimado instantáneamente y almacena el historial automáticamente.
              </p>
            </div>
          </div>
        </section>

        {/* Sección Chat IA */}
        <section id="chat" className={`${activeSection === 'chat' ? 'block' : 'hidden'}`}>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">AgroTech AI Assistant</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Prueba nuestra inteligencia artificial en versión beta. Sube imágenes y obtén análisis preliminares.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-5xl mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-purple-600 text-white p-6 text-center">
              <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-3">
                <i className="fas fa-robot"></i> Chat de Análisis de Ganado
              </h3>
              <p className="text-emerald-100">Versión Beta - AgroTech V1</p>
            </div>
            
            {/* Área de subida de imágenes y análisis */}
            <div className="p-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Análisis de Peso con IA</h2>
                <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
                  Sube una imagen de ganado y obtén la estimación precisa de peso corporal.
                </p>
              </div>
              
              {/* Área de subida de imágenes */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <div 
                  className={`border-3 border-dashed border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 hover:border-emerald-600 hover:bg-emerald-50/50 ${isDragOver ? 'border-emerald-600 bg-emerald-50 scale-105' : ''} ${isUploading ? 'pointer-events-none bg-emerald-50' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                      <h4 className="text-emerald-600 text-xl font-semibold">Analizando imagen...</h4>
                      <p className="text-gray-600">Por favor espera mientras procesamos tu imagen</p>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                        <i className="fas fa-cloud-upload-alt text-2xl text-emerald-500"></i> 
                        Subir Imagen de Ganado
                      </h4>
                      <p className="text-gray-700 mb-2">Haz clic aquí para seleccionar una imagen o arrastra y suelta</p>
                      <p className="text-sm text-gray-500">Formatos soportados: JPG, PNG, WEBP (Máx. 10MB)</p>
                    </>
                  )}
                </div>
                
                {previewUrl && (
                  <div className="mt-6 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                      <h5 className="text-gray-900 font-semibold flex items-center gap-2">
                        <i className="fas fa-image text-emerald-500"></i> Vista Previa
                      </h5>
                      <button className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors" onClick={clearImage}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="p-4 flex justify-center">
                      <img src={previewUrl} alt="Preview de ganado" className="max-w-full max-h-80 rounded-lg shadow-md object-cover" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sección de resultados del análisis */}
              {analysisResult && (
                <div className="mt-8 w-full bg-white p-6 rounded-xl border-2 border-emerald-500 shadow-lg relative z-10">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Resultados del Análisis</h2>
                  
                  {/* Peso */}
                  <div className="bg-emerald-50 p-6 rounded-xl mb-4 border-2 border-emerald-500">
                    <h3 className="text-emerald-600 text-lg font-semibold mb-3"> Peso Estimado</h3>
                    <p className="text-4xl font-bold text-emerald-800">
                      {analysisResult.peso} kg
                    </p>
                    
                    {/* Precio de la vaca calculado */}
                    <div className="mt-4 pt-4 border-t border-emerald-300">
                      <h4 className="text-emerald-700 text-sm font-medium mb-2"> Precio Estimado</h4>
                      <p className="text-2xl font-bold text-emerald-900">
                        {analysisResult.precio || calculateCowPrice(analysisResult.peso)}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        Cálculo: {analysisResult.peso} kg × ₲15.299 = {analysisResult.precio || calculateCowPrice(analysisResult.peso)}
                      </p>
                    </div>
                  </div>


                  {/* Recomendaciones */}
                  {analysisResult.recomendaciones && (
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h3 className="text-gray-800 text-lg font-semibold mb-4">🩺 Recomendaciones</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Nutrición */}
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-300">
                          <h4 className="text-emerald-700 font-semibold mb-3 text-base">🌱 Nutrición</h4>
                          <ul className="space-y-2">
                            {analysisResult.recomendaciones.nutricion.map((rec, index) => (
                              <li key={index} className="text-sm text-gray-700">{rec}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Manejo */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                          <h4 className="text-blue-700 font-semibold mb-3 text-base">⚙️ Manejo</h4>
                          <ul className="space-y-2">
                            {analysisResult.recomendaciones.manejo.map((rec, index) => (
                              <li key={index} className="text-sm text-gray-700">{rec}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Salud */}
                        <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                          <h4 className="text-red-700 font-semibold mb-3 text-base">❤️ Salud</h4>
                          <ul className="space-y-2">
                            {analysisResult.recomendaciones.salud.map((rec, index) => (
                              <li key={index} className="text-sm text-gray-700">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recomendaciones específicas para computadora */}
                  {analysisResult.dispositivo === 'webcam' && (
                    <div className="bg-blue-50 p-4 rounded-xl mt-4 border border-blue-200">
                      <h4 className="text-blue-700 text-sm font-medium mb-2 flex items-center">
                        <i className="fas fa-desktop mr-2"></i>
                        💻 Optimización para Computadora
                      </h4>
                      <div className="text-blue-600 text-xs space-y-1">
                        <p>• <strong>Iluminación:</strong> Usa luz natural o lámpara cerca de la ventana</p>
                        <p>• <strong>Distancia:</strong> Mantén 2-3 metros de distancia de la vaca</p>
                        <p>• <strong>Ángulo:</strong> Toma la foto desde el lado, no de frente</p>
                        <p>• <strong>Estabilidad:</strong> Apoya la computadora para evitar movimientos</p>
                        <p>• <strong>Limpieza:</strong> Limpia la cámara web antes de tomar la foto</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>


        {/* Sección Planes de Suscripción */}
        <section id="planes" className={`${activeSection === 'planes' ? 'block' : 'hidden'}`}>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"> Planes de Suscripción – Web + App IA Ganadera</h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Nuestra plataforma con Inteligencia Artificial predice el peso de tu ganado de forma rápida, confiable y accesible desde la web y la app móvil.
            </p>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">📦 Planes Disponibles</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
            {/* Plan Free */}
            <div className="bg-white p-5 rounded-xl shadow-lg border-2 border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-400"></div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🆓</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Plan Free</h3>
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-600 mb-1">Gratis</div>
                <div className="text-xs text-gray-500">Para siempre</div>
              </div>
              <ul className="text-left space-y-2 mb-6 text-xs text-gray-700 flex-grow">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-gray-500 text-xs"></i>
                  10 predicciones por mes
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-gray-500 text-xs"></i>
                  Resultados basicos 
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-times text-red-500 text-xs"></i>
                  Recomendaciones 
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-gray-500 text-xs"></i>
                  Acceso desde móvil/tablet
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-times text-red-500 text-xs"></i>
                  Soporte técnico
                </li>
              </ul>
              <button className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg text-sm">
                Comenzar Gratis
              </button>
            </div>

            {/* Plan Básico */}
            <div className="bg-white p-5 rounded-xl shadow-lg border-2 border-emerald-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🌱</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Plan Básico</h3>
              <div className="mb-4">
                <div className="text-2xl font-bold text-emerald-600 mb-1">285.000</div>
                <div className="text-xs text-gray-600">PYG / mes</div>
              </div>
              <ul className="text-left space-y-2 mb-6 text-xs text-gray-700 flex-grow">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                  100 predicciones por mes
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                  Web y app móvil
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                  Resultados instantáneos
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                  Recomendaciones personalizadas
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                  Acceso desde móvil/tablet
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                  Soporte técnico
                </li>
              </ul>
              <button className="w-full bg-emerald-500 text-white py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors shadow-md hover:shadow-lg text-sm">
                Elegir Plan Básico
              </button>
            </div>

            {/* Plan Pro */}
            <div className="bg-white p-5 rounded-xl shadow-xl border-2 border-blue-500 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden transform scale-105 h-full flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-bl-lg text-xs font-semibold">
                Más Popular
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🌾</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Plan Pro</h3>
              <div className="mb-4">
                <div className="text-2xl font-bold text-blue-600 mb-1">570.000</div>
                <div className="text-xs text-gray-600">PYG / mes</div>
                <div className="text-xs text-green-600 font-semibold">💰 15% desc. anual</div>
              </div>
              <ul className="text-left space-y-2 mb-6 text-xs text-gray-700 flex-grow">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  600 predicciones por mes
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Web y app móvil
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Resultados instantáneos
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Hasta 3 usuarios
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Recomendaciones personalizadas
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Acceso desde móvil/tablet
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Soporte técnico prioritario
                </li>
              </ul>
              <button className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg text-sm">
                Elegir Plan Pro
              </button>
            </div>

            {/* Plan Premium */}
            <div className="bg-white p-5 rounded-xl shadow-lg border-2 border-purple-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🐂</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Plan Premium</h3>
              <div className="mb-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">1.500.000</div>
                <div className="text-xs text-gray-600">PYG / mes</div>
                <div className="text-xs text-green-600 font-semibold">💰 20% desc. anual</div>
              </div>
              <ul className="text-left space-y-2 mb-6 text-xs text-gray-700 flex-grow">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  3.000 predicciones/mes
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Hasta 5 usuarios
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Resultados instantáneos
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Recomendaciones personalizadas
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Acceso desde móvil/tablet
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Soporte técnico en tiempo real
                </li>
              </ul>
              <button className="w-full bg-purple-500 text-white py-2 rounded-lg font-semibold hover:bg-purple-600 transition-colors shadow-md hover:shadow-lg text-sm">
                Elegir Plan Premium
              </button>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8 text-center max-w-6xl mx-auto border border-emerald-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Características Incluidas en Todos los Planes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <i className="fas fa-cloud text-emerald-500"></i>
                <span>IA en la nube</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <i className="fas fa-mobile-alt text-emerald-500"></i>
                <span>App móvil y web</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <i className="fas fa-shield-alt text-emerald-500"></i>
                <span>Resultados instantaneos</span>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm">
              Todos los planes incluyen la potencia de la IA en la nube y están optimizados para trabajar tanto en la web como en la aplicación móvil.
            </p>
            <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
              <p className="text-emerald-700 text-sm font-medium">
                🎯 <strong>Garantía de satisfacción:</strong> Prueba cualquier plan durante 14 días sin compromiso
              </p>
            </div>
          </div>
        </section>

        {/* Sección Contacto */}
        <section id="contacto" className={`${activeSection === 'contacto' ? 'block' : 'hidden'}`}>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Contacto y Soporte</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Estamos aquí para ayudarte. Contáctanos para cualquier consulta o soporte técnico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
              <div className="text-gray-600 text-left space-y-2">
                <p className="text-sm"><strong>Email:</strong> agrotechvisionpy@gmail.com</p>
                <p className="text-sm"><strong>Teléfono:</strong> +595 971 760 011</p>
                <p className="text-sm"><strong>Dirección:</strong> Av. Ganadera 123, Asunción</p>
                <p className="text-sm"><strong>Horario:</strong> Lun-Vie 7:00 - 17:00</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-tools text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Soporte Técnico</h3>
              <div className="text-gray-600 text-left">
                <p className="text-sm mb-3">Para asistencia técnica, incluye en tu mensaje:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Modelo de tu dispositivo</li>
                  <li>Descripción del problema</li>
                  <li>Capturas de pantalla</li>
                  <li>Tus datos de contacto</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <a href="#" className="text-2xl font-bold text-white mb-4 inline-block hover:text-emerald-400 transition-colors">
            AgroTech Vision
          </a>
          
          <p className="text-base mb-8 leading-relaxed max-w-xl mx-auto">
            Tecnología innovadora para la ganadería moderna. 
            Precisión, eficiencia y sostenibilidad.
          </p>
          
          <div className="border-t border-gray-700 pt-8">
            <p className="text-sm">&copy; 2024 AgroTech Vision. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
