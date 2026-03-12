// =============================================
// MINIMENU - Database Types & Enums
// =============================================

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    BUSINESS_ADMIN = 'BUSINESS_ADMIN',
    STAFF = 'STAFF'
}

export enum BusinessStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
    PENDING_PAYMENT = 'PENDING_PAYMENT'
}

export enum Currency {
    COP = 'COP',
    USD = 'USD',
    EUR = 'EUR'
}

export enum BillingType {
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
    ONE_TIME = 'ONE_TIME',
    LIFETIME = 'LIFETIME'
}

export enum ModuleType {
    CORE = 'CORE',
    ADDON = 'ADDON'
}

export enum ModuleStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    DEVELOPMENT = 'DEVELOPMENT'
}

export enum OrderType {
    RESTAURANT = 'RESTAURANT',
    DELIVERY = 'DELIVERY'
}

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PREPARING = 'PREPARING',
    READY = 'READY',
    ON_THE_WAY = 'ON_THE_WAY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    REFUNDED = 'REFUNDED'
}

export enum IntegrationStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE'
}

export enum GatewayType {
    API = 'API',
    MANUAL = 'MANUAL'
}

export enum GatewayMode {
    SANDBOX = 'SANDBOX',
    PRODUCTION = 'PRODUCTION'
}
