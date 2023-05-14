require('dotenv').config()
import kafka from './kafka/kafka'
import validator from 'validator'
import sequelize from './db'
import { Producer } from 'kafkajs'
import SensorReading from './models/sensor-reading'
import { transformTopic } from './utils/topic'
import OrganizationCredential from './models/organization-credential'
import CustomerDevice from './models/customer-device'
import handlerMap from './handlers'
import JuniperDevice from './models/juniper-device'

const aedes = require('aedes')()
const server = require('net').createServer(aedes.handle)
const port = 1883

const readScopes = [4, 5]
const writeScopes = [3, 5]
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
  if (username.toString() === process.env.MASTER_USER && password.toString() === process.env.MASTER_PASSWORD) {
    client.isAdmin = true
    return callback(null, true)
  }

  const cd: any = await CustomerDevice.findOne({ where: { id: username.toString() } }).catch(console.log)
  const oc: any = await OrganizationCredential.findOne({ where: { key: password.toString(), grant_type: 0 } }).catch(console.log)
  const jd: any = await JuniperDevice.findOne({ where: { id: username.toString() } }).catch(console.log)

  if (jd) {
    client.juniperDevice = jd.dataValues
    client.username = username
    return callback(null, true)
  }

  if (!cd || !oc) {
    return callback(new Error('Invalid UUID'), false)
  }

  if (cd.organization_id !== oc.organization_id) {
    return callback(new Error('Invalid UUID'), false)
  }

  if (jd && password.toString() !== process.env.MASTER_PASSWORD) {
    return callback(new Error('Invalid JuniperDevice Connection'), false)
  }

  client.organization_credential = oc.dataValues
  client.device = cd.dataValues
  client.juniperDevice = jd.dataValues
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

    if (client.device) {
      if (sub.topic.indexOf(client.device.id) === -1 && readScopes.indexOf(client.organization_credential.grant_scope) === -1) return callback(new Error('UNAUTHORIZED'), false)
    }
    if (client.juniperDevice) {
      if (sub.topic.indexOf(client.juniperDevice.id) === -1) return callback(new Error('UNAUTHORIZED'), false)
    }

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
    if (!client._authorized) return callback(null, false)

    if (client.device) {
      if (sub.topic.indexOf(client.device.id) === -1 || writeScopes.indexOf(client.organization_credential.grant_scope) === -1) return callback(new Error('Unauthorized'), false)
    }
    if (client.juniperDevice) {
      if (sub.topic.indexOf(client.juniperDevice.id) === -1) return callback(new Error('Unauthorized'), false)
    }

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
aedes.on('clientDisconnect', (client: any) => {
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
aedes.on('unsubscribe', (subscriptions: any, client: any) => {
  console.log(
    `[TOPIC_UNSUBSCRIBED] Client ${client ? client.id : client
    }`
  )
  const deviceId = client.device ? client.device?.id : client.juniperDevice?.id
  if (!deviceId) return
  const publishPacket = {
    cmd: 'publish',
    qos: 0,
    dup: false,
    topic: `jt_device_events/device/v1/${deviceId}/status`,
    payload: 'offline',
    retain: false
  }
  aedes.publish(publishPacket)
  // handlerMap["logs"](client, `jt_device_events/device/v1/${deviceId}/logs`, "Disconnected from mqtt broker", kProducer)
})

// emitted when a client publishes a message packet on the topic
aedes.on('publish', async (packet: any, client: any) => {
  if (client) {
    const topic = await transformTopic(packet.topic)
    if (topic.parent_topic === 'jt_device_events') {
      if (!handlerMap[topic.action]) return
      handlerMap[topic.action](client, topic, packet.payload, kProducer)
    }
  }
})
