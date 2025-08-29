import { Op } from 'sequelize';
import sequelize from './config.js';
import {
  User,
  Organization,
  OrganizationMember,
  Service,
  Incident,
  IncidentUpdate,
  IncidentService,
} from '../models/index.js';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if demo user already exists
    let demoUser = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!demoUser) {
      // Create a demo user
      demoUser = await User.create({
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      });
      console.log('✅ Demo user created:', demoUser.email);
    } else {
      console.log('✅ Demo user already exists:', demoUser.email);
    }

    // Check if demo organization already exists
    let demoOrg = await Organization.findOne({ where: { slug: 'demo-company' } });
    
    if (!demoOrg) {
      // Create a demo organization
      demoOrg = await Organization.create({
        name: 'Demo Company',
        slug: 'demo-company',
        description: 'A demonstration status page for our services',
        websiteUrl: 'https://demo-company.com',
        accessCode: '1234567', // Fixed access code for demo
        ownerId: demoUser.id,
      });
      console.log('✅ Demo organization created:', demoOrg.name);
    } else {
      // Update existing demo organization with access code if it doesn't have one
      if (!demoOrg.accessCode) {
        await demoOrg.update({ accessCode: '1234567' });
        console.log('✅ Demo organization updated with access code');
      }
      console.log('✅ Demo organization already exists:', demoOrg.name);
    }

    // Add user as organization member (check if exists first)
    const existingMembership = await OrganizationMember.findOne({
      where: {
        userId: demoUser.id,
        organizationId: demoOrg.id,
      },
    });

    if (!existingMembership) {
      await OrganizationMember.create({
        userId: demoUser.id,
        organizationId: demoOrg.id,
        role: 'admin',
        status: 'active',
        joinedAt: new Date(),
      });
      console.log('✅ Demo organization membership created');
    } else {
      console.log('✅ Demo organization membership already exists');
    }

    // Create demo services (check if they exist first)
    let services = await Service.findAll({ where: { organizationId: demoOrg.id } });
    
    if (services.length === 0) {
      services = await Promise.all([
        Service.create({
          name: 'Website',
          description: 'Main company website',
          status: 'operational',
          url: 'https://demo-company.com',
          organizationId: demoOrg.id,
          order: 1,
        }),
        Service.create({
          name: 'API',
          description: 'REST API service',
          status: 'operational',
          url: 'https://api.demo-company.com',
          organizationId: demoOrg.id,
          order: 2,
        }),
        Service.create({
          name: 'Database',
          description: 'Primary database cluster',
          status: 'degraded_performance',
          organizationId: demoOrg.id,
          order: 3,
        }),
        Service.create({
          name: 'CDN',
          description: 'Content delivery network',
          status: 'operational',
          organizationId: demoOrg.id,
          order: 4,
        }),
      ]);
      console.log('✅ Demo services created:', services.length);
    } else {
      console.log('✅ Demo services already exist:', services.length);
    }

    // Create a demo incident
    const incident = await Incident.create({
      title: 'Database Performance Issues',
      description: 'We are experiencing slow response times with our database cluster.',
      status: 'monitoring',
      severity: 'minor',
      type: 'incident',
      organizationId: demoOrg.id,
      createdBy: demoUser.id,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    });

    console.log('✅ Demo incident created:', incident.title);

    // Associate incident with database service
    await IncidentService.create({
      incidentId: incident.id,
      serviceId: services[2].id, // Database service
    });

    // Add incident updates
    const updates = await Promise.all([
      IncidentUpdate.create({
        title: 'Investigating Database Issues',
        description: 'We have identified slow query performance and are investigating the root cause.',
        status: 'investigating',
        incidentId: incident.id,
      }),
      IncidentUpdate.create({
        title: 'Issue Identified',
        description: 'We found a problematic query causing database locks. Implementing a fix.',
        status: 'identified',
        incidentId: incident.id,
      }),
      IncidentUpdate.create({
        title: 'Fix Deployed, Monitoring',
        description: 'The fix has been deployed and we are monitoring the system performance.',
        status: 'monitoring',
        incidentId: incident.id,
      }),
    ]);

    console.log('✅ Demo incident updates created:', updates.length);

    // Create a scheduled maintenance
    const maintenance = await Incident.create({
      title: 'Scheduled Database Maintenance',
      description: 'Routine database maintenance and security updates.',
      status: 'monitoring',
      severity: 'minor',
      type: 'maintenance',
      organizationId: demoOrg.id,
      createdBy: demoUser.id,
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      scheduledUntil: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
    });

    console.log('✅ Demo maintenance created:', maintenance.title);

    // Associate maintenance with database service
    await IncidentService.create({
      incidentId: maintenance.id,
      serviceId: services[2].id, // Database service
    });

    // Fix missing access codes for existing organizations
    const orgsWithoutCodes = await Organization.findAll({
      where: {
        [Op.or]: [
          { accessCode: null },
          { accessCode: '' }
        ]
      }
    });

    if (orgsWithoutCodes.length > 0) {
      console.log(`\n🔧 Found ${orgsWithoutCodes.length} organizations without access codes. Adding codes...`);
      
      for (const org of orgsWithoutCodes) {
        let accessCode;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
          accessCode = Math.floor(1000000 + Math.random() * 9000000).toString();
          const existingAccessCode = await Organization.findOne({ where: { accessCode } });
          if (!existingAccessCode) {
            isUnique = true;
          }
          attempts++;
        }
        
        if (isUnique) {
          await org.update({ accessCode });
          console.log(`  ✅ Added access code ${accessCode} to ${org.name}`);
        }
      }
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📋 Demo Data Summary:');
    console.log(`- User: ${demoUser.email} (password: password123)`);
    console.log(`- Organization: ${demoOrg.name} (${demoOrg.slug})`);
    console.log(`- Services: ${services.length}`);
    console.log(`- Incidents: 2 (1 active incident, 1 scheduled maintenance)`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}

export default seed;
