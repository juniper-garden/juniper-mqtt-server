
import { DataTypes, Model } from 'sequelize'
import sequelize from '../db'

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.

class OrganizationCredential extends Model<any> {}
OrganizationCredential.init({
  // Model attributes are defined here
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    autoIncrement: true
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  grant_type: {
    type: DataTypes.STRING
  },

  grant_scope: {
    type: DataTypes.STRING
  },
  key: {
    type: DataTypes.STRING
  }
},                          {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  modelName: 'OrganizationCredential',
  tableName: 'organization_credentials', // We need to choose the model name
  updatedAt: 'updated_at',
  createdAt: 'created_at'
})

// the defined model is the class itself
console.log(OrganizationCredential === sequelize.models.SensorReading) // true

export default OrganizationCredential
