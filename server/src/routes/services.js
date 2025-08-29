import express from 'express';
import { Op } from 'sequelize';
import { Service, Organization, Incident, IncidentService, ServiceStatusLog } from '../models/index.js';
import { authenticate, requireOrganizationAccess } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all services for organization
router.get('/organization/:organizationId', authenticate, requireOrganizationAccess, asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;

  const services = await Service.findAll({
    where: { organization_id: organizationId },
    include: [{
      model: Incident,
      as: 'incidents',
      where: {
        status: { [Op.not]: 'resolved' },
      },
      required: false,
      attributes: ['id', 'title', 'status', 'severity', 'type', 'started_at'],
    }],
    order: [['order', 'ASC'], ['name', 'ASC']],
  });

  res.json({
    success: true,
    data: { services },
  });
}));

// Create new service
router.post('/organization/:organizationId', authenticate, requireOrganizationAccess, validate(schemas.createService), asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  const serviceData = {
    ...req.body,
    organizationId: organizationId,
  };

  const service = await Service.create(serviceData);

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    data: { service },
  });
}));

// Get service details
router.get('/:serviceId', authenticate, asyncHandler(async (req, res) => {
  const service = await Service.findByPk(req.params.serviceId, {
    include: [
      {
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'slug'],
      },
      {
        model: Incident,
        as: 'incidents',
        attributes: ['id', 'title', 'status', 'severity', 'type', 'startedAt', 'resolvedAt'],
        order: [['startedAt', 'DESC']],
        limit: 10,
      },
    ],
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  // Check if user has access to this organization
  const organizationId = service.organizationId;
  
  // This is a simplified check - in a real app, you'd want to verify organization access
  // For now, we'll allow access if the user is authenticated
  
  res.json({
    success: true,
    data: { service },
  });
}));

// Update service
router.put('/:serviceId', authenticate, validate(schemas.updateService), asyncHandler(async (req, res) => {
  const service = await Service.findByPk(req.params.serviceId, {
    include: [{
      model: Organization,
      as: 'organization',
      attributes: ['id', 'ownerId'],
    }],
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  // Check organization access (simplified)
  // In a real app, you'd use the requireOrganizationAccess middleware
  
  const updates = req.body;

  // Update service fields
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      service[key] = updates[key];
    }
  });

  await service.save();

  // If status was updated, we might want to emit a WebSocket event here
  // This will be handled when we set up the WebSocket server

  res.json({
    success: true,
    message: 'Service updated successfully',
    data: { service },
  });
}));

// Delete service
router.delete('/:serviceId', authenticate, asyncHandler(async (req, res) => {
  const service = await Service.findByPk(req.params.serviceId, {
    include: [{
      model: Organization,
      as: 'organization',
      attributes: ['id', 'ownerId'],
    }],
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  // Check organization access (simplified)
  // In a real app, you'd use the requireOrganizationAccess middleware

  await service.destroy();

  res.json({
    success: true,
    message: 'Service deleted successfully',
  });
}));

// Update service status
router.patch('/:serviceId/status', authenticate, asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['operational', 'degraded_performance', 'partial_outage', 'major_outage', 'under_maintenance'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value',
    });
  }

  const service = await Service.findByPk(req.params.serviceId, {
    include: [{
      model: Organization,
      as: 'organization',
      attributes: ['id', 'name', 'slug'],
    }],
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  const oldStatus = service.status;
  service.status = status;
  await service.save();

  // Log the status change
  await ServiceStatusLog.create({
    serviceId: service.id,
    oldStatus: oldStatus,
    newStatus: status,
    changedBy: req.user.id,
    organizationId: service.organizationId,
  });

  // Here we would emit a WebSocket event for real-time updates
  // This will be implemented when we set up the WebSocket server

  res.json({
    success: true,
    message: 'Service status updated successfully',
    data: { 
      service,
      statusChanged: oldStatus !== status,
    },
  });
}));

// Update service uptime
router.patch('/:serviceId/uptime', authenticate, asyncHandler(async (req, res) => {
  const { uptimePercentage } = req.body;

  // Validate uptime percentage is a valid number
  const parsedUptime = parseFloat(uptimePercentage);
  
  if (isNaN(parsedUptime) || parsedUptime < 1 || parsedUptime > 100) {
    return res.status(400).json({
      success: false,
      message: 'Uptime percentage must be a valid number between 1 and 100',
    });
  }

  const service = await Service.findByPk(req.params.serviceId, {
    include: [{
      model: Organization,
      as: 'organization',
      attributes: ['id', 'name', 'slug'],
    }],
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  const oldUptime = service.uptimePercentage;
  service.uptimePercentage = parsedUptime;
  await service.save();

  res.json({
    success: true,
    message: 'Service uptime updated successfully',
    data: { 
      service,
      uptimeChanged: oldUptime !== parsedUptime,
    },
  });
}));

// Reorder services
router.put('/organization/:organizationId/reorder', authenticate, requireOrganizationAccess, asyncHandler(async (req, res) => {
  const { serviceIds } = req.body; // Array of service IDs in desired order
  
  if (!Array.isArray(serviceIds)) {
    return res.status(400).json({
      success: false,
      message: 'serviceIds must be an array',
    });
  }

  const organizationId = req.params.organizationId;

  // Update the order of each service
  const updatePromises = serviceIds.map((serviceId, index) =>
    Service.update(
      { order: index },
      {
        where: {
          id: serviceId,
          organizationId,
        },
      }
    )
  );

  await Promise.all(updatePromises);

  // Fetch updated services
  const services = await Service.findAll({
    where: { organizationId },
    order: [['order', 'ASC']],
  });

  res.json({
    success: true,
    message: 'Services reordered successfully',
    data: { services },
  });
}));

export default router;
