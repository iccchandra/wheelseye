'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const vehicles = await queryInterface.sequelize.query(
      'SELECT id, currentLat, currentLng FROM vehicles WHERE currentLat IS NOT NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!vehicles.length) return;

    const events = [];
    const now = new Date();

    // Generate GPS data for the past 7 days
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const day = new Date(now);
      day.setDate(day.getDate() - dayOffset);
      day.setHours(0, 0, 0, 0);

      for (const v of vehicles) {
        let lat = v.currentLat + (Math.random() - 0.5) * 0.5; // slightly different starting position per day
        let lng = v.currentLng + (Math.random() - 0.5) * 0.5;
        const numPoints = 12 + Math.floor(Math.random() * 12); // 12-24 points per vehicle per day

        for (let i = 0; i < numPoints; i++) {
          const hourOffset = 5 + (i / numPoints) * 13; // 5am to 6pm
          const recordedAt = new Date(day.getTime() + hourOffset * 3600000);

          // Alternate between moving and stopped
          const isStop = Math.random() < 0.25;
          const speed = isStop ? 0 : 15 + Math.random() * 75;

          if (!isStop) {
            lat += (Math.random() - 0.5) * 0.06;
            lng += (Math.random() - 0.5) * 0.06;
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
            source: 'HARDWARE_GPS',
            recordedAt,
            createdAt: recordedAt,
          });
        }
      }
    }

    // Batch insert
    for (let i = 0; i < events.length; i += 200) {
      await queryInterface.bulkInsert('gps_events', events.slice(i, i + 200));
    }

    console.log(`Seeded ${events.length} historical GPS events for past 7 days`);
  },

  async down(queryInterface) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 8);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await queryInterface.bulkDelete('gps_events', {
      recordedAt: {
        [require('sequelize').Op.gte]: weekAgo,
        [require('sequelize').Op.lt]: today,
      },
    });
  },
};
