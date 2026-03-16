import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Review {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface LoyaltyPoints {
  id: string;
  business_id: string;
  customer_phone: string;
  customer_name: string | null;
  points: number;
  total_orders: number;
  last_visit: string;
  created_at: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export function useReviews(businessId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);

  // Obtener reseñas del negocio
  const fetchReviews = useCallback(async (limit = 5) => {
    if (!businessId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        // Si la tabla no existe, no mostrar error al usuario
        if (fetchError.message?.includes('relation') || fetchError.message?.includes('does not exist')) {
          console.warn('[useReviews] Tabla reviews no existe. Ejecutar script SQL primero.');
          setReviews([]);
          setLoading(false);
          return;
        }
        throw fetchError;
      }

      setReviews(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar reseñas';
      setError(message);
      console.error('[useReviews] Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Obtener estadísticas de reseñas
  const fetchStats = useCallback(async () => {
    if (!businessId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('business_id', businessId);

      if (fetchError) {
        // Si la tabla no existe, no mostrar error
        if (fetchError.message?.includes('relation') || fetchError.message?.includes('does not exist')) {
          setStats({ averageRating: 0, totalReviews: 0 });
          return;
        }
        throw fetchError;
      }

      const totalReviews = data?.length || 0;
      const averageRating = data && data.length > 0
        ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
        : 0;

      setStats({ averageRating, totalReviews });
    } catch (err: unknown) {
      console.error('[useReviews] Error fetching stats:', err);
      setStats({ averageRating: 0, totalReviews: 0 });
    }
  }, [businessId]);

  // Verificar si cliente ya dejó reseña hoy
  const checkDailyReview = useCallback(async (customerPhone: string): Promise<boolean> => {
    if (!businessId || !customerPhone) return false;

    try {
      const { data, error: fetchError } = await supabase.rpc('check_daily_review', {
        p_business_id: businessId,
        p_customer_phone: customerPhone
      });

      if (fetchError) {
        // Si la función no existe, permitir reseña (no bloquear)
        if (fetchError.message?.includes('does not exist') || fetchError.message?.includes('not found')) {
          console.warn('[useReviews] Función check_daily_review no existe. Permitir reseña.');
          return true;
        }
        console.error('[useReviews] Error checking daily review:', fetchError);
        return false;
      }

      return data || false;
    } catch (err: unknown) {
      console.error('[useReviews] Error checking daily review:', err);
      return false;
    }
  }, [businessId]);

  // Enviar reseña
  const submitReview = useCallback(async (
    customerName: string,
    customerPhone: string | null,
    rating: number,
    comment: string | null
  ): Promise<{ success: boolean; points?: number; message?: string }> => {
    if (!businessId || !customerName || !rating) {
      return { success: false, message: 'Datos incompletos' };
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar si ya dejó reseña hoy
      if (customerPhone) {
        const canReview = await checkDailyReview(customerPhone);
        if (!canReview) {
          return { success: false, message: 'Ya dejaste una reseña hoy. ¡Volvé mañana!' };
        }
      }

      // Insertar reseña
      const { data: insertedData, error: insertError } = await supabase
        .from('reviews')
        .insert({
          business_id: businessId,
          customer_name: customerName,
          customer_phone: customerPhone,
          rating,
          comment
        })
        .select()
        .single();

      if (insertError) {
        // Convertir error a string para logging
        const errorStr = JSON.stringify(insertError, null, 2);
        console.error('[useReviews] Insert error:', errorStr);
        
        // Si la tabla no existe, mostrar mensaje útil
        if (insertError.message?.includes('relation') || insertError.message?.includes('does not exist')) {
          return { 
            success: false, 
            message: 'Error: Las tablas de reseñas no están configuradas. Contactá al administrador del restaurante.' 
          };
        }
        
        // Si es error de RLS (permisos)
        if (insertError.message?.includes('row-level security')) {
          return { 
            success: false, 
            message: 'Error de permisos. Verificá la configuración de la base de datos.' 
          };
        }
        
        // Si es otro error de base de datos
        if (insertError.code) {
          return { 
            success: false, 
            message: `Error de base de datos (${insertError.code}). Contactá al administrador.` 
          };
        }
        
        // Error genérico
        return { 
          success: false, 
          message: insertError.message || 'Error al guardar la reseña. Intentá de nuevo.' 
        };
      }

      // Actualizar puntos de fidelización si hay teléfono
      let pointsEarned = 0;
      if (customerPhone) {
        const { data: pointsData, error: pointsError } = await supabase.rpc('update_loyalty_points', {
          p_business_id: businessId,
          p_customer_phone: customerPhone,
          p_customer_name: customerName,
          p_points_to_add: 5
        });

        if (!pointsError && pointsData) {
          pointsEarned = 5;
        }
      }

      // Recargar reseñas
      await fetchReviews();
      await fetchStats();

      return {
        success: true,
        points: pointsEarned,
        message: pointsEarned > 0 
          ? `¡Gracias por tu reseña! Ganaste ${pointsEarned} puntos` 
          : '¡Gracias por tu reseña!'
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar reseña';
      setError(message);
      console.error('[useReviews] Error submitting review:', err);
      return { success: false, message: 'Error al enviar reseña. Intentá de nuevo.' };
    } finally {
      setLoading(false);
    }
  }, [businessId, checkDailyReview, fetchReviews, fetchStats]);

  // Obtener puntos de un cliente
  const getCustomerPoints = useCallback(async (customerPhone: string): Promise<LoyaltyPoints | null> => {
    if (!businessId || !customerPhone) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('business_id', businessId)
        .eq('customer_phone', customerPhone)
        .single();

      if (fetchError) {
        // Si la tabla no existe, retornar null
        if (fetchError.message?.includes('relation') || fetchError.message?.includes('does not exist')) {
          return null;
        }
        throw fetchError;
      }

      return data;
    } catch (err: unknown) {
      console.error('[useReviews] Error getting customer points:', err);
      return null;
    }
  }, [businessId]);

  return {
    loading,
    error,
    reviews,
    stats,
    fetchReviews,
    fetchStats,
    submitReview,
    checkDailyReview,
    getCustomerPoints
  };
}
