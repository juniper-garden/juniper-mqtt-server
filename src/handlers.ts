
export async function handleReadings(client:any, topic: any, payload:any, kProducer:any) {
  try {
    const parsedPayload = JSON.parse(payload.toString())
    if (topic.device_id !== '' && topic.device_id === parsedPayload.id) {
    await kProducer.send({
      topic,
      messages: [{ key: 'data', value:  payload.toString() }]
    })
  }
  } catch (err) {
    console.log('there was an issue parsing the json')
  }
}

export async function handleCommands(client:any, topic: any, payload:any, kProducer:any) {
  await kProducer.send({
    topic,
    messages: [{ key: 'data', value:  payload.toString() }]
  })
}

export async function handleLogs(client:any, topic: any, payload:any, kProducer:any) {
  await kProducer.send({
    topic,
    messages: [{ key: 'data', value:  payload.toString() }]
  })
}

const HandlerMap: HashMap = {
  logs: handleLogs,
  readings: handleReadings,
  cmd: handleCommands
}

export default HandlerMap
