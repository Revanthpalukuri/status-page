// Service status definitions
export const SERVICE_STATUS = {
  OPERATIONAL: 'operational',
  DEGRADED_PERFORMANCE: 'degraded_performance',
  PARTIAL_OUTAGE: 'partial_outage',
  MAJOR_OUTAGE: 'major_outage',
  UNDER_MAINTENANCE: 'under_maintenance',
};

export const SERVICE_STATUS_LABELS = {
  [SERVICE_STATUS.OPERATIONAL]: 'Operational',
  [SERVICE_STATUS.DEGRADED_PERFORMANCE]: 'Degraded Performance',
  [SERVICE_STATUS.PARTIAL_OUTAGE]: 'Partial Outage',
  [SERVICE_STATUS.MAJOR_OUTAGE]: 'Major Outage',
  [SERVICE_STATUS.UNDER_MAINTENANCE]: 'Under Maintenance',
};

export const SERVICE_STATUS_COLORS = {
  [SERVICE_STATUS.OPERATIONAL]: 'green',
  [SERVICE_STATUS.DEGRADED_PERFORMANCE]: 'yellow',
  [SERVICE_STATUS.PARTIAL_OUTAGE]: 'orange',
  [SERVICE_STATUS.MAJOR_OUTAGE]: 'red',
  [SERVICE_STATUS.UNDER_MAINTENANCE]: 'blue',
};

// Incident status definitions
export const INCIDENT_STATUS = {
  INVESTIGATING: 'investigating',
  IDENTIFIED: 'identified',
  MONITORING: 'monitoring',
  RESOLVED: 'resolved',
};

export const INCIDENT_STATUS_LABELS = {
  [INCIDENT_STATUS.INVESTIGATING]: 'Investigating',
  [INCIDENT_STATUS.IDENTIFIED]: 'Identified',
  [INCIDENT_STATUS.MONITORING]: 'Monitoring',
  [INCIDENT_STATUS.RESOLVED]: 'Resolved',
};

export const INCIDENT_STATUS_COLORS = {
  [INCIDENT_STATUS.INVESTIGATING]: 'red',
  [INCIDENT_STATUS.IDENTIFIED]: 'orange',
  [INCIDENT_STATUS.MONITORING]: 'blue',
  [INCIDENT_STATUS.RESOLVED]: 'green',
};

// Incident severity definitions
export const INCIDENT_SEVERITY = {
  MINOR: 'minor',
  MAJOR: 'major',
  CRITICAL: 'critical',
};

export const INCIDENT_SEVERITY_LABELS = {
  [INCIDENT_SEVERITY.MINOR]: 'Minor',
  [INCIDENT_SEVERITY.MAJOR]: 'Major',
  [INCIDENT_SEVERITY.CRITICAL]: 'Critical',
};

export const INCIDENT_SEVERITY_COLORS = {
  [INCIDENT_SEVERITY.MINOR]: 'yellow',
  [INCIDENT_SEVERITY.MAJOR]: 'orange',
  [INCIDENT_SEVERITY.CRITICAL]: 'red',
};

// Incident type definitions
export const INCIDENT_TYPE = {
  INCIDENT: 'incident',
  MAINTENANCE: 'maintenance',
};

export const INCIDENT_TYPE_LABELS = {
  [INCIDENT_TYPE.INCIDENT]: 'Incident',
  [INCIDENT_TYPE.MAINTENANCE]: 'Maintenance',
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.MEMBER]: 'Member',
};

// Organization member status
export const MEMBER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
};

export const MEMBER_STATUS_LABELS = {
  [MEMBER_STATUS.PENDING]: 'Pending',
  [MEMBER_STATUS.ACTIVE]: 'Active',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: '/auth',
  ORGANIZATIONS: '/organizations',
  SERVICES: '/services',
  INCIDENTS: '/incidents',
  PUBLIC: '/public',
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  ORGANIZATION: 'currentOrganization',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  TIME: 'HH:mm',
};

// Overall system status calculation
export const OVERALL_STATUS_PRIORITY = {
  [SERVICE_STATUS.MAJOR_OUTAGE]: 5,
  [SERVICE_STATUS.PARTIAL_OUTAGE]: 4,
  [SERVICE_STATUS.DEGRADED_PERFORMANCE]: 3,
  [SERVICE_STATUS.UNDER_MAINTENANCE]: 2,
  [SERVICE_STATUS.OPERATIONAL]: 1,
};

// Status page themes
export const STATUS_PAGE_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

// WebSocket events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ORGANIZATION: 'join-organization',
  LEAVE_ORGANIZATION: 'leave-organization',
  JOIN_STATUS_PAGE: 'join-status-page',
  LEAVE_STATUS_PAGE: 'leave-status-page',
  SERVICE_UPDATED: 'service-updated',
  INCIDENT_CREATED: 'incident-created',
  INCIDENT_UPDATED: 'incident-updated',
  STATUS_CHANGED: 'status-changed',
};
