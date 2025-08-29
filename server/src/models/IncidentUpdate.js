import { DataTypes } from 'sequelize';
import sequelize from '../database/config.js';

const IncidentUpdate = sequelize.define('IncidentUpdate', {
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
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      'investigating',
      'identified',
      'monitoring',
      'resolved'
    ),
    allowNull: false,
  },
  incidentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'incident_id',
    references: {
      model: 'incidents',
      key: 'id',
    },
  },
  // createdBy field removed to avoid database column issues
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
  tableName: 'incident_updates',
  indexes: [
    {
      fields: ['incident_id'],
    },
    {
      fields: ['created_at'],
    },
  ],
});

export default IncidentUpdate;
