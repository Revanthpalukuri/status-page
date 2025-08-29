import { DataTypes } from 'sequelize';
import sequelize from '../database/config.js';

const ServiceStatusLog = sequelize.define('ServiceStatusLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'service_id',
    references: {
      model: 'services',
      key: 'id',
    },
  },
  oldStatus: {
    type: DataTypes.ENUM('operational', 'degraded_performance', 'partial_outage', 'major_outage', 'under_maintenance'),
    allowNull: true,
    field: 'old_status',
  },
  newStatus: {
    type: DataTypes.ENUM('operational', 'degraded_performance', 'partial_outage', 'major_outage', 'under_maintenance'),
    allowNull: false,
    field: 'new_status',
  },
  changedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'changed_by',
    references: {
      model: 'users',
      key: 'id',
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
}, {
  tableName: 'service_status_logs',
  timestamps: true,
  underscored: true,
});

export default ServiceStatusLog;
