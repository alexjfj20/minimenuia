// Este archivo se inserta después del Module Service y antes del Plan Service
// Para agregar el Integration Service

export const integrationService = {
  async getAll(): Promise<ApiResponse<any[]>> {
    try {
      console.log('[Integration Service] Fetching integrations from API...');

      const response = await fetch('/api/superadmin/integrations');
      const result = await response.json() as { success: boolean; data: any[] | null; error: string | null };

      if (!result.success) {
        console.error('[Integration Service] Error fetching:', result.error);
        return { success: false, data: null, error: result.error ?? 'Error desconocido', message: null };
      }

      return { success: true, data: result.data ?? [], error: null, message: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Integration Service] Exception:', message);
      return { success: false, data: null, error: message, message: null };
    }
  },
};
