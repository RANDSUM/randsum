import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon({
  name,
  color,
  size
}: {
  readonly name: IoniconsName
  readonly color: string
  readonly size: number
}): React.JSX.Element {
  return <Ionicons name={name} color={color} size={size} />
}

export default function TabLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#71717a',
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopColor: '#27272a'
        },
        headerStyle: {
          backgroundColor: '#09090b'
        },
        headerTintColor: '#fafafa'
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Roll',
          tabBarIcon: ({ color, size }) => <TabIcon name="dice-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="game-controller-outline" color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="bookmark-outline" color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <TabIcon name="time-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person-outline" color={color} size={size} />
          )
        }}
      />
    </Tabs>
  )
}
