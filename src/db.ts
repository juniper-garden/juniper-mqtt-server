require('dotenv').config()
import { Sequelize } from 'sequelize'
import type { Options } from 'sequelize'
// In a real app, you should keep the database connection URL as an environment variable.
// But for this example, we will just use a local SQLite database.
// const sequelize = new Sequelize(process.env.DB_CONNECTION_URL);
const databaseUrl:any = process.env.POSTGRES_URI

const options: Options = {
  dialect: 'postgres',
  protocol: 'postgres',
  ssl: process.env.DB_ENABLE_SSL === 'true',
  logging: true,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false
    }
  }
}

console.log('ssl config', databaseUrl)
const sequelize = new Sequelize(databaseUrl, options)

export default sequelize
