import kafka from './kafka/kafka'
import CustomerDevice from './models/customer-device';
import validator from 'validator';
import sequelize from './db';
import validTopics from './valid-topics';
import { Producer } from 'kafkajs';
import SensorReading from './models/sensor-reading';
const aedes = require('aedes')()
const server = require('net').createServer(aedes.handle)
const port = 1883

let kProducer: Producer | null = null;


async function setupKafka() {
  const producer = kafka.producer()
  await producer.connect()
  kProducer = producer
}

async function startDb(){
  try {
    
    await sequelize.authenticate()
    console.log('Connection has been established successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
    process.exit(1)
  }
}

server.listen(port, () => {
  console.log('server started and listening on port ', port)
  setupKafka()
  startDb()
})

aedes.authenticate = async (
  client: any,
  username: any,
  password: any,
  callback: any
) => {
  let isValidUUID = validator.isUUID(username)

  if(!isValidUUID) {
    return callback(new Error('Invalid UUID'), false)
  }

  const data = await SensorReading.findOne({ where: { customer_device_id: username }})
  if(!data) {
    return callback(new Error('Invalid UUID'), false)
  }

  return callback(null, true)
}

// emitted when a client connects to the broker
aedes.on('client', function (client: any) {
  console.log(
    `[CLIENT_CONNECTED] Client ${client ? client.id : client
    } connected to broker ${aedes.id}`
  )
})

// emitted when a client disconnects from the broker
aedes.on('clientDisconnect', function (client: any) {
  console.log(
    `[CLIENT_DISCONNECTED] Client ${client ? client.id : client
    } disconnected from the broker ${aedes.id}`
  )
})

// emitted when a client subscribes to a message topic
aedes.on('subscribe', function (subscriptions: any, client: any) {
  console.log(
    `[TOPIC_SUBSCRIBED] Client ${client ? client.id : client
    } subscribed to topics: ${subscriptions
      .map((s: any) => s.topic)
      .join(',')} on broker ${aedes.id}`
  )
})

// emitted when a client unsubscribes from a message topic
aedes.on('unsubscribe', function (subscriptions: any, client: any) {
  console.log(
    `[TOPIC_UNSUBSCRIBED] Client ${client ? client.id : client
    } unsubscribed to topics: ${subscriptions.join(',')} from broker ${aedes.id
    }`
  )
})

// emitted when a client publishes a message packet on the topic
aedes.on('publish', async function (packet: any, client: any) {
  if (client) {
    let splitTopic = packet.topic.split('/')
    if(validTopics[splitTopic[0]]) {
      await kProducer.send({
        topic: 'sensor-ingest',
        messages: [{ key: 'data', value: packet.payload.toString(), partition: 0 }]
      })
    }
  }
})
