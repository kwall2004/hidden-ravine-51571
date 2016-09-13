/**
 * Vehicle.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    tableName: 'Vehicle',
    attributes: {
        VIN: { type: 'string' },
        Make: { type: 'string' },
        Model: { type: 'string' },
        ModelYear: { type: 'string' },
        Alias: { type: 'string' },
        OdoReading: { type: 'float' },
    }
};
