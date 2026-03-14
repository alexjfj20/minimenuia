'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function ChatbotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true); // Default enabled
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '¡Hola! Soy tu asistente virtual de MINIMENU. ¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Don't show on public menu pages
  const isPublicMenu = pathname?.startsWith('/menu/');

  // Load chatbot configuration on mount
  useEffect(() => {
    // Don't load if on public menu page
    if (isPublicMenu) {
      setIsLoading(false);
      return;
    }

    const loadConfig = async () => {
      try {
        const response = await fetch('/api/ai/config');
        const data = await response.json();
        if (data.success && data.data) {
          setIsEnabled(data.data.enabled ?? true);
        } else {
          // Fallback: enable by default if API fails
          setIsEnabled(true);
        }
      } catch (error) {
        console.error('[Chatbot] Error loading config:', error);
        // Fallback: enable by default if API fails
        setIsEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [isPublicMenu]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsSending(true);

    try {
      // Construir historial de conversación (últimos 10 mensajes)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      }));

      // Llamar al endpoint de IA que respeta el orden de fuentes
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          conversationHistory
        })
      });

      const data = await response.json();

      if (data.success && data.data?.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.data.response,
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        console.log('[Chatbot] Response source:', data.data.source);
      } else {
        // Fallback a respuestas locales si la API falla
        const fallbackResponse = generateFallbackResponse(userInput.toLowerCase());
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: fallbackResponse,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('[Chatbot] Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, tuve un problema técnico. Por favor intenta nuevamente en unos momentos. 😊',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Fallback response si la API de IA no está disponible
  const generateFallbackResponse = (userInput: string) => {
    if (userInput.includes('plan') || userInput.includes('precio') || userInput.includes('costo')) {
      return '¡Claro! Te cuento sobre nuestros planes:\n\n🆓 **Plan GRATIS** - $0 COP/mes\n• 1 Usuario\n• Hasta 50 productos\n• Hasta 5 categorías\n\n💜 **Plan BÁSICO** - $29.000 COP/mes\n• 3 Usuarios\n• Hasta 200 productos\n\n⭐ **Plan PROFESIONAL** - $59.000 COP/mes\n• 10 Usuarios\n• Productos ilimitados\n\n¿Te gustaría saber más?';
    } else if (userInput.includes('hola') || userInput.includes('buenas')) {
      return '¡Hola! 👋 Soy tu asistente virtual de MINIMENU. ¿En qué puedo ayudarte?';
    } else if (userInput.includes('gracias')) {
      return '¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?';
    } else {
      return 'Gracias por tu mensaje. 😊 Para darte una mejor respuesta, asegúrate de tener configurada la API de Gemini en el panel de Super Admin → Chatbot IA.\n\nMientras tanto, puedo ayudarte con:\n• **Planes**: "¿Qué planes tienen?"\n• **Precios**: "¿Cuánto cuesta?"\n• **Registro**: "¿Cómo me registro?"';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper function to render markdown-like formatting
  const renderMessageContent = (content: string) => {
    // Split by lines
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      
      return (
        <div key={index} className="min-h-[1.25rem]">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </div>
      );
    });
  };

  // Don't render if on public menu, not enabled, or still loading
  if (isPublicMenu || !isEnabled || isLoading) {
    return null;
  }

  return (
    <>
      {/* Chatbot Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-all duration-300",
          isOpen
            ? "bg-red-600 hover:bg-red-700"
            : "bg-purple-600 hover:bg-purple-700"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] flex flex-col shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header - Fixed Height */}
          <div className="bg-purple-600 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">Asistente Virtual MINIMENU</h3>
                <p className="text-xs text-purple-200">En línea</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-purple-700 w-8 h-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages - Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.isUser
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.isUser 
                        ? message.content 
                        : renderMessageContent(message.content)
                      }
                    </div>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input - Fixed at Bottom */}
          <div className="border-t p-4 flex-shrink-0 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1"
                disabled={isSending}
              />
              <Button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                size="icon"
                className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
