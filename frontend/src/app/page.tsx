'use client';

import { useState, useEffect, useRef } from 'react';
import { APP_CONFIG, PredictionResult } from '@/config/app';
import { ResultsDisplay, VeterinaryRecommendationsDisplay } from '@/components/ResultsDisplay';
import { formatPriceForDisplay, calculateCowPrice } from '@/utils/formatters';

export default function Home() {
  const [activeSection, setActiveSection] = useState('inicio');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ La imagen debe ser menor a 10MB');
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

  return (
    <div className="min-h-screen bg-white">
      {/* Modales */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 text-center relative">
              <button className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-lg transition-colors" onClick={() => setShowLoginModal(false)}>&times;</button>
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
              </h2>
              <p>Accede a tu cuenta de AgroTech Vision</p>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); setShowLoginModal(false); }}>
                <div className="mb-5">
                  <label htmlFor="loginEmail" className="block mb-2 font-semibold text-gray-900">
                    <i className="fas fa-envelope mr-2"></i> Correo Electrónico
                  </label>
                  <input type="email" id="loginEmail" placeholder="tu.email@ejemplo.com" required className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors" />
                </div>
                <div className="mb-5">
                  <label htmlFor="loginPassword" className="block mb-2 font-semibold text-gray-900">
                    <i className="fas fa-lock mr-2"></i> Contraseña
                  </label>
                  <input type="password" id="loginPassword" placeholder="Tu contraseña" required className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors" />
                </div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <input type="checkbox" id="rememberMe" className="mr-2" />
                    <label htmlFor="rememberMe" className="text-sm">Recordarme</label>
                  </div>
                  <a href="#" className="text-emerald-600 text-sm hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-white p-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                  <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
                </button>
              </form>
              
              <div className="flex items-center my-6 text-gray-400">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-sm">o continuar con</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
              
              <div className="space-y-3">
                <button className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex items-center justify-center gap-3">
                  <i className="fab fa-google"></i> Google
                </button>
                <button className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex items-center justify-center gap-3">
                  <i className="fab fa-facebook-f"></i> Facebook
                </button>
                <button className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex items-center justify-center gap-3">
                  <i className="fab fa-apple"></i> Apple
                </button>
              </div>
              
              <div className="text-center mt-6 text-gray-600">
                ¿No tienes cuenta? <a href="#" className="text-emerald-600 font-semibold hover:underline" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}>Regístrate aquí</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowRegisterModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 text-center relative">
              <button className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-lg transition-colors" onClick={() => setShowRegisterModal(false)}>&times;</button>
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <i className="fas fa-user-plus"></i> Crear Cuenta
              </h2>
              <p>Únete a AgroTech Vision y comienza a transformar tu ganadería</p>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); setShowRegisterModal(false); }}>
                <div className="mb-5">
                  <label htmlFor="registerEmail" className="block mb-2 font-semibold text-gray-900">
                    <i className="fas fa-envelope mr-2"></i> Correo Electrónico
                  </label>
                  <input type="email" id="registerEmail" placeholder="tu.email@ejemplo.com" required className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors" />
                </div>
                <div className="mb-5">
                  <label htmlFor="registerPassword" className="block mb-2 font-semibold text-gray-900">
                    <i className="fas fa-lock mr-2"></i> Contraseña
                  </label>
                  <input type="password" id="registerPassword" placeholder="Mínimo 8 caracteres" required minLength={8} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors" />
                </div>
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block mb-2 font-semibold text-gray-900">
                    <i className="fas fa-lock mr-2"></i> Confirmar Contraseña
                  </label>
                  <input type="password" id="confirmPassword" placeholder="Repite tu contraseña" required className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors" />
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-white p-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                  <i className="fas fa-user-plus"></i> Registrarse
                </button>
              </form>
              
              <div className="flex items-center my-6 text-gray-400">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-sm">o registrarse con</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
              
              <div className="space-y-3">
                <button className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex items-center justify-center gap-3">
                  <i className="fab fa-google"></i> Google
                </button>
                <button className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex items-center justify-center gap-3">
                  <i className="fab fa-facebook-f"></i> Facebook
                </button>
                <button className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex items-center justify-center gap-3">
                  <i className="fab fa-apple"></i> Apple
                </button>
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
            <a href="#" className="text-xl font-bold text-gray-900 flex items-center gap-2">
              AgroTech
            </a>
            
            <button className="md:hidden p-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
            
            <nav className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:relative top-full left-0 w-full md:w-auto bg-white md:bg-transparent shadow-lg md:shadow-none border-t md:border-t-0 border-gray-200 md:border-0 p-4 md:p-0 gap-2 md:gap-6`}>
              <a href="#" className={`px-3 py-1 rounded-lg transition-colors text-center md:text-left text-sm ${activeSection === 'inicio' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('inicio'); }}>Inicio</a>
              <a href="#" className={`px-3 py-1 rounded-lg transition-colors text-center md:text-left text-sm ${activeSection === 'mision' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('mision'); }}>Misión</a>
              <a href="#" className={`px-3 py-1 rounded-lg transition-colors text-center md:text-left text-sm ${activeSection === 'como-funciona' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('como-funciona'); }}>Cómo Funciona</a>
              <a href="#" className={`px-3 py-1 rounded-lg transition-colors text-center md:text-left text-sm ${activeSection === 'chat' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('chat'); }}>IA Chat</a>
              <a href="#" className={`px-3 py-1 rounded-lg transition-colors text-center md:text-left text-sm ${activeSection === 'contacto' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('contacto'); }}>Contacto</a>
              <a href="#" className={`px-3 py-1 rounded-lg transition-colors text-center md:text-left text-sm ${activeSection === 'planes' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={(e) => { e.preventDefault(); showSection('planes'); }}>Planes</a>
            </nav>
            
            <div className="hidden md:flex gap-2">
              <a href="#" className="px-3 py-1 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors hover:border-emerald-300 text-sm" onClick={(e) => { e.preventDefault(); setShowLoginModal(true); }}>Entrar</a>
              <a href="#" className="px-4 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-md hover:shadow-lg text-sm" onClick={(e) => { e.preventDefault(); setShowRegisterModal(true); }}>Registrarse</a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-base font-medium mb-6 border border-green-300">
            <i className="fas fa-star text-green-600"></i>
            Revolucionando la ganadería con IA
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Pesaje Inteligente de Ganado con Inteligencia Artificial
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            La solución más innovadora para la gestión moderna de ganado. 
            Precisa, no invasiva y accesible desde tu dispositivo móvil.
          </p>
        
          <div className="flex justify-center">
            <a href="#" className="inline-flex items-center gap-2 px-8 py-3 bg-transparent border-2 border-gray-300 text-gray-800 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-300 shadow-md" onClick={(e) => { e.preventDefault(); showSection('chat'); }}>
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

          <div className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl p-8 mb-12 text-center shadow-lg border border-emerald-100 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-bold text-emerald-500 block mb-1">97%</span>
                <span className="text-sm text-gray-600 font-medium">Precisión</span>
              </div>
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-bold text-emerald-500 block mb-1">0%</span>
                <span className="text-sm text-gray-600 font-medium">Estrés Animal</span>
              </div>
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-bold text-emerald-500 block mb-1">24/7</span>
                <span className="text-sm text-gray-600 font-medium">Disponible</span>
              </div>
              <div className="text-center">
                <span className="text-3xl md:text-4xl font-bold text-emerald-500 block mb-1">100%</span>
                <span className="text-sm text-gray-600 font-medium">Mobile</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-camera text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Captura Simple</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Toma una foto lateral del animal con tu smartphone. 
                Nuestra IA hace el resto automáticamente.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-brain text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Análisis Inteligente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Algoritmos de machine learning entrenados con miles 
                de imágenes para máxima precisión.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-2xl text-emerald-500"></i>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Precisión del 97%</h3>
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
                  5 predicciones por mes
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-gray-500 text-xs"></i>
                  Solo acceso web
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-gray-500 text-xs"></i>
                  Resultados básicos
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-gray-500 text-xs"></i>
                  Sin historial
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-gray-500 text-xs"></i>
                  Soporte por email
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
                <div className="text-2xl font-bold text-emerald-600 mb-1">85.000</div>
                <div className="text-xs text-gray-600">PYG / mes</div>
              </div>
              <ul className="text-left space-y-2 mb-6 text-xs text-gray-700 flex-grow">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                  100 predicciones/mes
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
                  Historial 30 días
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                  Tutorial interactivo
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                  Notificaciones email
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                  Soporte por email
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
                <div className="text-2xl font-bold text-blue-600 mb-1">285.000</div>
                <div className="text-xs text-gray-600">PYG / mes</div>
                <div className="text-xs text-green-600 font-semibold">💰 15% desc. anual</div>
              </div>
              <ul className="text-left space-y-2 mb-6 text-xs text-gray-700 flex-grow">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  1.000 predicciones/mes
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Historial completo
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Reportes PDF/Excel
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Comparativas animales
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Alertas peso anormal
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Hasta 3 usuarios
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Capacitación videollamada
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Soporte WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-blue-500 text-xs"></i>
                  Sincronización automática
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
                <div className="text-2xl font-bold text-purple-600 mb-1">1.050.000</div>
                <div className="text-xs text-gray-600">PYG / mes</div>
                <div className="text-xs text-green-600 font-semibold">💰 20% desc. anual</div>
              </div>
              <ul className="text-left space-y-2 mb-6 text-xs text-gray-700 flex-grow">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  5.000 predicciones/mes
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Acceso completo API
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Reportes IA avanzados
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Análisis predictivo
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Consultoría mensual
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Usuarios ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Integración ERP
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Backup automático
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Soporte premium
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-purple-500 text-xs"></i>
                  Funciones exclusivas
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
                <span>App móvil nativa</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <i className="fas fa-shield-alt text-emerald-500"></i>
                <span>Encriptación de datos</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <i className="fas fa-chart-line text-emerald-500"></i>
                <span>Dashboard en tiempo real</span>
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
                <p className="text-sm"><strong>Email:</strong> soporte@agrotechvision.com</p>
                <p className="text-sm"><strong>Teléfono:</strong> +595 981 123 456</p>
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
