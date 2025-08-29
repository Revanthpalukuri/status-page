import { DataTypes } from 'sequelize';
import sequelize from '../database/config.js';

const IncidentService = sequelize.define('IncidentService', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'service_id',
    references: {
      model: 'services',
      key: 'id',
    },
  },
}, {
  tableName: 'incident_services',
  indexes: [
    {
      unique: true,
      fields: ['incident_id', 'service_id'],
    },
  ],
});

export default IncidentService;
