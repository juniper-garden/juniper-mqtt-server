
import { DataTypes, Model } from 'sequelize'
import sequelize from '../db'

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.

class CustomerDevice extends Model<any> {}
CustomerDevice.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.STRING
  }
},                  {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  modelName: 'CustomerDevice',
  tableName: 'customer_devices', // We need to choose the model name
  updatedAt: 'updated_at',
  createdAt: 'created_at'
})

// the defined model is the class itself
console.log(CustomerDevice === sequelize.models.CustomerDevice) // true

export default CustomerDevice
