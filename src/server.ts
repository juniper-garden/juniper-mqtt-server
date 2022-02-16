require('dotenv').config()
import kafka from './kafka/kafka'
import validator from 'validator'
import sequelize from './db'
import { Producer } from 'kafkajs'
import SensorReading from './models/sensor-reading'
import { transformTopic } from './utils/topic'
import OrganizationCredential from './models/organization-credential'
import CustomerDevice from './models/customer-device'
import HandlerMap from './handlers'
const aedes = require('aedes')()
const server = require('net').createServer(aedes.handle)
const port = 1883

const read_scopes = [4, 5]
const write_scopes = [3, 5]
let kProducer: Producer | null = null

async function setupKafka() {
  const producer = kafka.producer()
  await producer.connect()
  kProducer = producer
}

async function startDb() {
  try {

    await sequelize.authenticate()
    console.log('Connection has been established successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
    process.exit(1)
  }
}

server.listen(port, () => {
  setupKafka()
  startDb()
})

aedes.authenticate = async (
  client: any,
  username: any,
  password: any,
  callback: any
) => {
  if (!username || !password) return callback(new Error('UNAUTHORIZED'), false)
  if (username.toString() == process.env.MASTER_USER && password.toString() == process.env.MASTER_PASSWORD) {
    client.isAdmin = true
    return callback(null, true)
  }
  console.log('client', process.env)
  const cd:any = await CustomerDevice.findOne({ where: { id: username.toString() } })
  const oc:any = await OrganizationCredential.findOne({ where: { key: password.toString(), grant_type: 0 } })

  if (!cd || !oc) {
    return callback(new Error('Invalid UUID'), false)
  }

  if (cd.organization_id !== oc.organization_id) {
    return callback(new Error('Invalid UUID'), false)
  }

  client.organization_credential = oc.dataValues
  client.device = cd.dataValues
  client.username = username
  return callback(null, true)
}

aedes.authorizeSubscribe = async (
  client: any,
  sub: any,
  callback: any
) => {
  // console.log('sb.topic', sub.topic, sub.topic == '$SYS/#' || sub.topic == '#')
  try {
    if (client.isAdmin) return callback(null, sub)
    if (!client._authorized) return callback(new Error('UNAUTHORIZED'), false)
    if (!read_scopes.includes(client.organization_credential.grant_scope)) return callback(new Error('UNAUTHORIZED'), false)
    return callback(null, sub)
  } catch (err) {
    return callback(null, null)
  }
}

aedes.authorizePublish = async (
  client: any,
  sub: any,
  callback: any
) => {
  try {
    if (client.isAdmin) return callback(null, sub)
    if (!client._authorized) return callback(new Error('UNAUTHORIZED'), false)
    if (sub.topic.indexOf(client.device.id) == -1 || !write_scopes.includes(client.organization_credential.grant_scope)) return callback(new Error('UNAUTHORIZED'), false)
    return callback(null, sub)
  } catch (err) {
    return callback(null, null)
  }
}

// emitted when a client connects to the broker
aedes.on('client', (client: any) => {
  console.log(
    `[CLIENT_CONNECTED] Client ${client ? client.id : client
    } connected to broker ${aedes.id}`
  )
})

// emitted when a client disconnects from the broker
aedes.on('clientDisconnect', (client: any) =>  {
  console.log(
    `[CLIENT_DISCONNECTED] Client ${client ? client.id : client
    } disconnected from the broker ${aedes.id}`
  )
})

// emitted when a client subscribes to a message topic
aedes.on('subscribe', (subscriptions: any, client: any) => {
  console.log(
    '[TOPIC_SUBSCRIBED] Client subscribed to topics:', subscriptions
  )
})

// emitted when a client unsubscribes from a message topic
aedes.on('unsubscribe', (subscriptions: any, client: any) =>  {
  console.log(
    `[TOPIC_UNSUBSCRIBED] Client ${client ? client.id : client
    }`
  )
})

// emitted when a client publishes a message packet on the topic
aedes.on('publish', async (packet: any, client: any) => {
  if (client) {
    const topic = await transformTopic(packet.topic)
    if (topic.parent_topic === 'jt_device_events') {
      HandlerMap[topic.action](client, topic.parsed, packet.payload, kProducer)
    }
  }
})
