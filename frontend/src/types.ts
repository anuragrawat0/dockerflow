export interface Document {
  id: number;
  filename: string;
  status: string;
  progress: number;
  result: Record<string, any> | null;
  error_message: string | null;
  created_at: string;
}