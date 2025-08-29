import { DataTypes } from 'sequelize';
import sequelize from '../database/config.js';

const OrganizationMember = sequelize.define('OrganizationMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
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
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
  },
  status: {
    type: DataTypes.ENUM('pending', 'active'),
    defaultValue: 'active',
  },
  invitedBy: {
    type: DataTypes.UUID,
    field: 'invited_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  invitedAt: {
    type: DataTypes.DATE,
    field: 'invited_at',
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'joined_at',
  },
}, {
  tableName: 'organization_members',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'organization_id'],
    },
  ],
});

export default OrganizationMember;
