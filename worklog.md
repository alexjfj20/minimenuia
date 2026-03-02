# MINIMENU - Work Log

---
Task ID: 8
Agent: Main Agent
Task: Implementar Kanban de 3 columnas simultáneas para Gestión de Pedidos

Work Log:
- Agregué interfaz UnifiedOrder para unificar pedidos de restaurante y domicilio
- Agregué funciones auxiliares: getTimerColor, getTimerBackground, shouldShowTimer
- Creé componente OrderCard para mostrar tarjetas en el Kanban
- Implementé 3 columnas simultáneas:
  - TODOS: Muestra todos los pedidos (solo visible en desktop lg)
  - RESTAURANTE: Pedidos en restaurante (verde)
  - DOMICILIO: Pedidos a domicilio (naranja)
- Cada columna tiene:
  - Header con indicador de color y contador
  - Scroll independiente
  - Tarjetas con diseño diferenciado por tipo
- Implementé temporizador en cada tarjeta:
  - Formato: "⏱ X min"
  - Colores: verde (0-10 min), amarillo (11-20 min), rojo (+20 min)
  - Animación pulse para pedidos urgentes (+20 min)
  - Solo visible para pedidos pendientes/preparando
- Implementé sonido y notificaciones:
  - playNotificationSound() usando Web Audio API
  - Notificaciones toast en esquina superior derecha
  - Colores naranja (restaurante) y azul (domicilio)
  - Auto-eliminación después de 5 segundos
- Implementé responsive móvil:
  - MÓVIL (<768px): 1 columna con botones selector
  - TABLET (768px-1024px): 2 columnas (Restaurante + Domicilio)
  - DESKTOP (>1024px): 3 columnas completas
- Agregué estados: mobileOrderColumn, orderTimers, notifications, previousOrderCount

Stage Summary:
- ✅ 3 columnas simultáneas implementadas
- ✅ Temporizador con colores de urgencia
- ✅ Sonido y notificaciones visuales
- ✅ Responsive móvil completo
- ✅ Lint pasa sin errores
- ✅ Build exitoso

---
Task ID: 1
Agent: Main Agent
Task: Implementar Propina Voluntaria SaaS Multi-Tenant

Work Log:
- Actualizado API de perfil (`/api/settings/profile/route.ts`) con campos de configuración de propina:
  - `tipEnabled`: boolean (activar/desactivar propina)
  - `tipPercentageDefault`: number (porcentaje sugerido, default 10%)
  - `tipOnlyOnPremise`: boolean (solo aplicar en establecimiento)
- Actualizado BusinessAdminPanel.tsx con nueva sección "Propina Voluntaria" en Mi Perfil:
  - Switch para activar/desactivar
  - Input numérico para porcentaje sugerido
  - Botones rápidos (5%, 10%, 15%, 20%)
  - Switch para "Solo en Establecimiento"
  - Info legal sobre normativa Colombia
- Actualizado menú público (`/menu/[slug]/page.tsx`):
  - Interfaz RestaurantInfo con campos de propina
  - Estado de propina (tipApplied, tipPercentage, tipCustomValue)
  - Cálculo dinámico de propina
  - Componente TipSelector con:
    - Botón para agregar/activar propina
    - Botones de porcentaje predefinido
    - Input para valor personalizado
    - Info sobre voluntariedad
  - Actualización de mensajes WhatsApp con propina
- Actualizado API del menú (`/api/menu/[slug]/route.ts`) para incluir campos de propina
- Lógica de negocio implementada:
  - Solo aplica si `tipEnabled === true`
  - Si `tipOnlyOnPremise === true`, solo para pedidos en restaurante
  - Reset automático de propina al cambiar modo de pedido
  - Cálculo: `subtotal * (tipPercentage / 100)` o valor personalizado

Stage Summary:
- Funcionalidad de Propina Voluntaria completamente implementada
- Cumple con normativa Colombia (voluntaria, no genera IVA, no es ingreso gravado)
- Configuración por restaurante (multi-tenant)
- Integrada en panel de administración y menú público
- Mensajes de WhatsApp actualizados para incluir propina
- Lint pasa sin errores
