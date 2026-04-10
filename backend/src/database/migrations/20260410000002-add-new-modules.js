'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // Vehicle Groups
    await queryInterface.createTable('vehicle_groups', {
      id:          { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      name:        { type: Sequelize.STRING, unique: true, allowNull: false },
      description: { type: Sequelize.TEXT },
      createdAt:   { type: Sequelize.DATE, allowNull: false },
      updatedAt:   { type: Sequelize.DATE, allowNull: false },
    });

    // Add groupId to vehicles
    await queryInterface.addColumn('vehicles', 'groupId', {
      type: Sequelize.UUID,
      references: { model: 'vehicle_groups', key: 'id' },
      after: 'regNumber',
    });

    // Customers
    await queryInterface.createTable('customers', {
      id:        { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      name:      { type: Sequelize.STRING, allowNull: false },
      email:     { type: Sequelize.STRING, unique: true },
      phone:     { type: Sequelize.STRING, allowNull: false },
      address:   { type: Sequelize.TEXT },
      gstin:     { type: Sequelize.STRING },
      password:  { type: Sequelize.STRING },
      isActive:  { type: Sequelize.BOOLEAN, defaultValue: true },
      metadata:  { type: Sequelize.JSON, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      deletedAt: { type: Sequelize.DATE },
    });

    // Fuel Logs
    await queryInterface.createTable('fuel_logs', {
      id:                { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      vehicleId:         { type: Sequelize.UUID, allowNull: false, references: { model: 'vehicles', key: 'id' } },
      driverId:          { type: Sequelize.UUID, references: { model: 'drivers', key: 'id' } },
      quantity:          { type: Sequelize.FLOAT, allowNull: false },
      pricePerUnit:      { type: Sequelize.FLOAT, allowNull: false },
      totalAmount:       { type: Sequelize.FLOAT, allowNull: false },
      odometerReading:   { type: Sequelize.FLOAT },
      fillDate:          { type: Sequelize.DATE, allowNull: false },
      fuelType:          { type: Sequelize.STRING },
      station:           { type: Sequelize.STRING },
      comments:          { type: Sequelize.TEXT },
      createExpenseEntry:{ type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt:         { type: Sequelize.DATE, allowNull: false },
      updatedAt:         { type: Sequelize.DATE, allowNull: false },
      deletedAt:         { type: Sequelize.DATE },
    });

    // Income & Expenses
    await queryInterface.createTable('income_expenses', {
      id:            { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      vehicleId:     { type: Sequelize.UUID, references: { model: 'vehicles', key: 'id' } },
      type:          { type: Sequelize.ENUM('INCOME', 'EXPENSE'), allowNull: false },
      amount:        { type: Sequelize.FLOAT, allowNull: false },
      date:          { type: Sequelize.DATE, allowNull: false },
      description:   { type: Sequelize.STRING, allowNull: false },
      category:      { type: Sequelize.STRING },
      referenceId:   { type: Sequelize.STRING },
      referenceType: { type: Sequelize.STRING },
      createdAt:     { type: Sequelize.DATE, allowNull: false },
      updatedAt:     { type: Sequelize.DATE, allowNull: false },
      deletedAt:     { type: Sequelize.DATE },
    });

    // Reminders
    await queryInterface.createTable('reminders', {
      id:          { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      vehicleId:   { type: Sequelize.UUID, allowNull: false, references: { model: 'vehicles', key: 'id' } },
      dueDate:     { type: Sequelize.DATE, allowNull: false },
      title:       { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      category:    { type: Sequelize.STRING },
      isRead:      { type: Sequelize.BOOLEAN, defaultValue: false },
      readAt:      { type: Sequelize.DATE },
      createdAt:   { type: Sequelize.DATE, allowNull: false },
      updatedAt:   { type: Sequelize.DATE, allowNull: false },
    });

    // App Settings (key-value store)
    await queryInterface.createTable('app_settings', {
      id:        { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      key:       { type: Sequelize.STRING, unique: true, allowNull: false },
      value:     { type: Sequelize.TEXT },
      group:     { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Email Templates
    await queryInterface.createTable('email_templates', {
      id:           { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      name:         { type: Sequelize.STRING, unique: true, allowNull: false },
      subject:      { type: Sequelize.STRING },
      body:         { type: Sequelize.TEXT },
      placeholders: { type: Sequelize.JSON, defaultValue: [] },
      createdAt:    { type: Sequelize.DATE, allowNull: false },
      updatedAt:    { type: Sequelize.DATE, allowNull: false },
    });

    // Shipment Payments
    await queryInterface.createTable('shipment_payments', {
      id:              { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      shipmentId:      { type: Sequelize.UUID, allowNull: false, references: { model: 'shipments', key: 'id' } },
      amount:          { type: Sequelize.FLOAT, allowNull: false },
      paymentMethod:   { type: Sequelize.STRING },
      referenceNumber: { type: Sequelize.STRING },
      notes:           { type: Sequelize.TEXT },
      paidAt:          { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      createdAt:       { type: Sequelize.DATE, allowNull: false },
      updatedAt:       { type: Sequelize.DATE, allowNull: false },
    });

    // Add advanced driver fields
    const driverColumns = {
      dateOfBirth: Sequelize.DATE, gender: Sequelize.STRING, bloodGroup: Sequelize.STRING,
      email: Sequelize.STRING, nationality: Sequelize.STRING, education: Sequelize.STRING,
      addressAsPerLicence: Sequelize.STRING, addressAsPerAadhaar: Sequelize.STRING,
      emergencyContactName: Sequelize.STRING, emergencyContactRelation: Sequelize.STRING,
      badgeNumber: Sequelize.STRING, licenceRefNumber: Sequelize.STRING,
      licenceFirstIssueDate: Sequelize.DATE, licencingAuthority: Sequelize.STRING,
      transportLicenceType: Sequelize.STRING, transportLicenceExpiry: Sequelize.DATE,
      nonTransportLicenceType: Sequelize.STRING, nonTransportLicenceExpiry: Sequelize.DATE,
      dateOfJoining: Sequelize.DATE, totalExperience: Sequelize.FLOAT, driverType: Sequelize.STRING,
    };
    for (const [col, type] of Object.entries(driverColumns)) {
      await queryInterface.addColumn('drivers', col, { type });
    }

    // Add permissions and companyAddress to users
    await queryInterface.addColumn('users', 'permissions', { type: Sequelize.JSON, defaultValue: {} });
    await queryInterface.addColumn('users', 'companyAddress', { type: Sequelize.TEXT });

    // Indexes
    await queryInterface.addIndex('fuel_logs', ['vehicleId']);
    await queryInterface.addIndex('fuel_logs', ['fillDate']);
    await queryInterface.addIndex('income_expenses', ['vehicleId']);
    await queryInterface.addIndex('income_expenses', ['type']);
    await queryInterface.addIndex('income_expenses', ['date']);
    await queryInterface.addIndex('reminders', ['vehicleId']);
    await queryInterface.addIndex('reminders', ['dueDate']);
    await queryInterface.addIndex('shipment_payments', ['shipmentId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('shipment_payments');
    await queryInterface.dropTable('email_templates');
    await queryInterface.dropTable('app_settings');
    await queryInterface.dropTable('reminders');
    await queryInterface.dropTable('income_expenses');
    await queryInterface.dropTable('fuel_logs');
    await queryInterface.dropTable('customers');
    await queryInterface.removeColumn('vehicles', 'groupId');
    await queryInterface.dropTable('vehicle_groups');
    await queryInterface.removeColumn('users', 'permissions');
    await queryInterface.removeColumn('users', 'companyAddress');
  },
};
