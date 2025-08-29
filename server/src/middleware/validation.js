import Joi from 'joi';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails,
      });
    }

    req.body = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Organization schemas
  createOrganization: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).min(3).max(50).required(),
    description: Joi.string().max(500).optional(),
    websiteUrl: Joi.string().uri().optional(),
    logoUrl: Joi.string().uri().optional(),
    primaryColor: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).optional(),
    timezone: Joi.string().optional(),
  }),

  updateOrganization: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional(),
    websiteUrl: Joi.string().uri().optional(),
    logoUrl: Joi.string().uri().optional(),
    primaryColor: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).optional(),
    timezone: Joi.string().optional(),
    isPublic: Joi.boolean().optional(),
  }),

  // Service schemas
  createService: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    url: Joi.string().uri().optional(),
    status: Joi.string().valid(
      'operational',
      'degraded_performance', 
      'partial_outage',
      'major_outage',
      'under_maintenance'
    ).optional(),
    order: Joi.number().integer().min(0).optional(),
    isPublic: Joi.boolean().optional(),
  }),

  updateService: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional(),
    url: Joi.string().uri().optional(),
    status: Joi.string().valid(
      'operational',
      'degraded_performance',
      'partial_outage',
      'major_outage',
      'under_maintenance'
    ).optional(),
    order: Joi.number().integer().min(0).optional(),
    isPublic: Joi.boolean().optional(),
  }),

  // Incident schemas
  createIncident: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(2000).optional(),
    status: Joi.string().valid(
      'investigating',
      'identified',
      'monitoring',
      'resolved'
    ).optional(),
    severity: Joi.string().valid('minor', 'major', 'critical').optional(),
    type: Joi.string().valid('incident', 'maintenance').optional(),
    serviceIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    scheduledFor: Joi.date().optional(),
    scheduledUntil: Joi.date().optional(),
    isPublic: Joi.boolean().optional(),
    notifySubscribers: Joi.boolean().optional(),
  }),

  updateIncident: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(2000).optional(),
    status: Joi.string().valid(
      'investigating',
      'identified',
      'monitoring',
      'resolved'
    ).optional(),
    severity: Joi.string().valid('minor', 'major', 'critical').optional(),
    serviceIds: Joi.array().items(Joi.string().uuid()).min(1).optional(),
    scheduledFor: Joi.date().optional(),
    scheduledUntil: Joi.date().optional(),
    isPublic: Joi.boolean().optional(),
    notifySubscribers: Joi.boolean().optional(),
  }),

  // Incident update schemas
  createIncidentUpdate: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().min(1).max(2000).required(),
    status: Joi.string().valid(
      'investigating',
      'identified',
      'monitoring',
      'resolved'
    ).required(),
    isPublic: Joi.boolean().optional(),
    notifySubscribers: Joi.boolean().optional(),
  }),

  // Team management schemas
  inviteMember: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('admin', 'member').optional(),
  }),

  updateMemberRole: Joi.object({
    role: Joi.string().valid('admin', 'member').required(),
  }),

  joinOrganization: Joi.object({
    slug: Joi.string().required().messages({
      'string.empty': 'Organization slug is required',
    }),
    accessCode: Joi.string().required().messages({
      'string.empty': 'Access code is required',
    }),
  }),
};
