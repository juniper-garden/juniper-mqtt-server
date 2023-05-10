
interface TopicStrategy {
  id: string,
  test: (topic: string) => boolean,
  transform: (topic: string) => Promise<any> | any
}

const topicStrategies: TopicStrategy[] = [
  {
    id: 'jt_device_events',
    test: (topic: string) => {
      const parsed = topic.split('/')
      return parsed.length === 5 && parsed[0] === 'jt_device_events'
    },
    transform: (topic: string): any => {
      const parts = topic.split('/')
      const [id] = parts.splice(3, 1)
      const parsed = parts.join('.')
      return {
        parsed,
        action: parts[parts.length - 1],
        device_id: id,
        parent_topic: parts[0]
      }
    }
  },
  {
    id: 'jt_app_events',
    test: (topic: string) => {
      const parsed = topic.split('/')
      return parsed.length === 4 && parsed[0] === 'jt_app_events'
    },
    transform: (topic: string) => {
      const parts = topic.split('/')
      const parsed = parts.join('.')
      return {
        parsed
      }
    }
  }
]

function getTopicStrategy(uri: string, strategies: TopicStrategy[]) {
  return strategies.reduce((acc: TopicStrategy | null, strategy: TopicStrategy) => {
    if (acc == null) {
      return strategy.test(uri) ? strategy : acc
    }
    return acc
  }, null)
}

export async function transformTopic(topic: string): Promise<any> {

  const strategy: TopicStrategy | null = await getTopicStrategy(topic, topicStrategies)

  if (!strategy) return ''

  const out = strategy.transform(topic)
  return out || topic
}
