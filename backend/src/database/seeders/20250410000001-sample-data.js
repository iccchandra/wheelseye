'use strict';
const { v4: uuidv4 } = require('uuid');

const vehicleId1 = uuidv4();
const vehicleId2 = uuidv4();
const vehicleId3 = uuidv4();
const driverId1  = uuidv4();
const driverId2  = uuidv4();
const driverId3  = uuidv4();
const ship1      = uuidv4();
const ship2      = uuidv4();
const ship3      = uuidv4();
const now        = new Date();

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('vehicles', [
      { id: vehicleId1, regNumber: 'TS 09 AB 1234', type: 'CONTAINER', status: 'ON_TRIP', capacityMT: 20, make: 'Tata', model: 'Prima', year: 2021, ownerName: 'Suresh Logistics', ownerPhone: '9876543210', isOwned: false, gpsEnabled: true, currentLat: 23.2599, currentLng: 77.4126, lastPingAt: now, lastSpeed: 72, rcExpiry: new Date('2026-06-01'), insuranceExpiry: new Date('2026-01-01'), createdAt: now, updatedAt: now },
      { id: vehicleId2, regNumber: 'MH 12 CD 5678', type: 'OPEN',      status: 'ON_TRIP', capacityMT: 15, make: 'Ashok Leyland', model: 'U-TRUCK', year: 2020, ownerName: 'Patil Transport', ownerPhone: '9123456780', isOwned: false, gpsEnabled: true, currentLat: 19.9975, currentLng: 73.7898, lastPingAt: now, lastSpeed: 0,  rcExpiry: new Date('2025-12-01'), insuranceExpiry: new Date('2025-11-01'), createdAt: now, updatedAt: now },
      { id: vehicleId3, regNumber: 'DL 05 EF 9012', type: 'TRAILER',   status: 'ON_TRIP', capacityMT: 30, make: 'Eicher', model: 'Pro 6031', year: 2022, ownerName: 'Singh Carriers', ownerPhone: '9012345678', isOwned: true,  gpsEnabled: true, currentLat: 28.7041, currentLng: 77.1025, lastPingAt: now, lastSpeed: 84, rcExpiry: new Date('2027-03-01'), insuranceExpiry: new Date('2026-08-01'), createdAt: now, updatedAt: now },
    ]);

    await queryInterface.bulkInsert('drivers', [
      { id: driverId1, name: 'Raju Yadav',      phone: '9811122233', status: 'ON_TRIP', licenceNumber: 'UP14 20180012345', licenceExpiry: new Date('2027-01-01'), safetyScore: 4.5, totalTrips: 142, totalKm: 89000, createdAt: now, updatedAt: now },
      { id: driverId2, name: 'Suresh Patil',    phone: '9922233344', status: 'ON_TRIP', licenceNumber: 'MH04 20190023456', licenceExpiry: new Date('2026-06-01'), safetyScore: 3.8, totalTrips: 87,  totalKm: 54000, createdAt: now, updatedAt: now },
      { id: driverId3, name: 'Balvinder Singh', phone: '9733344455', status: 'ON_TRIP', licenceNumber: 'DL01 20210034567', licenceExpiry: new Date('2028-03-01'), safetyScore: 4.9, totalTrips: 213, totalKm: 145000, createdAt: now, updatedAt: now },
    ]);

    const pickup1 = new Date(now.getTime() - 14 * 3600000);
    await queryInterface.bulkInsert('shipments', [
      { id: ship1, trackingNumber: 'TRK-2025-08471', status: 'IN_TRANSIT', origin: 'Hyderabad', originLat: 17.3850, originLng: 78.4867, destination: 'Delhi', destinationLat: 28.6139, destinationLng: 77.2090, waypoints: JSON.stringify([{ lat: 23.2599, lng: 77.4126, label: 'Bhopal' }, { lat: 26.4499, lng: 80.3319, label: 'Kanpur' }]), cargoDescription: 'Electronics', weightMT: 12, truckType: 'CONTAINER', scheduledPickup: pickup1, actualPickup: pickup1, estimatedDelivery: new Date(now.getTime() + 18 * 3600000), quotedAmount: 48000, finalAmount: 48000, insuranceEnabled: true, insuranceCoverage: 2000000, shipperPhone: '9876543210', consigneeName: 'TechCorp Delhi', consigneePhone: '9111222333', vehicleId: vehicleId1, driverId: driverId1, createdAt: now, updatedAt: now },
      { id: ship2, trackingNumber: 'TRK-2025-08472', status: 'DELAYED',    origin: 'Mumbai',    originLat: 19.0760, originLng: 72.8777, destination: 'Lucknow', destinationLat: 26.8467, destinationLng: 80.9462, waypoints: JSON.stringify([{ lat: 21.1702, lng: 72.8311, label: 'Surat' }, { lat: 22.7196, lng: 75.8577, label: 'Indore' }]), cargoDescription: 'FMCG goods', weightMT: 8, truckType: 'OPEN', scheduledPickup: new Date(now.getTime() - 24 * 3600000), actualPickup: new Date(now.getTime() - 22 * 3600000), estimatedDelivery: new Date(now.getTime() + 14 * 3600000), quotedAmount: 35000, finalAmount: 35000, shipperPhone: '9988776655', consigneeName: 'Lucknow Distributors', consigneePhone: '9444555666', vehicleId: vehicleId2, driverId: driverId2, createdAt: now, updatedAt: now },
      { id: ship3, trackingNumber: 'TRK-2025-08473', status: 'IN_TRANSIT', origin: 'Delhi',     originLat: 28.6139, originLng: 77.2090, destination: 'Chandigarh', destinationLat: 30.7333, destinationLng: 76.7794, waypoints: JSON.stringify([{ lat: 29.3909, lng: 76.9635, label: 'Panipat' }]), cargoDescription: 'Pharmaceuticals', weightMT: 5, truckType: 'TRAILER', scheduledPickup: new Date(now.getTime() - 6 * 3600000), actualPickup: new Date(now.getTime() - 6 * 3600000), estimatedDelivery: new Date(now.getTime() + 2 * 3600000), quotedAmount: 18000, finalAmount: 18000, insuranceEnabled: true, insuranceCoverage: 5000000, shipperPhone: '9666777888', consigneeName: 'PharmaPlus Chandigarh', consigneePhone: '9222333444', vehicleId: vehicleId3, driverId: driverId3, createdAt: now, updatedAt: now },
    ]);

    await queryInterface.bulkInsert('geofences', [
      { id: uuidv4(), name: 'Hyderabad Warehouse', type: 'circle', zoneType: 'pickup', centerLat: 17.3850, centerLng: 78.4867, radiusMeters: 2000, active: true, activeVehicles: JSON.stringify([]), createdAt: now, updatedAt: now },
      { id: uuidv4(), name: 'Delhi Distribution Center', type: 'circle', zoneType: 'delivery', centerLat: 28.6139, centerLng: 77.2090, radiusMeters: 3000, active: true, activeVehicles: JSON.stringify([]), createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('geofences', null, {});
    await queryInterface.bulkDelete('shipments', null, {});
    await queryInterface.bulkDelete('drivers', null, {});
    await queryInterface.bulkDelete('vehicles', null, {});
  },
};
