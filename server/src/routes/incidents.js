import express from 'express';
import { Op } from 'sequelize';
import {
  Incident,
  IncidentUpdate,
  IncidentService,
  Service,
  User,
  Organization,
  ServiceStatusLog,
} from '../models/index.js';
import { authenticate, requireOrganizationAccess } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all incidents for organization
router.get('/organization/:organizationId', authenticate, requireOrganizationAccess, asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  const { status, type, page = 1, limit = 20 } = req.query;

  const whereClause = { organization_id: organizationId };
  
  if (status) {
    if (status.includes(',')) {
      // Handle comma-separated status values
      whereClause.status = { [Op.in]: status.split(',').map(s => s.trim()) };
    } else {
      whereClause.status = status;
    }
  }
  
  if (type) {
    whereClause.type = type;
  }

  const offset = (page - 1) * limit;

  const { count, rows: incidents } = await Incident.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Service,
        as: 'affectedServices',
        attributes: ['id', 'name', 'status'],
        through: { attributes: [] },
      },
      {
        model: IncidentUpdate,
        as: 'updates',
        limit: 1,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'title', 'description', 'status', 'created_at'],
      },
    ],
    order: [['started_at', 'DESC']],
    limit: parseInt(limit),
    offset,
  });

  res.json({
    success: true,
    data: {
      incidents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    },
  });
}));

// Create new incident
router.post('/organization/:organizationId', authenticate, requireOrganizationAccess, validate(schemas.createIncident), asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  const { serviceIds, ...incidentData } = req.body;
  const userId = req.user.id;

  // Verify that all services belong to the organization
  const services = await Service.findAll({
    where: {
      id: { [Op.in]: serviceIds },
      organizationId,
    },
  });

  if (services.length !== serviceIds.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more services do not belong to this organization',
    });
  }

  // Create incident
  const incident = await Incident.create({
    ...incidentData,
    organizationId,
    createdBy: userId,
  });

  // Associate services with incident
  const serviceAssociations = serviceIds.map(serviceId => ({
    incidentId: incident.id,
    serviceId,
  }));

  await IncidentService.bulkCreate(serviceAssociations);

  // Create initial incident update
  await IncidentUpdate.create({
    title: `Incident Created: ${incident.title}`,
    description: incident.description || 'Initial incident report.',
    status: incident.status,
    incidentId: incident.id,
    createdBy: userId,
  });

  // Fetch complete incident data
  const completeIncident = await Incident.findByPk(incident.id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Service,
        as: 'affectedServices',
        attributes: ['id', 'name', 'status'],
        through: { attributes: [] },
      },
      {
        model: IncidentUpdate,
        as: 'updates',
        include: [{
          model: User,
          as: 'creator',
          attributes: ['first_name', 'last_name'],
        }],
      },
    ],
  });

  // Here we would emit a WebSocket event for real-time updates
  // This will be implemented when we set up the WebSocket server

  res.status(201).json({
    success: true,
    message: 'Incident created successfully',
    data: { incident: completeIncident },
  });
}));

// Get incident details
router.get('/:incidentId', authenticate, asyncHandler(async (req, res) => {
  const incident = await Incident.findByPk(req.params.incidentId, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Service,
        as: 'affectedServices',
        attributes: ['id', 'name', 'status'],
        through: { attributes: [] },
      },
      {
        model: IncidentUpdate,
        as: 'updates',
        order: [['createdAt', 'ASC']],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['first_name', 'last_name'],
        }],
      },
      {
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'slug'],
      },
    ],
  });

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found',
    });
  }

  // Check organization access (simplified for now)
  
  res.json({
    success: true,
    data: { incident },
  });
}));

// Update incident
router.put('/:incidentId', authenticate, validate(schemas.updateIncident), asyncHandler(async (req, res) => {
  const { serviceIds, ...updates } = req.body;
  
  const incident = await Incident.findByPk(req.params.incidentId, {
    include: [{
      model: Organization,
      as: 'organization',
      attributes: ['id', 'ownerId'],
    }],
  });

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found',
    });
  }

  // Check organization access (simplified)

  // Update incident fields
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      incident[key] = updates[key];
    }
  });

  // Handle resolution
  if (updates.status === 'resolved' && !incident.resolvedAt) {
    incident.resolvedAt = new Date();
  }

  await incident.save();

  // Update service associations if provided
  if (serviceIds) {
    // Remove existing associations
    await IncidentService.destroy({
      where: { incidentId: incident.id },
    });

    // Add new associations
    const serviceAssociations = serviceIds.map(serviceId => ({
      incidentId: incident.id,
      serviceId,
    }));

    await IncidentService.bulkCreate(serviceAssociations);
  }

  // Fetch updated incident
  const updatedIncident = await Incident.findByPk(incident.id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Service,
        as: 'affectedServices',
        attributes: ['id', 'name', 'status'],
        through: { attributes: [] },
      },
    ],
  });

  res.json({
    success: true,
    message: 'Incident updated successfully',
    data: { incident: updatedIncident },
  });
}));

// Delete incident
router.delete('/:incidentId', authenticate, asyncHandler(async (req, res) => {
  const incident = await Incident.findByPk(req.params.incidentId, {
    include: [{
      model: Organization,
      as: 'organization',
      attributes: ['id', 'ownerId'],
    }],
  });

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found',
    });
  }

  // Check organization access (simplified)

  await incident.destroy();

  res.json({
    success: true,
    message: 'Incident deleted successfully',
  });
}));

// Add incident update
router.post('/:incidentId/updates', authenticate, validate(schemas.createIncidentUpdate), asyncHandler(async (req, res) => {
  const incidentId = req.params.incidentId;
  const userId = req.user.id;
  const updateData = req.body;

  const incident = await Incident.findByPk(incidentId, {
    include: [{
      model: Organization,
      as: 'organization',
      attributes: ['id', 'ownerId'],
    }],
  });

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found',
    });
  }

  // Check organization access (simplified)

  // Create incident update
  const incidentUpdate = await IncidentUpdate.create({
    ...updateData,
    incidentId,
    createdBy: userId,
  });

  // Update the incident status to match the update
  if (updateData.status && updateData.status !== incident.status) {
    incident.status = updateData.status;
    
    // Handle resolution
    if (updateData.status === 'resolved' && !incident.resolvedAt) {
      incident.resolvedAt = new Date();
    }
    
    await incident.save();
  }

  // Fetch complete update data
  const completeUpdate = await IncidentUpdate.findByPk(incidentUpdate.id, {
    include: [{
      model: User,
      as: 'creator',
      attributes: ['firstName', 'lastName'],
    }],
  });

  res.status(201).json({
    success: true,
    message: 'Incident update created successfully',
    data: { update: completeUpdate },
  });
}));

// Get incident updates
router.get('/:incidentId/updates', authenticate, asyncHandler(async (req, res) => {
  const incidentId = req.params.incidentId;

  const incident = await Incident.findByPk(incidentId);
  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found',
    });
  }

  const updates = await IncidentUpdate.findAll({
    where: { incidentId },
    include: [{
      model: User,
      as: 'creator',
      attributes: ['firstName', 'lastName'],
    }],
    order: [['createdAt', 'ASC']],
  });

  res.json({
    success: true,
    data: { updates },
  });
}));

// Get timeline (incidents + service status changes)
router.get('/organization/:organizationId/timeline', authenticate, requireOrganizationAccess, asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  const { limit = 50, offset = 0 } = req.query;

  // Get incidents
  const incidents = await Incident.findAll({
    where: { organization_id: organizationId },
    include: [
      {
        model: Service,
        as: 'affectedServices',
        attributes: ['id', 'name', 'status'],
        through: { attributes: [] },
      },
      {
        model: IncidentUpdate,
        as: 'updates',
        limit: 1,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'title', 'description', 'status', 'created_at'],
      },
    ],
    order: [['started_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  // Get service status changes
  const statusChanges = await ServiceStatusLog.findAll({
    where: { organizationId },
    include: [
      {
        model: Service,
        as: 'service',
        attributes: ['id', 'name'],
      },
      {
        model: User,
        as: 'changedByUser',
        attributes: ['first_name', 'last_name'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  // Combine and sort by timestamp
  const timelineItems = [
    ...incidents.map(incident => ({
      type: 'incident',
      id: incident.id,
      timestamp: incident.startedAt || incident.created_at,
      data: incident,
    })),
    ...statusChanges.map(change => ({
      type: 'service_status_change',
      id: change.id,
      timestamp: change.created_at,
      data: change,
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
   .slice(0, parseInt(limit));

  res.json({
    success: true,
    data: { timelineItems },
  });
}));

export default router;
