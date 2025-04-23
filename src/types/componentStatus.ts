
/**
 * Type definitions for component status
 */
export interface ComponentStatus {
  name: string;
  status: 'ok' | 'error' | 'warning';
  message?: string;
}
