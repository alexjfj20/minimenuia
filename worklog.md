# MINIMENU - Work Log

---
Task ID: 17
Agent: Main Agent
Task: Mostrar imagen de avatar del usuario en el menú lateral inferior en lugar de la letra inicial

Work Log:
- Ubicación del cambio: Sección "User Info" en el sidebar (línea 5052)
- Cambio realizado:
  - Antes: Mostraba un círculo morado con la letra inicial del nombre del usuario
  - Ahora: Muestra la imagen de avatar (`profileForm.avatar`) si existe
  - Fallback: Si no hay avatar, muestra la letra inicial como antes

- Código modificado:
  ```tsx
  {profileForm.avatar ? (
    <img 
      src={profileForm.avatar} 
      alt="Avatar" 
      className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
    />
  ) : (
    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
      {(user.name ?? 'U').charAt(0).toUpperCase()}
    </div>
  )}
  ```

Archivo modificado:
- `src/components/minimenu/BusinessAdminPanel.tsx` (líneas 5055-5064)

Stage Summary:
- ✅ Avatar del usuario se muestra en el menú lateral
- ✅ Fallback a letra inicial si no hay avatar
- ✅ Imagen circular con borde morado
- ✅ Lint pasa sin errores (solo 3 warnings)

---
Task ID: 16
Agent: Main Agent
Task: Implementar gestión profesional de Factura Restaurante (selección múltiple, eliminación masiva, filtros, paginación, exportación)

Work Log:
- Funcionalidades implementadas en "Facturas Creadas":

  1️⃣ **Selección Múltiple de Facturas**
     - Columna checkbox al inicio de la tabla
     - Checkbox en header para seleccionar todas
     - Contador de facturas seleccionadas
     - Fondo morado para filas seleccionadas

  2️⃣ **Eliminación Masiva**
     - Botón "Eliminar Seleccionadas" (visible solo con selección)
     - Modal de confirmación con contador
     - API `/api/restaurant-invoice/bulk-delete` (POST)
     - Elimina de memoria y base de datos

  3️⃣ **Filtro por Rango de Fechas**
     - Inputs de fecha "Desde" y "Hasta"
     - Botón "Limpiar" para resetear filtros
     - Contador de facturas encontradas

  4️⃣ **Paginación Server-Side**
     - 20 facturas por página
     - Navegación Anterior/Siguiente
     - Indicador "Mostrando X - Y de Z facturas"
     - Página 1 de N

  5️⃣ **Botón Eliminar Individual**
     - Icono de papelera rojo en columna Acciones
     - Confirmación antes de eliminar
     - Elimina de memoria y base de datos

  6️⃣ **Toast Notifications**
     - Verde: éxito (✔)
     - Amarillo: advertencia (⚠)
     - Rojo: error (❌)
     - Auto-desaparición 4 segundos

  7️⃣ **Exportar CSV**
     - Botón verde "Exportar CSV"
     - Incluye: Factura, Cliente, Teléfono, Items, Subtotal, Impuesto, Total, Método Pago, Estado, Fecha
     - Descarga automática

  8️⃣ **Badge "Carrito"**
     - Identifica facturas provenientes del carrito de compras
     - Badge azul "Carrito" en columna Factura

- Nuevos estados agregados:
  - selectedInvoiceIds (Set<string>)
  - invoicePage, invoicePageSize
  - invoiceDateFrom, invoiceDateTo
  - showBulkDeleteConfirm, isDeletingInvoices
  - invoiceToast

- Nuevas funciones agregadas:
  - toggleInvoiceSelection, toggleAllInvoices
  - getFilteredInvoices, getPaginatedInvoices
  - getTotalInvoicePages, clearInvoiceFilters
  - showInvoiceToastMessage
  - deleteSingleInvoice, bulkDeleteInvoices
  - exportInvoicesToCSV

Archivos creados/modificados:
- `src/components/minimenu/BusinessAdminPanel.tsx` (estados, funciones, UI tabla)
- `src/app/api/restaurant-invoice/bulk-delete/route.ts` (nuevo archivo)

Stage Summary:
- ✅ Selección múltiple con checkboxes
- ✅ Eliminación masiva con confirmación
- ✅ Filtro por rango de fechas
- ✅ Paginación para grandes volúmenes
- ✅ Botón eliminar individual en Acciones
- ✅ Toast notifications profesionales
- ✅ Exportación a CSV
- ✅ Lint pasa sin errores (solo 3 warnings)

---
Task ID: 15
Agent: Main Agent
Task: Mostrar pedidos RESTAURANTE del carrito en página "Factura Restaurante" → "Facturas Creadas"

Work Log:
- Diagnóstico del problema:
  - La API `/api/restaurant-invoice` usaba almacenamiento en memoria (no persistía)
  - Los pedidos RESTAURANTE se guardan en la base de datos con Prisma
  - Las facturas del TPV y los pedidos del carrito no estaban integrados

- Cambios realizados:

  1. **API `/api/restaurant-invoice/route.ts`** - Modificada para consultar la base de datos:
     - GET ahora recibe parámetro `businessId` en query string
     - Consulta pedidos RESTAURANTE de la tabla `orders` con Prisma
     - Convierte los pedidos a formato de factura
     - Combina facturas del TPV (memoria) con pedidos del carrito (BD)
     - Agregado campo `source: 'tpv' | 'cart'` para identificar origen
     - DELETE ahora también elimina de la base de datos si existe

  2. **Componente `BusinessAdminPanel.tsx`**:
     - Interfaz `RestaurantInvoice`: agregado campo `source?: 'tpv' | 'cart'`
     - Función `loadInvoices`: modificada para pasar `businessId` en la URL
     - Agregado `[profileId]` como dependencia del useCallback
     - Mejorado parseo de número de factura (maneja FAC- y ORD-)

- Estructura de datos unificada:
  ```typescript
  interface RestaurantInvoice {
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerPhone?: string;
    items: Array<{ productId, name, price, quantity }>;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'transfer';
    status: 'paid' | 'pending' | 'cancelled';
    createdAt: string;
    notes?: string;
    source?: 'tpv' | 'cart'; // Nuevo: identifica origen
  }
  ```

Archivos modificados:
- `src/app/api/restaurant-invoice/route.ts` (GET con businessId, integración BD)
- `src/components/minimenu/BusinessAdminPanel.tsx` (interfaz, loadInvoices)

Stage Summary:
- ✅ Pedidos RESTAURANTE del carrito aparecen en "Factura Restaurante" → "Facturas Creadas"
- ✅ Pedidos también aparecen en "Gestión de Pedidos" → columna RESTAURANTE
- ✅ API combina facturas TPV + pedidos del carrito
- ✅ Campo `source` identifica origen (tpv o cart)
- ✅ Lint pasa sin errores (solo 3 warnings de directivas)

---
Task ID: 14
Agent: Main Agent
Task: Corregir envío de pedidos RESTAURANTE a Gestión de Pedidos y actualizar mensaje WhatsApp

Work Log:
- Diagnóstico del problema:
  - `handleRestaurantOrder` solo abría WhatsApp y NO guardaba en la base de datos
  - `handleDeliveryOrder` sí guardaba correctamente
  - Los pedidos RESTAURANTE no aparecían en la columna RESTAURANTE de Gestión de Pedidos

- Cambios realizados en `/app/menu/[slug]/page.tsx`:
  1. Modificada función `handleRestaurantOrder` de síncrona a asíncrona
  2. Agregada validación de campos obligatorios (Nombre y Celular)
  3. Agregado guardado en BD con `orderType: 'RESTAURANT'` ANTES de enviar WhatsApp
  4. Actualizado mensaje de WhatsApp para incluir:
     - Sección "DATOS DEL CLIENTE" con Nombre y Celular
     - Campo "Para:" cuando se especifica para quién es el pedido
     - Formato mejorado con separadores visuales

- Estructura del mensaje WhatsApp actualizado:
  ```
  🍽️ *PEDIDO EN RESTAURANTE*

  👤 *DATOS DEL CLIENTE*
  Nombre: [nombre]
  Celular: [celular]
  🍽️ *Para:* [nombre] (opcional)
  ━━━━━━━━━━━━━━━━━━

  [items del pedido]

  ━━━━━━━━━━━━━━━━━━
  Subtotal: $X
  Impoconsumo (8%): $X
  Propina Voluntaria: $X (si aplica)
  ━━━━━━━━━━━━━━━━━━
  *TOTAL: $X*

  💳 *Método de Pago:* [método]
  ¡Gracias por su pedido!
  ```

Archivos modificados:
- `src/app/menu/[slug]/page.tsx` (handleRestaurantOrder: líneas 402-501)

Stage Summary:
- ✅ Pedidos RESTAURANTE ahora se guardan en la base de datos
- ✅ Pedidos aparecen en la columna RESTAURANTE de Gestión de Pedidos
- ✅ Mensaje de WhatsApp incluye Nombre, Celular, Para quién es el pedido
- ✅ Validación de campos obligatorios antes de enviar
- ✅ Lint pasa sin errores (solo 3 warnings de directivas no usadas)

---
Task ID: 13
Agent: Main Agent
Task: Sincronizar pedidos de domicilio del carrito "Tu pedido" con "Facturación Domicilio" y "Gestión de Pedidos"

Work Log:
- Análisis del flujo de datos:
  - El carrito "Tu pedido" (`/menu/[slug]/page.tsx`) solo enviaba pedidos por WhatsApp
  - NO guardaba los pedidos en la base de datos
  - Las páginas "Facturación Domicilio" y "Gestión de Pedidos" usaban datos mock
  
- Problema crítico encontrado: Foreign key constraint violated
  - El businessId "business-1" no existía en la tabla `businesses`
  - Los pedidos no podían guardarse por la foreign key
  
- Cambios realizados:
  1. **Modificado `/app/menu/[slug]/page.tsx` (handleDeliveryOrder)**:
     - Agregado guardado en BD ANTES de enviar WhatsApp
     - Genera número de factura único: `DOM-YYYYMMDD-XXXXXX`
     - Calcula tiempo estimado de entrega (45 min)
     - Envía todos los datos: customerName, phone, address, items, total, paymentMethod, etc.
  
  2. **Modificado `/components/minimenu/BusinessAdminPanel.tsx`**:
     - Agregados estados: `dbRestaurantOrders`, `dbDeliveryOrders`, `isLoadingOrders`
     - Agregada función `loadAllOrdersFromDatabase()` para cargar pedidos desde BD
     - Modificada función `getAllUnifiedOrders()` para usar datos de BD (con fallback a mock)
     - Agregado useEffect para cargar pedidos al navegar a tab 'pedidos'
     - Modificada `loadDeliveryInvoices()` para usar businessId dinámico (`profileId ?? 'business-1'`)
  
  3. **Modificado `/prisma/seed.ts`**:
     - Agregada creación del negocio por defecto `business-1`
     - Negocio: "Restaurante El Sabor" con slug `restaurant-user-admin-1`
     - Asignado al plan "Profesional"
     - Dueño: Super Admin (auditsemseo@gmail.com)
  
  4. **Ejecutado seed**:
     - Negocio creado exitosamente en la base de datos
     - Foreign key constraint resuelto

Archivos modificados:
- `src/app/menu/[slug]/page.tsx` (handleDeliveryOrder async, guarda en BD)
- `src/components/minimenu/BusinessAdminPanel.tsx` (nuevos estados, funciones de carga, useEffect)
- `prisma/seed.ts` (creación del negocio business-1)

Stage Summary:
- ✅ Pedidos de domicilio se guardan en BD al hacer clic en "Pedir Domicilio"
- ✅ Pedidos aparecen en "Facturación Domicilio" → "Ver Factura"
- ✅ Pedidos aparecen en "Gestión de Pedidos"
- ✅ Negocio business-1 creado en base de datos
- ✅ Foreign key constraint resuelto
- ✅ Lint pasa sin errores

---
Task ID: 12
Agent: Main Agent
Task: Agregar campo Favicon (Icono de Favoritos) en sección Imágenes del Negocio

Work Log:
- Análisis de la sección "Imágenes del Negocio" en el panel de perfil:
  - Ya existen: Franja Hero Sutil, Avatar, Logo, Banner
  - Faltaba: Favicon (icono pequeño para la pestaña del navegador)
- Cambios realizados:
  1. Interfaz BusinessProfile (`business-store.ts`):
     - Agregado campo `favicon?: string | null`
     - Agregado valor por defecto `favicon: null` en DEFAULT_PROFILE
  2. Estado profileForm (`BusinessAdminPanel.tsx` línea 621):
     - Agregado `favicon: null as string | null`
  3. Función loadProfile (líneas 764, 806, 879):
     - Agregado `favicon` en carga desde localStorage
     - Agregado `favicon` en carga desde server
     - Agregado `favicon` en valores por defecto
  4. Función handleSaveProfile (línea 4058):
     - Agregado `favicon: profileForm.favicon` en el body del PUT
  5. API Profile (`/api/settings/profile/route.ts`):
     - Agregado `favicon?: string | null` en UpdateProfileRequest
     - Agregado manejo en PUT: `...(body.favicon !== undefined && { favicon: body.favicon })`
  6. UI en sección Imágenes del Negocio (línea 6832+):
     - Label: "Favicon (Icono de Favoritos)"
     - Descripción: "Imagen cuadrada pequeña para la pestaña del navegador (32x32px recomendado)"
     - Preview de imagen (16x16 px)
     - Input para subir imagen
     - Botón para eliminar imagen
     - Nota: "PNG, ICO (máx. 500KB)"

Archivos modificados:
- `src/lib/business-store.ts` (líneas 91-92)
- `src/components/minimenu/BusinessAdminPanel.tsx` (múltiples líneas)
- `src/app/api/settings/profile/route.ts` (líneas 44, 106-107)

Stage Summary:
- ✅ Campo Favicon agregado a interfaz BusinessProfile
- ✅ Campo Favicon agregado al estado profileForm
- ✅ Campo Favicon cargado y guardado correctamente
- ✅ UI para subir/mostrar favicon en sección Imágenes del Negocio
- ✅ Lint pasa sin errores

---
Task ID: 11
Agent: Main Agent
Task: Agregar scroll a la ventana de Editar Producto del catálogo

Work Log:
- Análisis del modal de producto (línea 7556)
- El modal no tenía límite de altura ni scroll
- Cambios realizados:
  - Agregado `max-w-lg` al DialogContent para mayor ancho
  - Agregado `max-h-[60vh]` al contenedor del contenido
  - Agregado `overflow-y-auto` para habilitar scroll vertical
  - Agregado `pr-2` para padding derecho y evitar que el scroll corte el contenido

Archivo modificado:
- `src/components/minimenu/BusinessAdminPanel.tsx` (línea 7561-7565)

Stage Summary:
- ✅ Modal con scroll vertical funcional
- ✅ Altura máxima del 60% del viewport
- ✅ Mayor ancho del modal (max-w-lg)
- ✅ Lint pasa sin errores

---
Task ID: 10
Agent: Main Agent
Task: Agregar campo de ofertas en la ventana de Editar Producto del catálogo

Work Log:
- Análisis del código existente:
  - Interfaz Product en BusinessAdminPanel.tsx (línea 129)
  - Estado productForm (línea 544)
  - Función resetProductForm (línea 1398)
  - Función openEditProduct (línea 1354)
  - Función handleSaveProduct (línea 1306)
  - Modal de producto (línea 7531)
- Campos de oferta agregados a la interfaz Product:
  - `onSale`: boolean (activar/desactivar oferta)
  - `salePrice`: number (precio de oferta)
  - `saleStartDate`: string (fecha inicio, opcional)
  - `saleEndDate`: string (fecha fin, opcional)
- UI de ofertas implementada en el modal:
  - Switch con gradiente naranja/ámbar para activar oferta
  - Precio original tachado + input para precio de oferta
  - Cálculo automático del descuento (% y monto)
  - Campos de fecha inicio y fin (opcionales)
  - Nota informativa sobre vigencia
- API de productos actualizada:
  - Interfaz Product con campos de oferta
  - CreateProductRequest y UpdateProductRequest actualizados
  - Funciones POST y PUT manejan los nuevos campos
- Menú público actualizado:
  - Interfaz MenuItem con campos de oferta
  - Función isOfferActive() verifica fechas de vigencia
  - Badge animado "-X% OFERTA"
  - Precio original tachado + precio de oferta
  - Borde naranja en tarjetas con oferta activa
  - Botón "Agregar" cambia a color naranja

Archivos modificados:
- `src/components/minimenu/BusinessAdminPanel.tsx`
- `src/app/api/products/route.ts`
- `src/app/api/menu/[slug]/route.ts`
- `src/app/menu/[slug]/page.tsx`

Stage Summary:
- ✅ Campo de ofertas en modal Editar Producto
- ✅ Switch activar/desactivar oferta
- ✅ Precio de oferta con cálculo de descuento
- ✅ Fechas de vigencia opcionales
- ✅ Visualización en menú público
- ✅ Badge animado de oferta
- ✅ Lint pasa sin errores

---
Task ID: 9
Agent: Main Agent
Task: Fix Franja Hero Sutil no se muestra en el menú público

Work Log:
- Identifiqué el problema: `showHeroBanner` estaba en `false` en los datos guardados aunque había una imagen hero
- Análisis del flujo de datos:
  - La interfaz BusinessProfile tiene `heroImageUrl` y `showHeroBanner`
  - El API `/api/settings/profile` guarda ambos campos correctamente
  - El menú público (`/menu/[slug]/page.tsx`) ya tiene el código para mostrar la franja hero
  - La condición de renderizado es: `{restaurant.showHeroBanner && restaurant.heroImageUrl && ...}`
- Problema raíz: El usuario subió la imagen pero `showHeroBanner` quedó en `false`
- Solución implementada:
  1. Modifiqué el upload handler para auto-guardar con `showHeroBanner: true`
  2. Modifiqué el switch handler para auto-guardar cuando se cambia
  3. Corregí manualmente los datos guardados (`showHeroBanner: true`)
- Archivos modificados:
  - `src/components/minimenu/BusinessAdminPanel.tsx`: Auto-save en upload y switch
  - `db/business_profile.json`: Actualizado `showHeroBanner: true`

Stage Summary:
- ✅ Franja Hero Sutil ahora se muestra en el menú público
- ✅ Auto-save al subir imagen hero (activa automáticamente)
- ✅ Auto-save al cambiar el switch
- ✅ Datos corregidos: `showHeroBanner: true`, `heroImageUrl: SET`
- ✅ Lint pasa sin errores

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
