// MongoDB initialization script
db = db.getSiblingDB('smart_error_tracker');

db.createCollection('domains');
db.createCollection('errors');
db.createCollection('error_groups');

db.domains.createIndex({ uuid: 1 }, { unique: true });
db.domains.createIndex({ domain: 1 });
db.errors.createIndex({ domainId: 1 });
db.errors.createIndex({ groupId: 1 });
db.errors.createIndex({ createdAt: -1 });
db.errors.createIndex({ fingerprint: 1 });
db.error_groups.createIndex({ fingerprint: 1 }, { unique: true });
db.error_groups.createIndex({ domainId: 1 });

print('Database initialized successfully');
