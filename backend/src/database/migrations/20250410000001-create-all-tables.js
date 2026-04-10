'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('users', {
      id:           { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      phone:        { type: Sequelize.STRING(15), unique: true, allowNull: false },
      email:        { type: Sequelize.STRING, unique: true, allowNull: true },
      name:         { type: Sequelize.STRING },
      role:         { type: Sequelize.ENUM('ADMIN','OPS','SHIPPER','TRANSPORTER'), defaultValue: 'SHIPPER' },
      isActive:     { type: Sequelize.BOOLEAN, defaultValue: true },
      otpCode:      { type: Sequelize.STRING(6) },
      otpExpiresAt: { type: Sequelize.DATE },
      lastLoginAt:  { type: Sequelize.DATE },
      createdAt:    { type: Sequelize.DATE, allowNull: false },
      updatedAt:    { type: Sequelize.DATE, allowNull: false },
      deletedAt:    { type: Sequelize.DATE },
    });

    await queryInterface.createTable('vehicles', {
      id:              { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      regNumber:       { type: Sequelize.STRING, unique: true, allowNull: false },
      type:            { type: Sequelize.ENUM('OPEN','CONTAINER','TRAILER','FLATBED','MINI','REFRIGERATED') },
      status:          { type: Sequelize.ENUM('AVAILABLE','ON_TRIP','MAINTENANCE','INACTIVE'), defaultValue: 'AVAILABLE' },
      capacityMT:      { type: Sequelize.FLOAT },
      make:            { type: Sequelize.STRING },
      model:           { type: Sequelize.STRING },
      year:            { type: Sequelize.INTEGER },
      ownerName:       { type: Sequelize.STRING },
      ownerPhone:      { type: Sequelize.STRING },
      isOwned:         { type: Sequelize.BOOLEAN, defaultValue: false },
      rcNumber:        { type: Sequelize.STRING },
      rcExpiry:        { type: Sequelize.DATE },
      insuranceExpiry: { type: Sequelize.DATE },
      pollutionExpiry: { type: Sequelize.DATE },
      fitnessExpiry:   { type: Sequelize.DATE },
      permitExpiry:    { type: Sequelize.DATE },
      fastTagId:       { type: Sequelize.STRING },
      gpsDeviceId:     { type: Sequelize.STRING },
      gpsEnabled:      { type: Sequelize.BOOLEAN, defaultValue: false },
      currentLat:      { type: Sequelize.FLOAT },
      currentLng:      { type: Sequelize.FLOAT },
      lastPingAt:      { type: Sequelize.DATE },
      lastSpeed:       { type: Sequelize.FLOAT },
      createdAt:       { type: Sequelize.DATE, allowNull: false },
      updatedAt:       { type: Sequelize.DATE, allowNull: false },
      deletedAt:       { type: Sequelize.DATE },
    });

    await queryInterface.createTable('drivers', {
      id:               { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      name:             { type: Sequelize.STRING, allowNull: false },
      phone:            { type: Sequelize.STRING, unique: true, allowNull: false },
      status:           { type: Sequelize.ENUM('ACTIVE','ON_TRIP','INACTIVE','BLACKLISTED'), defaultValue: 'ACTIVE' },
      licenceNumber:    { type: Sequelize.STRING },
      licenceExpiry:    { type: Sequelize.DATE },
      licenceType:      { type: Sequelize.STRING },
      aadhaarNumber:    { type: Sequelize.STRING },
      photoUrl:         { type: Sequelize.STRING },
      licenceImageUrl:  { type: Sequelize.STRING },
      aadhaarImageUrl:  { type: Sequelize.STRING },
      safetyScore:      { type: Sequelize.FLOAT, defaultValue: 5.0 },
      totalTrips:       { type: Sequelize.INTEGER, defaultValue: 0 },
      totalKm:          { type: Sequelize.INTEGER, defaultValue: 0 },
      lastTripAt:       { type: Sequelize.DATE },
      address:          { type: Sequelize.TEXT },
      emergencyContact: { type: Sequelize.STRING },
      blacklistReason:  { type: Sequelize.TEXT },
      metadata:         { type: Sequelize.JSON, defaultValue: {} },
      createdAt:        { type: Sequelize.DATE, allowNull: false },
      updatedAt:        { type: Sequelize.DATE, allowNull: false },
      deletedAt:        { type: Sequelize.DATE },
    });

    await queryInterface.createTable('shipments', {
      id:                { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      trackingNumber:    { type: Sequelize.STRING, unique: true, allowNull: false },
      status:            { type: Sequelize.ENUM('INQUIRY','QUOTED','BOOKED','DISPATCHED','IN_TRANSIT','DELAYED','DELIVERED','CANCELLED'), defaultValue: 'INQUIRY' },
      origin:            { type: Sequelize.STRING, allowNull: false },
      originLat:         { type: Sequelize.FLOAT },
      originLng:         { type: Sequelize.FLOAT },
      destination:       { type: Sequelize.STRING, allowNull: false },
      destinationLat:    { type: Sequelize.FLOAT },
      destinationLng:    { type: Sequelize.FLOAT },
      waypoints:         { type: Sequelize.JSON, defaultValue: [] },
      cargoDescription:  { type: Sequelize.STRING },
      weightMT:          { type: Sequelize.FLOAT },
      truckType:         { type: Sequelize.STRING },
      scheduledPickup:   { type: Sequelize.DATE },
      actualPickup:      { type: Sequelize.DATE },
      estimatedDelivery: { type: Sequelize.DATE },
      actualDelivery:    { type: Sequelize.DATE },
      quotedAmount:      { type: Sequelize.FLOAT },
      finalAmount:       { type: Sequelize.FLOAT },
      insuranceEnabled:  { type: Sequelize.BOOLEAN, defaultValue: false },
      insuranceAmount:   { type: Sequelize.FLOAT },
      insuranceCoverage: { type: Sequelize.FLOAT },
      podImageUrl:       { type: Sequelize.STRING },
      podSignatureUrl:   { type: Sequelize.STRING },
      podCapturedAt:     { type: Sequelize.DATE },
      shipperPhone:      { type: Sequelize.STRING },
      consigneePhone:    { type: Sequelize.STRING },
      consigneeName:     { type: Sequelize.STRING },
      internalNotes:     { type: Sequelize.TEXT },
      metadata:          { type: Sequelize.JSON, defaultValue: {} },
      vehicleId:         { type: Sequelize.UUID, references: { model: 'vehicles', key: 'id' } },
      driverId:          { type: Sequelize.UUID, references: { model: 'drivers', key: 'id' } },
      createdAt:         { type: Sequelize.DATE, allowNull: false },
      updatedAt:         { type: Sequelize.DATE, allowNull: false },
      deletedAt:         { type: Sequelize.DATE },
    });

    await queryInterface.createTable('gps_events', {
      id:          { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      shipmentId:  { type: Sequelize.UUID, references: { model: 'shipments', key: 'id' } },
      vehicleId:   { type: Sequelize.UUID },
      lat:         { type: Sequelize.FLOAT, allowNull: false },
      lng:         { type: Sequelize.FLOAT, allowNull: false },
      speed:       { type: Sequelize.FLOAT },
      heading:     { type: Sequelize.FLOAT },
      altitude:    { type: Sequelize.FLOAT },
      accuracy:    { type: Sequelize.FLOAT },
      source:      { type: Sequelize.ENUM('DRIVER_APP','HARDWARE_GPS','MANUAL'), defaultValue: 'DRIVER_APP' },
      recordedAt:  { type: Sequelize.DATE, allowNull: false },
      createdAt:   { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('geofences', {
      id:            { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      name:          { type: Sequelize.STRING, allowNull: false },
      type:          { type: Sequelize.ENUM('circle','polygon'), allowNull: false },
      zoneType:      { type: Sequelize.ENUM('pickup','delivery','restricted','checkpoint'), defaultValue: 'checkpoint' },
      centerLat:     { type: Sequelize.FLOAT },
      centerLng:     { type: Sequelize.FLOAT },
      radiusMeters:  { type: Sequelize.FLOAT },
      polygonPoints: { type: Sequelize.JSON },
      active:        { type: Sequelize.BOOLEAN, defaultValue: true },
      activeVehicles:{ type: Sequelize.JSON, defaultValue: [] },
      createdAt:     { type: Sequelize.DATE, allowNull: false },
      updatedAt:     { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('alerts', {
      id:             { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      shipmentId:     { type: Sequelize.UUID, references: { model: 'shipments', key: 'id' } },
      vehicleId:      { type: Sequelize.STRING },
      type:           { type: Sequelize.ENUM('ROUTE_DEVIATION','GEOFENCE_ENTRY','GEOFENCE_EXIT','OVERSPEED','IDLE','NIGHT_DRIVING','DOCUMENT_EXPIRY','DELIVERY_DELAY','POD_UPLOADED','TRIP_STARTED','TRIP_COMPLETED') },
      severity:       { type: Sequelize.ENUM('INFO','WARNING','CRITICAL'), defaultValue: 'WARNING' },
      message:        { type: Sequelize.TEXT },
      lat:            { type: Sequelize.FLOAT },
      lng:            { type: Sequelize.FLOAT },
      acknowledged:   { type: Sequelize.BOOLEAN, defaultValue: false },
      acknowledgedAt: { type: Sequelize.DATE },
      acknowledgedBy: { type: Sequelize.STRING },
      metadata:       { type: Sequelize.JSON, defaultValue: {} },
      createdAt:      { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('invoices', {
      id:                { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      invoiceNumber:     { type: Sequelize.STRING, unique: true },
      shipmentId:        { type: Sequelize.UUID, references: { model: 'shipments', key: 'id' } },
      status:            { type: Sequelize.ENUM('DRAFT','SENT','PAID','OVERDUE','CANCELLED'), defaultValue: 'DRAFT' },
      shipperName:       { type: Sequelize.STRING },
      shipperGstin:      { type: Sequelize.STRING },
      shipperAddress:    { type: Sequelize.TEXT },
      consigneeName:     { type: Sequelize.STRING },
      consigneeGstin:    { type: Sequelize.STRING },
      consigneeAddress:  { type: Sequelize.TEXT },
      freightAmount:     { type: Sequelize.FLOAT },
      detentionAmount:   { type: Sequelize.FLOAT, defaultValue: 0 },
      tollAmount:        { type: Sequelize.FLOAT, defaultValue: 0 },
      insuranceAmount:   { type: Sequelize.FLOAT, defaultValue: 0 },
      otherCharges:      { type: Sequelize.FLOAT, defaultValue: 0 },
      subtotal:          { type: Sequelize.FLOAT },
      gstRate:           { type: Sequelize.FLOAT, defaultValue: 5 },
      cgst:              { type: Sequelize.STRING },
      sgst:              { type: Sequelize.STRING },
      igst:              { type: Sequelize.STRING },
      totalAmount:       { type: Sequelize.FLOAT },
      hsnCode:           { type: Sequelize.STRING },
      razorpayOrderId:   { type: Sequelize.STRING },
      razorpayPaymentId: { type: Sequelize.STRING },
      paidAt:            { type: Sequelize.DATE },
      dueDate:           { type: Sequelize.DATE },
      invoiceDate:       { type: Sequelize.DATE },
      pdfUrl:            { type: Sequelize.STRING },
      createdAt:         { type: Sequelize.DATE, allowNull: false },
      updatedAt:         { type: Sequelize.DATE, allowNull: false },
      deletedAt:         { type: Sequelize.DATE },
    });

    await queryInterface.addIndex('shipments', ['status']);
    await queryInterface.addIndex('shipments', ['vehicleId']);
    await queryInterface.addIndex('shipments', ['trackingNumber']);
    await queryInterface.addIndex('gps_events', ['shipmentId', 'recordedAt']);
    await queryInterface.addIndex('gps_events', ['vehicleId', 'recordedAt']);
    await queryInterface.addIndex('alerts', ['shipmentId']);
    await queryInterface.addIndex('alerts', ['acknowledged']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invoices');
    await queryInterface.dropTable('alerts');
    await queryInterface.dropTable('gps_events');
    await queryInterface.dropTable('geofences');
    await queryInterface.dropTable('shipments');
    await queryInterface.dropTable('drivers');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('vehicles');
  },
};
