import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { User, Organization, OrganizationMember } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

export const requireOrganizationAccess = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user.id;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    // Check if user is the organization owner
    const organization = await Organization.findOne({
      where: {
        id: organizationId,
        ownerId: userId,
      },
    });

    if (organization) {
      req.organization = organization;
      req.userRole = 'admin';
      return next();
    }

    // Check if user is a member of the organization
    const membership = await OrganizationMember.findOne({
      where: {
        userId,
        organizationId,
        status: 'active',
      },
      include: [{
        model: Organization,
        as: 'organization',
      }],
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access to this organization is denied',
      });
    }

    req.organization = membership.organization;
    req.userRole = membership.role;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking organization access',
      error: error.message,
    });
  }
};

export const requireOrganizationAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Organization admin privileges required',
    });
  }
  next();
};
