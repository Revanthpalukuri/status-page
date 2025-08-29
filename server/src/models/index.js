import User from './User.js';
import Organization from './Organization.js';
import OrganizationMember from './OrganizationMember.js';
import Service from './Service.js';
import Incident from './Incident.js';
import IncidentUpdate from './IncidentUpdate.js';
import IncidentService from './IncidentService.js';
import ServiceStatusLog from './ServiceStatusLog.js';

// User -> Organization (Owner)
User.hasMany(Organization, { foreignKey: 'ownerId', as: 'ownedOrganizations' });
Organization.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User <-> Organization (Members) through OrganizationMember
User.belongsToMany(Organization, {
  through: OrganizationMember,
  foreignKey: 'userId',
  otherKey: 'organizationId',
  as: 'memberOrganizations',
});
Organization.belongsToMany(User, {
  through: OrganizationMember,
  foreignKey: 'organizationId',
  otherKey: 'userId',
  as: 'members',
});

// Direct associations for easier access
User.hasMany(OrganizationMember, { foreignKey: 'userId', as: 'memberships' });
Organization.hasMany(OrganizationMember, { foreignKey: 'organizationId', as: 'memberships' });
OrganizationMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
OrganizationMember.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
OrganizationMember.belongsTo(User, { foreignKey: 'invitedBy', as: 'inviter' });

// Organization -> Service
Organization.hasMany(Service, { foreignKey: 'organizationId', as: 'services' });
Service.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

// Organization -> Incident
Organization.hasMany(Incident, { foreignKey: 'organizationId', as: 'incidents' });
Incident.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

// User -> Incident (Creator)
User.hasMany(Incident, { foreignKey: 'created_by', as: 'createdIncidents' });
Incident.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Incident -> IncidentUpdate
Incident.hasMany(IncidentUpdate, { foreignKey: 'incidentId', as: 'updates' });
IncidentUpdate.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident' });

// IncidentUpdate creator association removed to avoid database column issues

// Incident <-> Service (Many-to-Many) through IncidentService
Incident.belongsToMany(Service, {
  through: IncidentService,
  foreignKey: 'incidentId',
  otherKey: 'serviceId',
  as: 'affectedServices',
});
Service.belongsToMany(Incident, {
  through: IncidentService,
  foreignKey: 'serviceId',
  otherKey: 'incidentId',
  as: 'incidents',
});

// Direct associations for easier access
Incident.hasMany(IncidentService, { foreignKey: 'incidentId', as: 'serviceConnections' });
Service.hasMany(IncidentService, { foreignKey: 'serviceId', as: 'incidentConnections' });
IncidentService.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident' });
IncidentService.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// Service -> ServiceStatusLog
Service.hasMany(ServiceStatusLog, { foreignKey: 'serviceId', as: 'statusLogs' });
ServiceStatusLog.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// User -> ServiceStatusLog (who changed it)
User.hasMany(ServiceStatusLog, { foreignKey: 'changedBy', as: 'statusChanges' });
ServiceStatusLog.belongsTo(User, { foreignKey: 'changedBy', as: 'changedByUser' });

// Organization -> ServiceStatusLog
Organization.hasMany(ServiceStatusLog, { foreignKey: 'organizationId', as: 'statusLogs' });
ServiceStatusLog.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

export {
  User,
  Organization,
  OrganizationMember,
  Service,
  Incident,
  IncidentUpdate,
  IncidentService,
  ServiceStatusLog,
};
