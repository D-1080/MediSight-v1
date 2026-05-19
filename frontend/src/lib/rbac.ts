/**
 * MediSight — Role-Based Access Control
 * Single source of truth for what each role can do.
 */

export type UserRole = 'ADMIN' | 'DOCTOR' | 'ANALYST' | 'PATIENT';

export const PERMISSIONS = {
  VIEW_ALL_PATIENTS:    ['ADMIN', 'DOCTOR'],
  VIEW_OWN_RECORD:      ['PATIENT'],
  CREATE_PATIENT:       ['ADMIN', 'DOCTOR'],
  EDIT_PATIENT:         ['ADMIN', 'DOCTOR'],
  DELETE_PATIENT:       ['ADMIN'],
  CREATE_PREDICTION:    ['ADMIN', 'DOCTOR'],
  VIEW_ALL_PREDICTIONS: ['ADMIN', 'DOCTOR'],
  VIEW_OWN_PREDICTIONS: ['PATIENT'],
  MARK_REVIEWED:        ['ADMIN', 'DOCTOR'],
  EXPORT_PREDICTION:    ['ADMIN', 'DOCTOR'],
  VIEW_COHORT_STATS:    ['ADMIN', 'ANALYST'],
  VIEW_MODEL_REGISTRY:  ['ADMIN', 'ANALYST', 'DOCTOR'],
  VIEW_SYSTEM_STATUS:   ['ADMIN'],
  MANAGE_USERS:         ['ADMIN'],
} as const;

type Permission = keyof typeof PERMISSIONS;

export function can(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}