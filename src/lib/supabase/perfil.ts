import { supabase } from '../supabaseClient';
import type { 
  AdminProfile, 
  UpdateProfilePayload, 
  NotificationSettings, 
  UpdateNotificationsPayload, 
  UpdatePasswordPayload, 
  UpdateResult,
  SessionInfo
} from '@/types/perfil';

export async function getAdminProfile(): Promise<AdminProfile | null> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return null;

    const { data: profileData, error: profileError } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (profileError || !profileData) return null;

    return {
      id: profileData.id,
      fullName: profileData.full_name,
      displayName: profileData.display_name,
      email: userData.user.email || '',
      phone: profileData.phone || '',
      avatarUrl: profileData.avatar_url || '',
      bio: profileData.bio || '',
      companyName: profileData.company_name || '',
      companyWebsite: profileData.company_website || '',
      timezone: profileData.timezone || '',
      language: profileData.language || '',
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at
    };
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return null;
  }
}

export async function updateAdminProfile(payload: UpdateProfilePayload): Promise<UpdateResult> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('admin_profiles')
      .update({
        full_name: payload.fullName,
        display_name: payload.displayName,
        phone: payload.phone,
        bio: payload.bio,
        company_name: payload.companyName,
        company_website: payload.companyWebsite,
        timezone: payload.timezone,
        language: payload.language
      })
      .eq('id', userData.user.id);

    if (error) return { success: false, error: (error instanceof Error ? error.message : "Error") };
    return { success: true, error: null };
  } catch (error: unknown) {
    return { success: false, error: (error instanceof Error ? error.message : "Error") || 'Error al actualizar perfil' };
  }
}

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;

    const { data, error } = await supabase
      .from('admin_profiles')
      .select('email_notifications, system_alerts, new_business_alerts, payment_alerts')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      emailNotifications: data.email_notifications,
      systemAlerts: data.system_alerts,
      newBusinessAlerts: data.new_business_alerts,
      paymentAlerts: data.payment_alerts
    };
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return null;
  }
}

export async function updateNotificationSettings(payload: UpdateNotificationsPayload): Promise<UpdateResult> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('admin_profiles')
      .update({
        email_notifications: payload.emailNotifications,
        system_alerts: payload.systemAlerts,
        new_business_alerts: payload.newBusinessAlerts,
        payment_alerts: payload.paymentAlerts
      })
      .eq('id', userData.user.id);

    if (error) return { success: false, error: (error instanceof Error ? error.message : "Error") };
    return { success: true, error: null };
  } catch (error: unknown) {
    return { success: false, error: (error instanceof Error ? error.message : "Error") || 'Error al actualizar notificaciones' };
  }
}

export async function uploadAvatar(file: File): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { url: null, error: 'No autorizado' };

    const fileExt = file.name.split('.').pop();
    const fileName = `admin-${userData.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) return { url: null, error: uploadError.message };

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) return { url: null, error: 'Error al obtener URL pública' };

    const { error: updateError } = await supabase
      .from('admin_profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', userData.user.id);

    if (updateError) return { url: null, error: updateError.message };

    return { url: data.publicUrl, error: null };
  } catch (error: unknown) {
    return { url: null, error: (error instanceof Error ? error.message : "Error") || 'Error al subir avatar' };
  }
}

export async function updatePassword(payload: UpdatePasswordPayload): Promise<UpdateResult> {
  try {
    if (payload.newPassword !== payload.confirmPassword) {
      return { success: false, error: 'Las contraseñas no coinciden' };
    }

    const { error } = await supabase.auth.updateUser({
      password: payload.newPassword
    });

    if (error) return { success: false, error: (error instanceof Error ? error.message : "Error") };
    return { success: true, error: null };
  } catch (error: unknown) {
    return { success: false, error: (error instanceof Error ? error.message : "Error") || 'Error al actualizar contraseña' };
  }
}

export async function getActiveSessions(): Promise<SessionInfo[]> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return [];

    // Supabase auth.getSession() only returns current session
    // Formatting it as requested for the UI
    return [{
      id: session.access_token.substring(0, 10),
      device: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Windows') ? 'Web — Windows' : 'Web — Browser') : 'Web',
      location: 'Desconocido',
      lastActive: new Date().toISOString(),
      isCurrent: true
    }];
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

