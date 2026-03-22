import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'

import { useTheme } from '../../hooks/useTheme'
import { useRollModeStore } from '../../lib/stores/rollModeStore'

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

function ModeToggleButton(): React.JSX.Element {
  const { tokens } = useTheme()
  const mode = useRollModeStore(s => s.mode)
  const toggle = useRollModeStore(s => s.toggle)
  const isAdvanced = mode === 'advanced'

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={isAdvanced ? 'Switch to Simple mode' : 'Switch to Advanced mode'}
      style={[
        toggleStyles.button,
        { backgroundColor: isAdvanced ? tokens.accent : tokens.surfaceAlt }
      ]}
    >
      <Text
        style={[
          toggleStyles.label,
          { color: isAdvanced ? '#fff' : tokens.text, fontFamily: 'JetBrainsMono_400Regular' }
        ]}
      >
        {'</>'}
      </Text>
    </Pressable>
  )
}

const toggleStyles = StyleSheet.create({
  button: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontSize: 13,
    fontWeight: '600'
  }
})

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
          headerRight: () => <ModeToggleButton />,
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
