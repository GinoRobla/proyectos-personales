export const formatDate = (dateString) => {
  if (!dateString) return "Fecha no disponible";
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // Menos de un minuto
    if (diffInSeconds < 60) {
      return "Ahora";
    }
    
    // Menos de una hora
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `hace ${minutes} min${minutes > 1 ? 's' : ''}`;
    }
    
    // Menos de un día
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    }
    
    // Menos de una semana
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `hace ${days} día${days > 1 ? 's' : ''}`;
    }
    
    // Más de una semana, mostrar fecha completa
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Fecha no válida";
  }
};