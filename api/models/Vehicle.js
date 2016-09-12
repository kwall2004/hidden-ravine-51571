/**
 * Vehicle.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    tableName: 'Vhcl',
    autoPK: false,
    autoCreatedAt: false,
    autoUpdatedAt: false,
    attributes: {
        VhclID: { type: 'integer' },
        BsnsInfoID: { type: 'integer' },
        VIN: { type: 'string' },
        Make: { type: 'string' },
        Modl: { type: 'string' },
        ModlYear: { type: 'string' },
        Img: { type: 'string' },
        Alas: { type: 'string' },
        Regs: { type: 'string' },
        VhclStts: { type: 'boolean' },
        InitOdo: { type: 'float' },
        SpedThrs: { type: 'integer' },
        RPMThrs: { type: 'integer' },
    }
};
