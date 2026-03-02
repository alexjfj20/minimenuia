# MINIMENU - Work Log

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
