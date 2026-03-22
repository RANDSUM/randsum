import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

import { useTheme } from '../../hooks/useTheme'

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
  const { tokens } = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tokens.accent,
        tabBarInactiveTintColor: tokens.textDim,
        tabBarStyle: {
          backgroundColor: tokens.bg,
          borderTopColor: tokens.surfaceAlt
        },
        headerStyle: {
          backgroundColor: tokens.bg
        },
        headerTintColor: tokens.text
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
