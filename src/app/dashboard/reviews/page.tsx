'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Star, Users, TrendingUp, Calendar, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface LoyaltyCustomer {
  id: string;
  business_id: string;
  customer_phone: string;
  customer_name: string | null;
  points: number;
  total_orders: number;
  last_visit: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export default function ReviewsDashboard() {
  const searchParams = useSearchParams();
  const businessIdFromUrl = searchParams?.get('businessId');
  
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loyaltyCustomers, setLoyaltyCustomers] = useState<LoyaltyCustomer[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Usar businessId de la URL
  useEffect(() => {
    if (businessIdFromUrl) {
      setBusinessId(businessIdFromUrl);
    }
  }, [businessIdFromUrl]);

  // Cargar reseñas
  const loadReviews = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);

    try {
      // Cargar reseñas
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (reviewsError) throw reviewsError;

      setReviews(reviewsData || []);

      // Calcular estadísticas
      const total = reviewsData?.length || 0;
      const avg = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 0;

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviewsData?.forEach(r => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      });

      setStats({
        averageRating: avg,
        totalReviews: total,
        ratingDistribution: distribution
      });

      // Cargar clientes de fidelización
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('business_id', businessId)
        .order('points', { ascending: false })
        .limit(50);

      if (loyaltyError) throw loyaltyError;

      setLoyaltyCustomers(loyaltyData || []);
    } catch (error: unknown) {
      console.error('[ReviewsDashboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const renderStars = (rating: number, size = 'w-5 h-5') => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-200 text-gray-200'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600">
          <p>No se encontró el negocio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reseñas y Fidelización</h1>
        <p className="text-gray-600 mt-1">Gestioná las reseñas y puntos de tus clientes</p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Promedio */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageRating.toFixed(1)} / 5
                  </p>
                </div>
              </div>
            </div>
            <div className="flex">
              {renderStars(Math.round(stats.averageRating), 'w-4 h-4')}
            </div>
          </div>

          {/* Total Reseñas */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Reseñas</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clientes Fidelizados */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Clientes Frecuentes</p>
                  <p className="text-3xl font-bold text-gray-900">{loyaltyCustomers.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribución de Calificaciones */}
      {stats && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Calificaciones
          </h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0
                ? (count / stats.totalReviews) * 100
                : 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-yellow-400 h-3 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de Reseñas */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reseñas Recientes</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {reviews.map(review => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">
                        {review.customer_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{review.customer_name}</p>
                      {review.customer_phone && (
                        <p className="text-xs text-gray-500">{review.customer_phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating, 'w-4 h-4')}
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aún no hay reseñas</p>
          </div>
        )}
      </div>

      {/* Clientes Frecuentes */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Clientes Frecuentes
        </h2>
        {loyaltyCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Teléfono
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Puntos
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Visitas
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Última Visita
                  </th>
                </tr>
              </thead>
              <tbody>
                {loyaltyCustomers.map(customer => (
                  <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold text-xs">
                            {customer.customer_name?.charAt(0).toUpperCase() || 'C'}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {customer.customer_name || 'Anónimo'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {customer.customer_phone}
                    </td>
                    <td className="text-center py-3 px-4">
                      <Badge points={customer.points} />
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-sm text-gray-700">{customer.total_orders}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-sm text-gray-500">
                        {new Date(customer.last_visit).toLocaleDateString('es-CO')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aún no hay clientes frecuentes</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente Badge para puntos
function Badge({ points }: { points: number }) {
  let colorClass = 'bg-gray-100 text-gray-800';
  
  if (points >= 50) {
    colorClass = 'bg-yellow-100 text-yellow-800';
  } else if (points >= 20) {
    colorClass = 'bg-purple-100 text-purple-800';
  } else if (points >= 10) {
    colorClass = 'bg-green-100 text-green-800';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      <Star className="w-3 h-3 mr-1 fill-current" />
      {points} pts
    </span>
  );
}
