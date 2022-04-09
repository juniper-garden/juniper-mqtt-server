import { handleReadings } from '../src/handlers'
import { transformTopic } from '../src/utils/topic'
const mockKProducer = {
  send: jest.fn()
}

const testData = {"id":"e530abba-03e3-494d-ade6-e2111ea45ba7","timestamp":1649464260,"readings":[{"name":"absolute_humidity","unit":"g/m^3","value":6.678759},{"name":"absolute_humidity","unit":"g/m^3","value":6.678759}]}
const payloadToString = {
  toString: () => JSON.stringify(testData)
}
describe('Transform topics into valid topics for juniper technology ingest stack', () => {
  it('should transform valid topics', async () => {
    const topic:any = await transformTopic('jt_device_events/device/v1/e530abba-03e3-494d-ade6-e2111ea45ba7/readings')
    await handleReadings({}, topic, payloadToString, mockKProducer)
    expect(mockKProducer.send).toHaveBeenCalled()
  });
})