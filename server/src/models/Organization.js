import { DataTypes } from 'sequelize';
import sequelize from '../database/config.js';

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/,
      len: [3, 50],
    },
  },
  description: {
    type: DataTypes.TEXT,
  },
  logoUrl: {
    type: DataTypes.STRING,
    field: 'logo_url',
  },
  websiteUrl: {
    type: DataTypes.STRING,
    field: 'website_url',
    validate: {
      isUrl: true,
    },
  },
  primaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#3b82f6',
    field: 'primary_color',
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_public',
  },
  customDomain: {
    type: DataTypes.STRING,
    field: 'custom_domain',
  },
  accessCode: {
    type: DataTypes.STRING(7),
    allowNull: true,
    unique: true,
    field: 'access_code',
    validate: {
      len: [7, 7],
      isNumeric: true,
    },
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC',
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'owner_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'organizations',
  indexes: [
    {
      unique: true,
      fields: ['slug'],
    },
  ],
});

export default Organization;
