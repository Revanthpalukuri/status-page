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

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');

    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables synchronized successfully.');

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export default migrate;
