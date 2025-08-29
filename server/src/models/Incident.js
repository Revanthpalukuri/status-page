import { DataTypes } from 'sequelize';
import sequelize from '../database/config.js';

const Incident = sequelize.define('Incident', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM(
      'investigating',
      'identified',
      'monitoring',
      'resolved'
    ),
    defaultValue: 'investigating',
  },
  severity: {
    type: DataTypes.ENUM(
      'minor',
      'major',
      'critical'
    ),
    defaultValue: 'minor',
  },
  type: {
    type: DataTypes.ENUM('incident', 'maintenance'),
    defaultValue: 'incident',
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
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'started_at',
  },
  resolvedAt: {
    type: DataTypes.DATE,
    field: 'resolved_at',
  },
  scheduledFor: {
    type: DataTypes.DATE,
    field: 'scheduled_for',
  },
  scheduledUntil: {
    type: DataTypes.DATE,
    field: 'scheduled_until',
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_public',
  },
  notifySubscribers: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'notify_subscribers',
  },
}, {
  tableName: 'incidents',
  indexes: [
    {
      fields: ['organization_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['started_at'],
    },
  ],
});

export default Incident;
