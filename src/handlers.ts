import moment from 'moment'

export async function handleReadings(client: any, topic: any, payload: any, kProducer: any) {
  try {
    const parsedPayload = JSON.parse(payload.toString())
    if (topic.device_id !== '') {
      await kProducer.send({
        topic: 'sensor-ingest',
        messages: [{ key: 'data', value: JSON.stringify(parsedPayload) }]
      })
    }
  } catch (err) {
    console.log('there was an issue parsing the json')
  }
}

export async function handleCommands(client: any, topic: any, payload: any, kProducer: any) {

  await kProducer.send({
    topic: topic.parsed,
    messages: [{ key: 'data', value: JSON.stringify(payload) }]
  })
}

export async function handleLogs(client: any, topic: any, payload: any, kProducer: any) {
  const payloadToString = payload.toString()
  try {
    const parsedJson = JSON.parse(payloadToString)
    if (typeof parsedJson === 'string') {
      return handleStringLog(topic, payloadToString, kProducer)
    }

    return await kProducer.send({
      topic: topic.parsed,
      messages: [{ key: 'data', value: JSON.stringify(parsedJson) }]
    })
  } catch (err) {
    return handleStringLog(topic, payloadToString, kProducer)
  }
}

async function handleStringLog(topic: any, payloadString: any, kProducer:any) {
  const mappedPayload = {
    id: topic.device_id,
    log: payloadString,
    timetamp: moment().unix()
  }

  return await kProducer.send({
    topic: topic.parsed,
    messages: [{ key: 'data', value: JSON.stringify(mappedPayload) }]
  })
}

const handlerMap: HashMap = {
  logs: handleLogs,
  readings: handleReadings,
  cmd: handleCommands
}

export default handlerMap
