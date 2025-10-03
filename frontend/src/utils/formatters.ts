// Utilidades para formateo de números y precios

// Precio por kilo en guaraníes (número entero)
const PRECIO_POR_KILO = 15299;

/**
 * Calcula el precio de una vaca basado en su peso
 * @param pesoKg Peso en kilogramos
 * @returns Precio formateado en guaraníes con símbolo ₲
 */
export function calculateCowPrice(pesoKg: number): string {
  const precio = Math.floor(pesoKg * PRECIO_POR_KILO);
  return `₲${precio.toLocaleString('es-ES')}`;
}

/**
 * Formatea un precio ya calculado para mostrar en la interfaz
 * @param precio Precio en formato string (ej: "6.500.575 Gs")
 * @returns Precio formateado para mostrar
 */
export function formatPriceForDisplay(precio: string): string {
  // Si ya tiene el formato correcto, lo devuelve tal como está
  if (precio.includes('Gs')) {
    return precio;
  }
  
  // Si es solo un número, lo formatea
  const num = parseFloat(precio);
  if (!isNaN(num)) {
    return `₲${Math.floor(num).toLocaleString('es-ES')}`;
  }
  
  return precio;
}
