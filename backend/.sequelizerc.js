require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME    || 'wheelseye_db',
    host:     process.env.DB_HOST    || 'localhost',
    port:     process.env.DB_PORT    || 3306,
    dialect:  'mysql',
    migrationStorageTableName: 'sequelize_migrations',
    seederStorageTableName:    'sequelize_seeders',
    seederStorage:             'sequelize',
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    dialect:  'mysql',
    pool: { max: 20, min: 2, acquire: 30000, idle: 10000 },
    logging: false,
  },
};
