
/**
 * Type definitions for component status
 */
export interface ComponentStatus {
  name: string;
  status: 'ok' | 'error';
  message?: string;
}
