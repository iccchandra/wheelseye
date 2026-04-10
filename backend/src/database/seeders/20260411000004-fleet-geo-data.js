'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Add 12 more vehicles with GPS positions across India
    const newVehicles = [
      { id: uuidv4(), regNumber: 'KA 01 MN 3456', type: 'CONTAINER', status: 'ON_TRIP', capacityMT: 18, make: 'Tata', model: 'Signa', year: 2023, ownerName: 'Krishna Transport', ownerPhone: '9845123456', isOwned: false, gpsEnabled: true, currentLat: 12.9716, currentLng: 77.5946, lastPingAt: now, lastSpeed: 62, rcExpiry: new Date('2027-03-15'), insuranceExpiry: new Date('2026-09-01'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'TN 07 BX 8901', type: 'OPEN', status: 'ON_TRIP', capacityMT: 12, make: 'Ashok Leyland', model: 'Ecomet', year: 2022, ownerName: 'Murugan Logistics', ownerPhone: '9876012345', isOwned: true, gpsEnabled: true, currentLat: 13.0827, currentLng: 80.2707, lastPingAt: now, lastSpeed: 45, rcExpiry: new Date('2026-11-20'), insuranceExpiry: new Date('2026-05-10'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'GJ 06 RT 2345', type: 'TRAILER', status: 'ON_TRIP', capacityMT: 28, make: 'Tata', model: 'Prima', year: 2021, ownerName: 'Patel Carriers', ownerPhone: '9898765432', isOwned: false, gpsEnabled: true, currentLat: 23.0225, currentLng: 72.5714, lastPingAt: now, lastSpeed: 78, rcExpiry: new Date('2027-06-01'), insuranceExpiry: new Date('2026-12-15'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'RJ 14 GH 6789', type: 'FLATBED', status: 'AVAILABLE', capacityMT: 22, make: 'Eicher', model: 'Pro 6037', year: 2023, ownerName: 'Rajput Transport', ownerPhone: '9414567890', isOwned: true, gpsEnabled: true, currentLat: 26.9124, currentLng: 75.7873, lastPingAt: new Date(now.getTime() - 3600000), lastSpeed: 0, rcExpiry: new Date('2027-01-10'), insuranceExpiry: new Date('2026-07-20'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'UP 32 AK 4567', type: 'CONTAINER', status: 'ON_TRIP', capacityMT: 20, make: 'BharatBenz', model: '1617R', year: 2022, ownerName: 'Agarwal Fleet', ownerPhone: '9452345678', isOwned: false, gpsEnabled: true, currentLat: 26.8467, currentLng: 80.9462, lastPingAt: now, lastSpeed: 55, rcExpiry: new Date('2026-08-25'), insuranceExpiry: new Date('2026-04-30'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'WB 26 DF 1234', type: 'OPEN', status: 'ON_TRIP', capacityMT: 10, make: 'Tata', model: 'Ultra', year: 2023, ownerName: 'Kolkata Movers', ownerPhone: '9830456789', isOwned: true, gpsEnabled: true, currentLat: 22.5726, currentLng: 88.3639, lastPingAt: now, lastSpeed: 38, rcExpiry: new Date('2027-05-01'), insuranceExpiry: new Date('2027-01-15'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'MP 09 JK 5678', type: 'REFRIGERATED', status: 'ON_TRIP', capacityMT: 15, make: 'Mahindra', model: 'Blazo', year: 2022, ownerName: 'ColdChain India', ownerPhone: '9425678901', isOwned: false, gpsEnabled: true, currentLat: 22.7196, currentLng: 75.8577, lastPingAt: now, lastSpeed: 68, rcExpiry: new Date('2026-10-12'), insuranceExpiry: new Date('2026-06-30'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'AP 31 PQ 9012', type: 'CONTAINER', status: 'MAINTENANCE', capacityMT: 25, make: 'Tata', model: 'LPT 3118', year: 2021, ownerName: 'Vizag Freight', ownerPhone: '9848901234', isOwned: true, gpsEnabled: true, currentLat: 17.6868, currentLng: 83.2185, lastPingAt: new Date(now.getTime() - 7200000), lastSpeed: 0, rcExpiry: new Date('2026-07-18'), insuranceExpiry: new Date('2026-03-25'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'KL 10 XY 3456', type: 'MINI', status: 'ON_TRIP', capacityMT: 5, make: 'Tata', model: 'Ace Gold', year: 2023, ownerName: 'Kerala Express', ownerPhone: '9847012345', isOwned: false, gpsEnabled: true, currentLat: 9.9312, currentLng: 76.2673, lastPingAt: now, lastSpeed: 42, rcExpiry: new Date('2027-04-22'), insuranceExpiry: new Date('2027-02-10'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'HR 26 ZZ 7890', type: 'TRAILER', status: 'ON_TRIP', capacityMT: 30, make: 'Ashok Leyland', model: 'Captain', year: 2022, ownerName: 'Haryana Transport Co', ownerPhone: '9812345670', isOwned: true, gpsEnabled: true, currentLat: 29.0588, currentLng: 76.0856, lastPingAt: now, lastSpeed: 82, rcExpiry: new Date('2027-02-28'), insuranceExpiry: new Date('2026-08-15'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'CG 04 AB 2345', type: 'OPEN', status: 'ON_TRIP', capacityMT: 16, make: 'Eicher', model: 'Pro 3019', year: 2023, ownerName: 'Raipur Cargo', ownerPhone: '9977123456', isOwned: false, gpsEnabled: true, currentLat: 21.2514, currentLng: 81.6296, lastPingAt: now, lastSpeed: 57, rcExpiry: new Date('2027-07-05'), insuranceExpiry: new Date('2027-03-20'), createdAt: now, updatedAt: now },
      { id: uuidv4(), regNumber: 'PB 10 CD 6789', type: 'CONTAINER', status: 'AVAILABLE', capacityMT: 20, make: 'Tata', model: 'Signa 4825', year: 2022, ownerName: 'Punjab Roadways', ownerPhone: '9815678901', isOwned: true, gpsEnabled: true, currentLat: 30.7333, currentLng: 76.7794, lastPingAt: new Date(now.getTime() - 1800000), lastSpeed: 0, rcExpiry: new Date('2026-12-01'), insuranceExpiry: new Date('2026-10-10'), createdAt: now, updatedAt: now },
    ];

    await queryInterface.bulkInsert('vehicles', newVehicles);

    // Add 8 more drivers
    const newDrivers = [
      { id: uuidv4(), name: 'Venkatesh R', phone: '9845111222', status: 'ON_TRIP', licenceNumber: 'KA05 20200045678', licenceExpiry: new Date('2027-08-01'), safetyScore: 4.7, totalTrips: 198, totalKm: 125000, createdAt: now, updatedAt: now },
      { id: uuidv4(), name: 'Arun Kumar S', phone: '9876333444', status: 'ON_TRIP', licenceNumber: 'TN10 20190056789', licenceExpiry: new Date('2026-11-15'), safetyScore: 4.2, totalTrips: 112, totalKm: 78000, createdAt: now, updatedAt: now },
      { id: uuidv4(), name: 'Hitesh Patel', phone: '9898555666', status: 'ON_TRIP', licenceNumber: 'GJ01 20210067890', licenceExpiry: new Date('2028-01-20'), safetyScore: 4.8, totalTrips: 256, totalKm: 168000, createdAt: now, updatedAt: now },
      { id: uuidv4(), name: 'Mohammad Irfan', phone: '9452777888', status: 'ON_TRIP', licenceNumber: 'UP14 20180078901', licenceExpiry: new Date('2026-05-30'), safetyScore: 3.9, totalTrips: 89, totalKm: 52000, createdAt: now, updatedAt: now },
      { id: uuidv4(), name: 'Pranab Das', phone: '9830999000', status: 'ON_TRIP', licenceNumber: 'WB08 20200089012', licenceExpiry: new Date('2027-03-10'), safetyScore: 4.4, totalTrips: 134, totalKm: 91000, createdAt: now, updatedAt: now },
      { id: uuidv4(), name: 'Deepak Verma', phone: '9425111333', status: 'ON_TRIP', licenceNumber: 'MP09 20190090123', licenceExpiry: new Date('2026-09-25'), safetyScore: 4.6, totalTrips: 178, totalKm: 112000, createdAt: now, updatedAt: now },
      { id: uuidv4(), name: 'Pradeep Nair', phone: '9847222444', status: 'ON_TRIP', licenceNumber: 'KL03 20210001234', licenceExpiry: new Date('2028-02-28'), safetyScore: 4.9, totalTrips: 67, totalKm: 38000, createdAt: now, updatedAt: now },
      { id: uuidv4(), name: 'Gurpreet Singh', phone: '9812333555', status: 'ON_TRIP', licenceNumber: 'PB02 20200012345', licenceExpiry: new Date('2027-06-15'), safetyScore: 4.3, totalTrips: 201, totalKm: 142000, createdAt: now, updatedAt: now },
    ];

    await queryInterface.bulkInsert('drivers', newDrivers);

    // Now seed GPS events for ALL vehicles for today
    const allVehicles = await queryInterface.sequelize.query(
      'SELECT id, regNumber, currentLat, currentLng FROM vehicles WHERE currentLat IS NOT NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const events = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const v of allVehicles) {
      // Generate 15-25 GPS points per vehicle through the day
      const numPoints = 15 + Math.floor(Math.random() * 10);
      let lat = v.currentLat;
      let lng = v.currentLng;

      for (let i = 0; i < numPoints; i++) {
        const hourOffset = 5 + (i / numPoints) * 12; // 5am to 5pm spread
        const recordedAt = new Date(today.getTime() + hourOffset * 3600000);

        // Simulate movement — drift position slightly
        const moving = Math.random() > 0.3;
        const speed = moving ? 20 + Math.random() * 70 : 0;

        if (moving) {
          lat += (Math.random() - 0.5) * 0.08;
          lng += (Math.random() - 0.5) * 0.08;
        }

        events.push({
          id: uuidv4(),
          vehicleId: v.id,
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          speed: parseFloat(speed.toFixed(1)),
          heading: Math.random() * 360,
          altitude: 100 + Math.random() * 500,
          accuracy: 3 + Math.random() * 12,
          source: Math.random() > 0.5 ? 'HARDWARE_GPS' : 'DRIVER_APP',
          recordedAt,
          createdAt: recordedAt,
        });
      }
    }

    if (events.length > 0) {
      // Batch insert in chunks of 100
      for (let i = 0; i < events.length; i += 100) {
        await queryInterface.bulkInsert('gps_events', events.slice(i, i + 100));
      }
    }

    console.log(`Seeded ${newVehicles.length} vehicles, ${newDrivers.length} drivers, ${events.length} GPS events`);
  },

  async down(queryInterface) {
    // Only delete the new vehicles (keep original 3)
    await queryInterface.bulkDelete('vehicles', {
      regNumber: { [require('sequelize').Op.in]: [
        'KA 01 MN 3456', 'TN 07 BX 8901', 'GJ 06 RT 2345', 'RJ 14 GH 6789',
        'UP 32 AK 4567', 'WB 26 DF 1234', 'MP 09 JK 5678', 'AP 31 PQ 9012',
        'KL 10 XY 3456', 'HR 26 ZZ 7890', 'CG 04 AB 2345', 'PB 10 CD 6789',
      ] },
    });
  },
};
