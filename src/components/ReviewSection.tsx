'use client';

import { useState, useEffect } from 'react';
import { useReviews } from '@/hooks/useReviews';
import { Star, Send, User, Phone, MessageSquare } from 'lucide-react';

interface ReviewSectionProps {
  businessId: string;
}

export function ReviewSection({ businessId }: ReviewSectionProps) {
  const {
    loading,
    error,
    reviews,
    stats,
    fetchReviews,
    fetchStats,
    submitReview
  } = useReviews(businessId);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchReviews(5);
    fetchStats();
  }, [fetchReviews, fetchStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || rating === 0) {
      alert('Por favor completá tu nombre y la calificación');
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');

    const result = await submitReview(
      customerName,
      customerPhone || null,
      rating,
      comment || null
    );

    if (result.success) {
      setSuccessMessage(result.message || '¡Gracias por tu reseña!');
      setRating(0);
      setCustomerName('');
      setCustomerPhone('');
      setComment('');
    }

    setSubmitting(false);
  };

  const renderStars = (count: number, interactive = false, size = 'w-6 h-6') => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type={interactive ? 'button' : undefined}
        disabled={!interactive}
        className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        onMouseEnter={() => interactive && setHoverRating(i + 1)}
        onMouseLeave={() => interactive && setHoverRating(0)}
        onClick={() => interactive && setRating(i + 1)}
      >
        <Star
          className={`${size} ${
            (hoverRating || rating) > i
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      </button>
    ));
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      {/* Título */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ¿Qué te pareció nuestro restaurante?
        </h2>
        {stats && (
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <div className="flex items-center">
              {renderStars(Math.round(stats.averageRating), false, 'w-5 h-5')}
            </div>
            <span className="font-semibold">
              {stats.averageRating.toFixed(1)} / 5
            </span>
            <span>({stats.totalReviews} reseñas)</span>
          </div>
        )}
      </div>

      {/* Formulario de Reseña */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Calificación */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tu calificación
            </label>
            <div className="flex justify-center gap-1">
              {renderStars(rating, true)}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu nombre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Juan Pérez"
                required
              />
            </div>
          </div>

          {/* Teléfono (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu teléfono <span className="text-gray-400">(opcional - ganá puntos)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+57 300 123 4567"
              />
            </div>
            {customerPhone && (
              <p className="mt-1 text-xs text-purple-600">
                🎁 ¡Ganá 5 puntos por tu reseña! Acumulá 50 para un descuento
              </p>
            )}
          </div>

          {/* Comentario (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu comentario <span className="text-gray-400">(opcional)</span>
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Contanos tu experiencia..."
                rows={4}
                maxLength={300}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 text-right">
              {comment.length}/300 caracteres
            </p>
          </div>

          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-700 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Botón Enviar */}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {submitting ? 'Enviando...' : 'Enviar Reseña'}
          </button>
        </form>
      </div>

      {/* Lista de Reseñas Recientes */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Cargando reseñas...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Reseñas Recientes</h3>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">
                      {review.customer_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.customer_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {renderStars(review.rating, false, 'w-4 h-4')}
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-700 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            Aún no hay reseñas
          </p>
          <p className="text-sm text-gray-500">
            ¡Sé el primero en dejar tu opinión!
          </p>
        </div>
      )}
    </section>
  );
}
