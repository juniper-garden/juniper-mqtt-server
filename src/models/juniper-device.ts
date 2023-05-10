
import { DataTypes, Model } from 'sequelize'
import sequelize from '../db'

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.

class JuniperDevice extends Model<any> {}
JuniperDevice.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true
  },
  board_id: {
    type: DataTypes.UUID,
    allowNull: false
  }
},                  {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  modelName: 'JuniperDevice',
  tableName: 'juniper_devices', // We need to choose the model name
  updatedAt: 'updated_at',
  createdAt: 'created_at'
})

// the defined model is the class itself
console.log(JuniperDevice === sequelize.models.JuniperDevice) // true

export default JuniperDevice
