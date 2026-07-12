import axios from 'axios';

interface BackendErrorBody {
  detail: string;
}

function isBackendErrorBody(value: unknown): value is BackendErrorBody {
  return typeof value === 'object' && value !== null && typeof (value as { detail?: unknown }).detail === 'string';
}

/** Extrae el mensaje `detail` que devuelven las HTTPException del backend (FastAPI). */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (isBackendErrorBody(data)) {
      return data.detail;
    }
    if (error.message) {
      return error.message;
    }
  }
  return fallback;
}

export function getErrorStatus(error: unknown): number | null {
  if (axios.isAxiosError(error)) {
    return error.response?.status ?? null;
  }
  return null;
}
