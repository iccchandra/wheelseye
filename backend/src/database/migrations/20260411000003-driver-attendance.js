'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('driver_attendance', {
      id:              { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      driverId:        { type: Sequelize.UUID, allowNull: false, references: { model: 'drivers', key: 'id' } },
      vehicleId:       { type: Sequelize.UUID, allowNull: false, references: { model: 'vehicles', key: 'id' } },
      type:            { type: Sequelize.ENUM('CHECK_IN', 'CHECK_OUT'), allowNull: false },
      lat:             { type: Sequelize.FLOAT, allowNull: false },
      lng:             { type: Sequelize.FLOAT, allowNull: false },
      address:         { type: Sequelize.STRING },
      selfieUrl:       { type: Sequelize.STRING },
      vehicleSnapshot: { type: Sequelize.JSON },
      deviceInfo:      { type: Sequelize.STRING },
      accuracy:        { type: Sequelize.FLOAT },
      createdAt:       { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('driver_attendance', ['driverId']);
    await queryInterface.addIndex('driver_attendance', ['vehicleId']);
    await queryInterface.addIndex('driver_attendance', ['createdAt']);
    await queryInterface.addIndex('driver_attendance', ['driverId', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('driver_attendance');
  },
};
