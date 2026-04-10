'use strict';
const { v4: uuidv4 } = require('uuid');

/**
 * Generate realistic GPS events for a vehicle trip with stops.
 * Simulates: Hyderabad → Bhopal route with fuel stops, rest stops, and traffic delays.
 */
module.exports = {
  async up(queryInterface) {
    // Get existing vehicles and shipments
    const vehicles = await queryInterface.sequelize.query(
      'SELECT id, regNumber FROM vehicles LIMIT 3',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const shipments = await queryInterface.sequelize.query(
      'SELECT id, vehicleId FROM shipments LIMIT 3',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!vehicles.length || !shipments.length) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const events = [];

    // --- Vehicle 1: Hyderabad to Bhopal route (long trip with multiple stops) ---
    const v1 = vehicles[0];
    const s1 = shipments.find(s => s.vehicleId === v1.id) || shipments[0];

    const route1 = [
      // 5:00 AM - Depart warehouse, running
      { t: 0,   lat: 17.3850, lng: 78.4867, speed: 0,  note: 'start' },
      { t: 5,   lat: 17.4010, lng: 78.4750, speed: 35, note: 'city driving' },
      { t: 10,  lat: 17.4200, lng: 78.4500, speed: 48, note: 'city exit' },
      { t: 15,  lat: 17.4550, lng: 78.4100, speed: 62, note: 'highway entry' },
      { t: 20,  lat: 17.5100, lng: 78.3600, speed: 75, note: 'highway' },
      { t: 30,  lat: 17.6200, lng: 78.2500, speed: 80, note: 'highway' },
      { t: 40,  lat: 17.7400, lng: 78.1500, speed: 78, note: 'highway' },
      { t: 50,  lat: 17.8700, lng: 78.0700, speed: 82, note: 'highway' },
      { t: 60,  lat: 18.0000, lng: 77.9800, speed: 76, note: 'highway' },
      { t: 75,  lat: 18.2000, lng: 77.8200, speed: 80, note: 'approaching toll' },

      // 6:20 AM - Toll plaza stop (8 min)
      { t: 80,  lat: 18.2500, lng: 77.7900, speed: 15, note: 'toll approach' },
      { t: 82,  lat: 18.2550, lng: 77.7880, speed: 0,  note: 'toll stop' },
      { t: 84,  lat: 18.2550, lng: 77.7880, speed: 0,  note: 'toll wait' },
      { t: 86,  lat: 18.2550, lng: 77.7880, speed: 0,  note: 'toll wait' },
      { t: 88,  lat: 18.2550, lng: 77.7880, speed: 0,  note: 'toll wait' },
      { t: 90,  lat: 18.2560, lng: 77.7870, speed: 8,  note: 'toll clearing' },

      // 6:30 AM - Running again
      { t: 95,  lat: 18.3000, lng: 77.7500, speed: 72, note: 'highway' },
      { t: 105, lat: 18.4500, lng: 77.6400, speed: 85, note: 'highway' },
      { t: 115, lat: 18.6000, lng: 77.5200, speed: 80, note: 'highway' },
      { t: 125, lat: 18.7500, lng: 77.4000, speed: 78, note: 'highway' },
      { t: 140, lat: 18.9800, lng: 77.2500, speed: 82, note: 'highway' },
      { t: 155, lat: 19.2000, lng: 77.1000, speed: 76, note: 'highway' },

      // 7:35 AM - Fuel stop at Nanded (25 min)
      { t: 160, lat: 19.2500, lng: 77.0800, speed: 30, note: 'approaching fuel' },
      { t: 162, lat: 19.2600, lng: 77.0750, speed: 5,  note: 'entering pump' },
      { t: 164, lat: 19.2610, lng: 77.0740, speed: 0,  note: 'fuel stop' },
      { t: 170, lat: 19.2610, lng: 77.0740, speed: 0,  note: 'fueling' },
      { t: 175, lat: 19.2610, lng: 77.0740, speed: 0,  note: 'fueling' },
      { t: 180, lat: 19.2610, lng: 77.0740, speed: 0,  note: 'payment' },
      { t: 185, lat: 19.2610, lng: 77.0740, speed: 0,  note: 'tea break' },

      // 8:05 AM - Running
      { t: 188, lat: 19.2700, lng: 77.0650, speed: 40, note: 'departing pump' },
      { t: 195, lat: 19.3500, lng: 77.0100, speed: 75, note: 'highway' },
      { t: 210, lat: 19.5500, lng: 76.8500, speed: 80, note: 'highway' },
      { t: 225, lat: 19.7500, lng: 76.7000, speed: 78, note: 'highway' },
      { t: 240, lat: 19.9500, lng: 76.5500, speed: 82, note: 'highway' },
      { t: 255, lat: 20.1500, lng: 76.4000, speed: 76, note: 'highway' },
      { t: 270, lat: 20.3500, lng: 76.2500, speed: 80, note: 'highway' },

      // 9:30 AM - Traffic jam near Aurangabad (18 min crawl/stop)
      { t: 275, lat: 20.4000, lng: 76.2200, speed: 25, note: 'traffic slowing' },
      { t: 278, lat: 20.4050, lng: 76.2180, speed: 8,  note: 'traffic jam' },
      { t: 280, lat: 20.4060, lng: 76.2170, speed: 0,  note: 'traffic stopped' },
      { t: 284, lat: 20.4060, lng: 76.2170, speed: 0,  note: 'traffic wait' },
      { t: 288, lat: 20.4060, lng: 76.2170, speed: 0,  note: 'traffic wait' },
      { t: 290, lat: 20.4070, lng: 76.2160, speed: 3,  note: 'crawling' },
      { t: 293, lat: 20.4080, lng: 76.2150, speed: 0,  note: 'stopped again' },

      // 9:53 AM - Running
      { t: 298, lat: 20.4200, lng: 76.2100, speed: 45, note: 'traffic clearing' },
      { t: 305, lat: 20.5000, lng: 76.1500, speed: 72, note: 'highway' },
      { t: 320, lat: 20.7000, lng: 76.0000, speed: 80, note: 'highway' },
      { t: 335, lat: 20.9000, lng: 75.8500, speed: 78, note: 'highway' },
      { t: 350, lat: 21.1000, lng: 75.7000, speed: 75, note: 'highway' },
      { t: 370, lat: 21.3500, lng: 75.5000, speed: 80, note: 'highway' },

      // 11:10 AM - Lunch break at Dhule (45 min)
      { t: 375, lat: 21.4000, lng: 75.4500, speed: 20, note: 'approaching dhaba' },
      { t: 377, lat: 21.4050, lng: 75.4450, speed: 0,  note: 'lunch stop' },
      { t: 385, lat: 21.4050, lng: 75.4450, speed: 0,  note: 'eating' },
      { t: 395, lat: 21.4050, lng: 75.4450, speed: 0,  note: 'eating' },
      { t: 405, lat: 21.4050, lng: 75.4450, speed: 0,  note: 'rest' },
      { t: 415, lat: 21.4050, lng: 75.4450, speed: 0,  note: 'rest' },
      { t: 420, lat: 21.4050, lng: 75.4450, speed: 0,  note: 'getting ready' },

      // 12:00 PM - Running
      { t: 425, lat: 21.4200, lng: 75.4300, speed: 55, note: 'departing' },
      { t: 435, lat: 21.5500, lng: 75.3000, speed: 80, note: 'highway' },
      { t: 450, lat: 21.7500, lng: 75.1500, speed: 82, note: 'highway' },
      { t: 465, lat: 21.9500, lng: 75.0000, speed: 78, note: 'highway' },
      { t: 480, lat: 22.1500, lng: 74.8500, speed: 80, note: 'highway' },
      { t: 500, lat: 22.4000, lng: 74.6500, speed: 76, note: 'highway' },
      { t: 520, lat: 22.6500, lng: 74.4500, speed: 80, note: 'highway' },

      // 1:40 PM - Short bathroom break (10 min)
      { t: 525, lat: 22.7000, lng: 74.4200, speed: 5,  note: 'pulling over' },
      { t: 527, lat: 22.7010, lng: 74.4190, speed: 0,  note: 'parked' },
      { t: 530, lat: 22.7010, lng: 74.4190, speed: 0,  note: 'break' },
      { t: 535, lat: 22.7010, lng: 74.4190, speed: 0,  note: 'break' },

      // 1:55 PM - Final stretch running
      { t: 538, lat: 22.7100, lng: 74.4100, speed: 65, note: 'resuming' },
      { t: 550, lat: 22.9000, lng: 74.2500, speed: 80, note: 'highway' },
      { t: 565, lat: 23.1000, lng: 77.2500, speed: 78, note: 'approaching Bhopal' },
      { t: 580, lat: 23.2000, lng: 77.3500, speed: 55, note: 'city outskirts' },
      { t: 590, lat: 23.2400, lng: 77.3900, speed: 35, note: 'city traffic' },
      { t: 600, lat: 23.2599, lng: 77.4126, speed: 15, note: 'arriving' },

      // 3:00 PM - Arrived at destination, idling (parked)
      { t: 602, lat: 23.2599, lng: 77.4126, speed: 0,  note: 'arrived destination' },
      { t: 610, lat: 23.2599, lng: 77.4126, speed: 0,  note: 'unloading' },
      { t: 620, lat: 23.2599, lng: 77.4126, speed: 0,  note: 'unloading' },
      { t: 640, lat: 23.2599, lng: 77.4126, speed: 0,  note: 'unloading complete' },
    ];

    for (const pt of route1) {
      const recordedAt = new Date(today.getTime() + (5 * 60 + pt.t) * 60000); // 5:00 AM + offset
      events.push({
        id: uuidv4(),
        shipmentId: s1.id,
        vehicleId: v1.id,
        lat: pt.lat,
        lng: pt.lng,
        speed: pt.speed,
        heading: Math.random() * 360,
        altitude: 350 + Math.random() * 100,
        accuracy: 5 + Math.random() * 10,
        source: 'HARDWARE_GPS',
        recordedAt,
        createdAt: recordedAt,
      });
    }

    // --- Vehicle 2: Mumbai to Nashik short run with long stop ---
    const v2 = vehicles[1];
    const s2 = shipments.find(s => s.vehicleId === v2.id) || shipments[1];

    const route2 = [
      { t: 0,   lat: 19.0760, lng: 72.8777, speed: 0 },
      { t: 10,  lat: 19.1000, lng: 72.8600, speed: 30 },
      { t: 20,  lat: 19.1500, lng: 72.8300, speed: 55 },
      { t: 35,  lat: 19.2500, lng: 72.8000, speed: 70 },
      { t: 50,  lat: 19.3800, lng: 72.8200, speed: 75 },
      { t: 65,  lat: 19.5000, lng: 72.8500, speed: 72 },
      // Breakdown stop (90 min!)
      { t: 70,  lat: 19.5200, lng: 72.8550, speed: 10 },
      { t: 72,  lat: 19.5210, lng: 72.8555, speed: 0 },
      { t: 80,  lat: 19.5210, lng: 72.8555, speed: 0 },
      { t: 90,  lat: 19.5210, lng: 72.8555, speed: 0 },
      { t: 100, lat: 19.5210, lng: 72.8555, speed: 0 },
      { t: 110, lat: 19.5210, lng: 72.8555, speed: 0 },
      { t: 120, lat: 19.5210, lng: 72.8555, speed: 0 },
      { t: 130, lat: 19.5210, lng: 72.8555, speed: 0 },
      { t: 140, lat: 19.5210, lng: 72.8555, speed: 0 },
      { t: 150, lat: 19.5210, lng: 72.8555, speed: 0 },
      { t: 160, lat: 19.5210, lng: 72.8555, speed: 0 },
      // Back running
      { t: 165, lat: 19.5300, lng: 72.8600, speed: 40 },
      { t: 180, lat: 19.6500, lng: 72.9000, speed: 68 },
      { t: 195, lat: 19.7800, lng: 72.9500, speed: 72 },
      { t: 210, lat: 19.9000, lng: 73.1000, speed: 70 },
      // Short chai stop
      { t: 215, lat: 19.9200, lng: 73.1200, speed: 0 },
      { t: 220, lat: 19.9200, lng: 73.1200, speed: 0 },
      { t: 225, lat: 19.9200, lng: 73.1200, speed: 0 },
      // Final run
      { t: 228, lat: 19.9300, lng: 73.1300, speed: 55 },
      { t: 240, lat: 19.9975, lng: 73.7898, speed: 45 },
      { t: 245, lat: 19.9975, lng: 73.7898, speed: 0 },
      { t: 260, lat: 19.9975, lng: 73.7898, speed: 0 },
    ];

    for (const pt of route2) {
      const recordedAt = new Date(today.getTime() + (6 * 60 + pt.t) * 60000); // 6:00 AM + offset
      events.push({
        id: uuidv4(),
        shipmentId: s2.id,
        vehicleId: v2.id,
        lat: pt.lat,
        lng: pt.lng,
        speed: pt.speed,
        heading: Math.random() * 360,
        altitude: 10 + Math.random() * 50,
        accuracy: 3 + Math.random() * 8,
        source: 'DRIVER_APP',
        recordedAt,
        createdAt: recordedAt,
      });
    }

    // --- Vehicle 3: Delhi to Panipat short route ---
    const v3 = vehicles[2];
    const s3 = shipments.find(s => s.vehicleId === v3.id) || shipments[2];

    const route3 = [
      { t: 0,   lat: 28.6139, lng: 77.2090, speed: 0 },
      { t: 8,   lat: 28.6300, lng: 77.2000, speed: 25 },
      { t: 15,  lat: 28.6800, lng: 77.1500, speed: 45 },
      { t: 25,  lat: 28.7500, lng: 77.0800, speed: 60 },
      { t: 35,  lat: 28.8500, lng: 77.0200, speed: 75 },
      { t: 50,  lat: 29.0000, lng: 76.9800, speed: 80 },
      // Toll stop 5 min
      { t: 53,  lat: 29.0200, lng: 76.9750, speed: 0 },
      { t: 55,  lat: 29.0200, lng: 76.9750, speed: 0 },
      { t: 58,  lat: 29.0200, lng: 76.9750, speed: 0 },
      // Running
      { t: 62,  lat: 29.0500, lng: 76.9700, speed: 78 },
      { t: 75,  lat: 29.2000, lng: 76.9600, speed: 82 },
      { t: 90,  lat: 29.3909, lng: 76.9635, speed: 55 },
      // Arrived Panipat
      { t: 95,  lat: 29.3909, lng: 76.9635, speed: 0 },
      { t: 110, lat: 29.3909, lng: 76.9635, speed: 0 },
      { t: 120, lat: 29.3909, lng: 76.9635, speed: 0 },
    ];

    for (const pt of route3) {
      const recordedAt = new Date(today.getTime() + (7 * 60 + pt.t) * 60000); // 7:00 AM + offset
      events.push({
        id: uuidv4(),
        shipmentId: s3.id,
        vehicleId: v3.id,
        lat: pt.lat,
        lng: pt.lng,
        speed: pt.speed,
        heading: Math.random() * 360,
        altitude: 200 + Math.random() * 30,
        accuracy: 4 + Math.random() * 6,
        source: 'HARDWARE_GPS',
        recordedAt,
        createdAt: recordedAt,
      });
    }

    // Batch insert all GPS events
    await queryInterface.bulkInsert('gps_events', events);
    console.log(`Seeded ${events.length} GPS events across 3 vehicles`);
  },

  async down(queryInterface) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await queryInterface.bulkDelete('gps_events', {
      recordedAt: { [require('sequelize').Op.gte]: today }
    });
  },
};
