import { DataTypes } from 'sequelize';
import sequelize from '../database/config.js';

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM(
      'operational',
      'degraded_performance',
      'partial_outage',
      'major_outage',
      'under_maintenance'
    ),
    defaultValue: 'operational',
  },
  url: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true,
    },
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id',
    },
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_public',
  },
  monitoringEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'monitoring_enabled',
  },
  monitoringUrl: {
    type: DataTypes.STRING,
    field: 'monitoring_url',
  },
  lastCheckedAt: {
    type: DataTypes.DATE,
    field: 'last_checked_at',
  },
  uptimePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100.00,
    field: 'uptime_percentage',
  },
  responseTime: {
    type: DataTypes.INTEGER, // in milliseconds
    field: 'response_time',
  },
}, {
  tableName: 'services',
  indexes: [
    {
      fields: ['organization_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['order'],
    },
  ],
});

export default Service;
