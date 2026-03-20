export interface AdminProfile {
  id: string;
  fullName: string;
  displayName: string;
  email: string;           // de auth.users (solo lectura)
  phone: string;
  avatarUrl: string;
  bio: string;
  companyName: string;
  companyWebsite: string;
  timezone: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  systemAlerts: boolean;
  newBusinessAlerts: boolean;
  paymentAlerts: boolean;
}

export interface UpdateProfilePayload {
  fullName: string;
  displayName: string;
  phone: string;
  bio: string;
  companyName: string;
  companyWebsite: string;
  timezone: string;
  language: string;
}

export interface UpdateNotificationsPayload {
  emailNotifications: boolean;
  systemAlerts: boolean;
  newBusinessAlerts: boolean;
  paymentAlerts: boolean;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileApiResponse {
  profile: AdminProfile | null;
  notifications: NotificationSettings | null;
  error: string | null;
}

export interface UpdateResult {
  success: boolean;
  error: string | null;
}

export type ProfileTab =
  | 'informacion'
  | 'seguridad'
  | 'notificaciones'
  | 'sesiones';

export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}
