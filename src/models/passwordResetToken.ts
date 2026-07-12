export interface PasswordResetToken {
  id: string;
  usuario_id: string;
  token: string;
  expira_en: string;
  usado: boolean;
  created_at: string;
}
