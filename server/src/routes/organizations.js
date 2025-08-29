import express from 'express';
import { Op } from 'sequelize';
import {
  User,
  Organization,
  OrganizationMember,
  Service,
  Incident,
} from '../models/index.js';
import { authenticate, authorize, requireOrganizationAccess, requireOrganizationAdmin } from '../middleware/auth.js';

// Generate a random 7-digit access code
const generateAccessCode = () => {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
};
import { validate, schemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all organizations for current user
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get owned organizations
  const ownedOrganizations = await Organization.findAll({
    where: { ownerId: userId },
    attributes: ['id', 'name', 'slug', 'description', 'logoUrl', 'accessCode', 'created_at'],
  });

  // Get organizations where user is a member
  const memberOrganizations = await Organization.findAll({
    include: [{
      model: OrganizationMember,
      as: 'memberships',
      where: {
        userId,
        status: 'active',
      },
      attributes: ['role', 'joinedAt'],
    }],
    attributes: ['id', 'name', 'slug', 'description', 'logoUrl', 'accessCode', 'created_at'],
  });

  // Combine and deduplicate organizations
  const organizationMap = new Map();
  
  // Add owned organizations first (they take precedence)
  ownedOrganizations.forEach(org => {
    organizationMap.set(org.id, {
      ...org.toJSON(),
      role: 'admin',
      isOwner: true,
      createdAt: org.created_at,
    });
  });
  
  // Add member organizations only if not already owned
  memberOrganizations.forEach(org => {
    if (!organizationMap.has(org.id)) {
      organizationMap.set(org.id, {
        ...org.toJSON(),
        role: org.memberships[0].role,
        isOwner: false,
        joinedAt: org.memberships[0].joinedAt,
        createdAt: org.created_at,
      });
    }
  });
  
  const organizations = Array.from(organizationMap.values());

  res.json({
    success: true,
    data: { organizations },
  });
}));

// Create new organization (admin only)
router.post('/', authenticate, authorize('admin'), validate(schemas.createOrganization), asyncHandler(async (req, res) => {
  const { name, slug, description, websiteUrl, logoUrl, primaryColor, timezone } = req.body;
  const userId = req.user.id;

  // Check if slug is already taken
  const existingOrg = await Organization.findOne({ where: { slug } });
  if (existingOrg) {
    return res.status(400).json({
      success: false,
      message: 'Organization slug is already taken',
    });
  }

  // Generate a unique access code
  let accessCode;
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    accessCode = generateAccessCode();
    const existingAccessCode = await Organization.findOne({ where: { accessCode } });
    if (!existingAccessCode) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    return res.status(500).json({
      success: false,
      message: 'Unable to generate unique access code. Please try again.',
    });
  }

  // Create organization
  const organization = await Organization.create({
    name,
    slug,
    description,
    websiteUrl,
    logoUrl,
    primaryColor,
    timezone,
    accessCode,
    ownerId: userId,
  });

  // Add creator as admin member
  await OrganizationMember.create({
    userId,
    organizationId: organization.id,
    role: 'admin',
    status: 'active',
    joinedAt: new Date(),
  });

  res.status(201).json({
    success: true,
    message: 'Organization created successfully',
    data: { organization },
  });
}));

// Get organization details
router.get('/:organizationId', authenticate, requireOrganizationAccess, asyncHandler(async (req, res) => {
  const organization = await Organization.findByPk(req.params.organizationId, {
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: OrganizationMember,
        as: 'memberships',
        where: { status: 'active' },
        required: false,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        }],
      },
    ],
  });

  // Get organization stats
  const stats = await Promise.all([
    Service.count({ where: { organizationId: organization.id } }),
    Incident.count({
      where: {
        organizationId: organization.id,
        status: { [Op.not]: 'resolved' },
      },
    }),
    Incident.count({
      where: {
        organizationId: organization.id,
        type: 'maintenance',
        scheduledFor: { [Op.gte]: new Date() },
      },
    }),
  ]);

  const [serviceCount, activeIncidentCount, upcomingMaintenanceCount] = stats;

  res.json({
    success: true,
    data: {
      organization,
      stats: {
        serviceCount,
        activeIncidentCount,
        upcomingMaintenanceCount,
        memberCount: organization.memberships.length + 1, // +1 for owner
      },
      userRole: req.userRole,
    },
  });
}));

// Update organization
router.put('/:organizationId', authenticate, requireOrganizationAccess, requireOrganizationAdmin, validate(schemas.updateOrganization), asyncHandler(async (req, res) => {
  const organization = req.organization;
  const updates = req.body;

  // Update organization fields
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      organization[key] = updates[key];
    }
  });

  await organization.save();

  res.json({
    success: true,
    message: 'Organization updated successfully',
    data: { organization },
  });
}));

// Delete organization
router.delete('/:organizationId', authenticate, requireOrganizationAccess, asyncHandler(async (req, res) => {
  const organization = req.organization;
  const userId = req.user.id;

  // Only organization owner can delete the organization
  if (organization.ownerId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Only organization owner can delete the organization',
    });
  }

  await organization.destroy();

  res.json({
    success: true,
    message: 'Organization deleted successfully',
  });
}));

// Get organization members
router.get('/:organizationId/members', authenticate, requireOrganizationAccess, asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;

  const members = await OrganizationMember.findAll({
    where: { organizationId },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email', 'lastLoginAt'],
    }, {
      model: User,
      as: 'inviter',
      attributes: ['id', 'firstName', 'lastName', 'email'],
      required: false,
    }],
    order: [['joinedAt', 'ASC']],
  });

  // Also include the organization owner
  const organization = await Organization.findByPk(organizationId, {
    include: [{
      model: User,
      as: 'owner',
      attributes: ['id', 'firstName', 'lastName', 'email', 'lastLoginAt'],
    }],
  });

  const allMembers = [
    {
      id: null, // No membership record for owner
      user: organization.owner,
      role: 'admin',
      status: 'active',
      isOwner: true,
      joinedAt: organization.createdAt,
    },
    ...members.map(member => ({
      ...member.toJSON(),
      isOwner: false,
    })),
  ];

  res.json({
    success: true,
    data: { members: allMembers },
  });
}));

// Invite member to organization
router.post('/:organizationId/members', authenticate, requireOrganizationAccess, requireOrganizationAdmin, validate(schemas.inviteMember), asyncHandler(async (req, res) => {
  const { email, role = 'member' } = req.body;
  const organizationId = req.params.organizationId;
  const inviterId = req.user.id;

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User with this email not found',
    });
  }

  // Check if user is already a member
  const existingMember = await OrganizationMember.findOne({
    where: {
      userId: user.id,
      organizationId,
    },
  });

  if (existingMember) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of this organization',
    });
  }

  // Create membership
  const membership = await OrganizationMember.create({
    userId: user.id,
    organizationId,
    role,
    status: 'active', // In a real app, this might be 'pending' with email invitation
    invitedBy: inviterId,
    invitedAt: new Date(),
    joinedAt: new Date(),
  });

  // Fetch the complete membership data
  const completeMembership = await OrganizationMember.findByPk(membership.id, {
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email'],
    }],
  });

  res.status(201).json({
    success: true,
    message: 'Member added successfully',
    data: { membership: completeMembership },
  });
}));

// Update member role
router.put('/:organizationId/members/:memberId', authenticate, requireOrganizationAccess, requireOrganizationAdmin, validate(schemas.updateMemberRole), asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { organizationId, memberId } = req.params;

  const membership = await OrganizationMember.findOne({
    where: {
      id: memberId,
      organizationId,
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email'],
    }],
  });

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: 'Member not found',
    });
  }

  membership.role = role;
  await membership.save();

  res.json({
    success: true,
    message: 'Member role updated successfully',
    data: { membership },
  });
}));

// Remove member from organization
router.delete('/:organizationId/members/:memberId', authenticate, requireOrganizationAccess, requireOrganizationAdmin, asyncHandler(async (req, res) => {
  const { organizationId, memberId } = req.params;

  const membership = await OrganizationMember.findOne({
    where: {
      id: memberId,
      organizationId,
    },
  });

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: 'Member not found',
    });
  }

  await membership.destroy();

  res.json({
    success: true,
    message: 'Member removed successfully',
  });
}));

// Join organization with credentials
router.post('/join', authenticate, validate(schemas.joinOrganization), asyncHandler(async (req, res) => {
  const { slug, accessCode } = req.body;
  const userId = req.user.id;

  // Find organization by slug and access code
  const organization = await Organization.findOne({
    where: { 
      slug, 
      accessCode, 
      is_public: true 
    }
  });

  if (!organization) {
    return res.status(404).json({
      success: false,
      message: 'Organization not found or invalid access code',
    });
  }

  // Check if user is already a member
  const existingMember = await OrganizationMember.findOne({
    where: {
      user_id: userId,
      organization_id: organization.id,
    },
  });

  if (existingMember) {
    return res.status(400).json({
      success: false,
      message: 'You are already a member of this organization',
    });
  }

  // Create membership
  await OrganizationMember.create({
    userId,
    organizationId: organization.id,
    role: 'member',
    status: 'active',
    joinedAt: new Date(),
  });

  res.status(201).json({
    success: true,
    message: 'Successfully joined organization',
    data: {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    },
  });
}));

export default router;
