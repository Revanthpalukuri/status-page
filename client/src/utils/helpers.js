import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import {
  SERVICE_STATUS,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_COLORS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_SEVERITY_LABELS,
  OVERALL_STATUS_PRIORITY,
  DATE_FORMATS,
} from './constants';

// Date formatting utilities
export const formatDate = (date, formatString = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, formatString);
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const formatDateTime = (date, formatString = DATE_FORMATS.DISPLAY_WITH_TIME) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, formatString);
};

export const formatTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, DATE_FORMATS.TIME);
};

export const formatDuration = (startDate, endDate = new Date()) => {
  if (!startDate) return '';
  
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  if (!isValid(start) || !isValid(end)) return '';
  
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  
  return `${diffMinutes}m`;
};

// Status utilities
export const getStatusLabel = (status) => {
  return SERVICE_STATUS_LABELS[status] || status;
};

export const getStatusColor = (status) => {
  return SERVICE_STATUS_COLORS[status] || 'gray';
};

export const getIncidentStatusLabel = (status) => {
  return INCIDENT_STATUS_LABELS[status] || status;
};

export const getIncidentSeverityLabel = (severity) => {
  return INCIDENT_SEVERITY_LABELS[severity] || severity;
};

// Calculate overall system status from services
export const calculateOverallStatus = (services) => {
  if (!services || services.length === 0) {
    return SERVICE_STATUS.OPERATIONAL;
  }

  // Find the highest priority status
  let highestPriority = 0;
  let overallStatus = SERVICE_STATUS.OPERATIONAL;

  services.forEach(service => {
    const priority = OVERALL_STATUS_PRIORITY[service.status] || 1;
    if (priority > highestPriority) {
      highestPriority = priority;
      overallStatus = service.status;
    }
  });

  return overallStatus;
};

// Generate status message
export const getOverallStatusMessage = (services) => {
  const status = calculateOverallStatus(services);
  
  switch (status) {
    case SERVICE_STATUS.OPERATIONAL:
      return 'All systems operational';
    case SERVICE_STATUS.DEGRADED_PERFORMANCE:
      return 'Some systems experiencing degraded performance';
    case SERVICE_STATUS.PARTIAL_OUTAGE:
      return 'Some systems experiencing partial outages';
    case SERVICE_STATUS.MAJOR_OUTAGE:
      return 'Major system outage in progress';
    case SERVICE_STATUS.UNDER_MAINTENANCE:
      return 'Systems under maintenance';
    default:
      return 'Status unknown';
  }
};

// Validation utilities
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateSlug = (slug) => {
  const re = /^[a-z0-9-]+$/;
  return re.test(slug) && slug.length >= 3 && slug.length <= 50;
};

// String utilities
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Array utilities
export const sortByDate = (array, dateField, ascending = false) => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    
    if (ascending) {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
};

export const sortByStatus = (services) => {
  return [...services].sort((a, b) => {
    const priorityA = OVERALL_STATUS_PRIORITY[a.status] || 1;
    const priorityB = OVERALL_STATUS_PRIORITY[b.status] || 1;
    
    // Higher priority first, then by name
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    
    return a.name.localeCompare(b.name);
  });
};

// Color utilities
export const getStatusBadgeClasses = (status) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  switch (status) {
    case SERVICE_STATUS.OPERATIONAL:
      return `${baseClasses} bg-green-100 text-green-800`;
    case SERVICE_STATUS.DEGRADED_PERFORMANCE:
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case SERVICE_STATUS.PARTIAL_OUTAGE:
      return `${baseClasses} bg-orange-100 text-orange-800`;
    case SERVICE_STATUS.MAJOR_OUTAGE:
      return `${baseClasses} bg-red-100 text-red-800`;
    case SERVICE_STATUS.UNDER_MAINTENANCE:
      return `${baseClasses} bg-blue-100 text-blue-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

export const getStatusDotClasses = (status) => {
  const baseClasses = 'h-2 w-2 rounded-full';
  
  switch (status) {
    case SERVICE_STATUS.OPERATIONAL:
      return `${baseClasses} bg-green-400`;
    case SERVICE_STATUS.DEGRADED_PERFORMANCE:
      return `${baseClasses} bg-yellow-400`;
    case SERVICE_STATUS.PARTIAL_OUTAGE:
      return `${baseClasses} bg-orange-400`;
    case SERVICE_STATUS.MAJOR_OUTAGE:
      return `${baseClasses} bg-red-400`;
    case SERVICE_STATUS.UNDER_MAINTENANCE:
      return `${baseClasses} bg-blue-400`;
    default:
      return `${baseClasses} bg-gray-400`;
  }
};

// Storage utilities
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// URL utilities
export const buildPublicStatusUrl = (slug, path = '') => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/status/${slug}${path}`;
};

export const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return 'U';
  
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return `${first}${last}` || 'U';
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Error handling utilities
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
};

export const getValidationErrors = (error) => {
  if (error?.response?.data?.errors) {
    return error.response.data.errors;
  }
  return [];
};
