import { transformTopic } from '../src/utils/topic'

const testTopics: any = {
  "jt_device_events/device/v1/aa123-45-99544/logs":"jt_device_events.device.v1.logs",
  "jt_device_events/device/v1/aa123-45-99544/readings": "jt_device_events.device.v1.readings",
  "jt_device_events/device/v1/aa123-45-99544/cmd": "jt_device_events.device.v1.cmd",
  "jt_device_events/device/v1/aa123-45-99544/sys": "jt_device_events.device.v1.sys",
}

const testSystemTopics:any = {
  "jt_app_events/ml/logs/v1": "jt_app_events.ml.logs.v1",
  "jt_app_events/notification/sms/v1": "jt_app_events.notification.sms.v1",
  "jt_app_events/notification/email/v1": "jt_app_events.notification.email.v1",
  "jt_app_events/notification/status/v1": "jt_app_events.notification.status.v1"
}

describe('Transform topics into valid topics for juniper technology ingest stack', () => {
  it('should transform valid topics', () => {
    Object.keys(testTopics).map(async (topic) => {
      let transformed = await transformTopic(topic)
      expect(transformed.device_id).toBe('aa123-45-99544')
      expect(transformed.parsed).toBe(testTopics[topic]);
    })
  });

  it('should transform valid system topics', () => {
    Object.keys(testTopics).map(async (topic) => {
      let transformed = await transformTopic(topic)
      expect(transformed.parsed).toBe(testTopics[topic]);
    })
  });

  it('should return false if topic doesnt have a strategy', async () => {
    let badTopic = 'jt_something_/other_for/cool'
    let transformed = await transformTopic(badTopic)
    expect(transformed).toBe("");
  });
})