
/**
 * Represents the status of a component in the conversion process
 */
export interface ComponentStatus {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message?: string;
}
