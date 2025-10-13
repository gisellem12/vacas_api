import { APP_CONFIG } from '@/config/app';

export interface User {
  name: string;
  email: string;
  login_method?: string;
}

export interface AuthResponse {
  valid: boolean;
  email?: string;
  name?: string;
  login_method?: string;
  message?: string;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'authToken';

  /**
   * Obtener el token de autenticación del localStorage
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Guardar el token de autenticación en localStorage
   */
  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Remover el token de autenticación del localStorage
   */
  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Verificar si el token actual es válido
   */
  static async verifyToken(): Promise<AuthResponse> {
    const token = this.getToken();
    
    if (!token) {
      return { valid: false, message: 'No hay token disponible' };
    }

    try {
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok || !data.valid) {
        // Token inválido, limpiarlo
        this.removeToken();
        return { valid: false, message: data.message || 'Token inválido' };
      }

      return data;
    } catch (error) {
      console.error('Error verificando token:', error);
      this.removeToken();
      return { valid: false, message: 'Error de conexión' };
    }
  }

  /**
   * Realizar una petición autenticada
   */
  static async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Solo agregar Content-Type si no es FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si recibimos un 401, el token probablemente expiró
    if (response.status === 401) {
      this.removeToken();
      // Podrías redirigir al login aquí si es necesario
      throw new Error('Sesión expirada');
    }

    return response;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}
