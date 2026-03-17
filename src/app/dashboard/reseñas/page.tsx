'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Star, Users, TrendingUp, MessageSquare } from 'lucide-react';

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

// Componente principal con Suspense
export default function ReviewsDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Cargando reseñas...</p>
        </div>
      </div>
    }>
      <ReviewsContent />
    </Suspense>
  );
}

// Componente separado para el contenido
function ReviewsContent() {
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalReviews}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">Últimos 50</p>
          </div>

          {/* 5 Estrellas */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">5 Estrellas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.ratingDistribution[5] || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex">
              {renderStars(5, 'w-4 h-4')}
            </div>
          </div>
        </div>
      )}

      {/* Lista de Reseñas */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Reseñas de Clientes</h2>
          <Badge variant="outline" className="text-sm">
            {reviews.length} reseñas
          </Badge>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aún no hay reseñas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-200 pb-4 last:border-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.customer_name || review.customer_phone || 'Anónimo'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating, 'w-4 h-4')}
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clientes Frecuentes */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Clientes Frecuentes</h2>
          <Badge variant="outline" className="text-sm">
            {loyaltyCustomers.length} clientes
          </Badge>
        </div>

        {loyaltyCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aún no hay clientes frecuentes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Puntos
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Pedidos
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Última Visita
                  </th>
                </tr>
              </thead>
              <tbody>
                {loyaltyCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {customer.customer_name || customer.customer_phone}
                        </p>
                        <p className="text-sm text-gray-500">
                          {customer.customer_phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge points={customer.points} />
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {customer.total_orders}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(customer.last_visit).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
