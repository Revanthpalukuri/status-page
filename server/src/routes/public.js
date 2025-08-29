import express from 'express';
import { Op } from 'sequelize';
import {
  Organization,
  Service,
  Incident,
  IncidentUpdate,
  User,
} from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get public status page by organization slug
router.get('/status/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Find organization
  const organization = await Organization.findOne({
    where: { 
      slug,
      is_public: true,
    },
    attributes: ['id', 'name', 'slug', 'description', 'logo_url', 'website_url', 'primary_color', 'timezone'],
  });

  if (!organization) {
    return res.status(404).json({
      success: false,
      message: 'Status page not found',
    });
  }

  // Get public services
  const services = await Service.findAll({
    where: {
      organization_id: organization.id,
      is_public: true,
    },
    attributes: ['id', 'name', 'description', 'status', 'url', 'order'],
    order: [['order', 'ASC'], ['name', 'ASC']],
  });

  // Get active incidents (not resolved)
  const activeIncidents = await Incident.findAll({
    where: {
      organization_id: organization.id,
      status: { [Op.not]: 'resolved' },
      is_public: true,
    },
    include: [
      {
        model: Service,
        as: 'affectedServices',
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
      {
        model: IncidentUpdate,
        as: 'updates',
        order: [['created_at', 'DESC']],
        limit: 1,
        attributes: ['id', 'title', 'description', 'status', 'created_at'],
      },
    ],
    order: [['started_at', 'DESC']],
  });

  // Get scheduled maintenance
  const scheduledMaintenance = await Incident.findAll({
    where: {
      organization_id: organization.id,
      type: 'maintenance',
      scheduled_for: { [Op.gte]: new Date() },
      is_public: true,
    },
    include: [
      {
        model: Service,
        as: 'affectedServices',
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
    ],
    order: [['scheduled_for', 'ASC']],
    limit: 5,
  });

  // Calculate overall status
  let overallStatus = 'operational';
  
  if (services.some(service => service.status === 'major_outage')) {
    overallStatus = 'major_outage';
  } else if (services.some(service => service.status === 'partial_outage')) {
    overallStatus = 'partial_outage';
  } else if (services.some(service => service.status === 'degraded_performance')) {
    overallStatus = 'degraded_performance';
  } else if (services.some(service => service.status === 'under_maintenance')) {
    overallStatus = 'under_maintenance';
  }

  res.json({
    success: true,
    data: {
      organization,
      services,
      activeIncidents,
      scheduledMaintenance,
      overallStatus,
    },
  });
}));

// Get recent incidents for status page
router.get('/status/:slug/incidents', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Find organization
  const organization = await Organization.findOne({
    where: { 
      slug,
      isPublic: true,
    },
    attributes: ['id'],
  });

  if (!organization) {
    return res.status(404).json({
      success: false,
      message: 'Status page not found',
    });
  }

  const offset = (page - 1) * limit;

  // Get recent incidents (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { count, rows: incidents } = await Incident.findAndCountAll({
    where: {
      organizationId: organization.id,
      startedAt: { [Op.gte]: thirtyDaysAgo },
      isPublic: true,
    },
    include: [
      {
        model: Service,
        as: 'affectedServices',
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
      {
        model: IncidentUpdate,
        as: 'updates',
        order: [['createdAt', 'ASC']],
        attributes: ['id', 'title', 'description', 'status', 'createdAt'],
      },
    ],
    order: [['startedAt', 'DESC']],
    limit: parseInt(limit),
    offset,
    attributes: [
      'id', 'title', 'description', 'status', 'severity', 'type',
      'startedAt', 'resolvedAt', 'scheduledFor', 'scheduledUntil'
    ],
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

// Get incident details for public view
router.get('/status/:slug/incidents/:incidentId', asyncHandler(async (req, res) => {
  const { slug, incidentId } = req.params;

  // Find organization
  const organization = await Organization.findOne({
    where: { 
      slug,
      isPublic: true,
    },
    attributes: ['id', 'name'],
  });

  if (!organization) {
    return res.status(404).json({
      success: false,
      message: 'Status page not found',
    });
  }

  // Get incident
  const incident = await Incident.findOne({
    where: {
      id: incidentId,
      organizationId: organization.id,
      isPublic: true,
    },
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
        where: { isPublic: true },
        required: false,
        order: [['createdAt', 'ASC']],
        attributes: ['id', 'title', 'description', 'status', 'createdAt'],
      },
    ],
    attributes: [
      'id', 'title', 'description', 'status', 'severity', 'type',
      'startedAt', 'resolvedAt', 'scheduledFor', 'scheduledUntil'
    ],
  });

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found',
    });
  }

  res.json({
    success: true,
    data: { incident, organization },
  });
}));

// Get service uptime data
router.get('/status/:slug/services/:serviceId/uptime', asyncHandler(async (req, res) => {
  const { slug, serviceId } = req.params;
  const { days = 30 } = req.query;

  // Find organization
  const organization = await Organization.findOne({
    where: { 
      slug,
      isPublic: true,
    },
    attributes: ['id'],
  });

  if (!organization) {
    return res.status(404).json({
      success: false,
      message: 'Status page not found',
    });
  }

  // Find service
  const service = await Service.findOne({
    where: {
      id: serviceId,
      organizationId: organization.id,
      isPublic: true,
    },
    attributes: ['id', 'name', 'status', 'uptimePercentage'],
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  // Generate mock uptime data (in a real app, this would come from monitoring data)
  const uptimeData = [];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const uptime = Math.random() > 0.1 ? 100 : Math.random() * 100; // 90% chance of 100% uptime
    
    uptimeData.push({
      date: date.toISOString().split('T')[0],
      uptime: Math.round(uptime * 100) / 100,
    });
  }

  res.json({
    success: true,
    data: {
      service,
      uptimeData,
      averageUptime: uptimeData.reduce((acc, day) => acc + day.uptime, 0) / uptimeData.length,
    },
  });
}));

// Get status page summary
router.get('/status/:slug/summary', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Find organization
  const organization = await Organization.findOne({
    where: { 
      slug,
      isPublic: true,
    },
    attributes: ['id', 'name', 'description'],
  });

  if (!organization) {
    return res.status(404).json({
      success: false,
      message: 'Status page not found',
    });
  }

  // Get counts
  const [serviceCount, activeIncidentCount, scheduledMaintenanceCount] = await Promise.all([
    Service.count({
      where: {
        organizationId: organization.id,
        isPublic: true,
      },
    }),
    Incident.count({
      where: {
        organizationId: organization.id,
        status: { [Op.not]: 'resolved' },
        isPublic: true,
      },
    }),
    Incident.count({
      where: {
        organizationId: organization.id,
        type: 'maintenance',
        scheduledFor: { [Op.gte]: new Date() },
        isPublic: true,
      },
    }),
  ]);

  // Get recent incident count (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentIncidentCount = await Incident.count({
    where: {
      organizationId: organization.id,
      startedAt: { [Op.gte]: sevenDaysAgo },
      isPublic: true,
    },
  });

  res.json({
    success: true,
    data: {
      organization,
      summary: {
        serviceCount,
        activeIncidentCount,
        scheduledMaintenanceCount,
        recentIncidentCount,
      },
    },
  });
}));

export default router;
