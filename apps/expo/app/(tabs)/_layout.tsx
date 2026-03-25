import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../../hooks/useTheme'
import { useContentTabStore } from '../../lib/stores/contentTabStore'

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

function ContentTabToggle(): React.JSX.Element {
  const { tokens } = useTheme()
  const tab = useContentTabStore(s => s.tab)
  const setTab = useContentTabStore(s => s.setTab)

  return (
    <View style={[toggleStyles.track, { backgroundColor: tokens.surfaceAlt }]}>
      <Pressable
        onPress={() => setTab('common')}
        style={[
          toggleStyles.segment,
          tab === 'common' ? { backgroundColor: tokens.accent } : undefined
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: tab === 'common' }}
      >
        <Text
          style={[toggleStyles.label, { color: tab === 'common' ? '#ffffff' : tokens.textMuted }]}
        >
          Common
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setTab('notation')}
        style={[
          toggleStyles.segment,
          tab === 'notation' ? { backgroundColor: tokens.accent } : undefined
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: tab === 'notation' }}
      >
        <Text
          style={[toggleStyles.label, { color: tab === 'notation' ? '#ffffff' : tokens.textMuted }]}
        >
          Notation
        </Text>
      </Pressable>
    </View>
  )
}

const toggleStyles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    marginRight: 12
  },
  segment: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'JetBrainsMono_400Regular'
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
          borderTopColor: 'rgba(168, 85, 247, 0.15)',
          borderTopWidth: 1
        },
        tabBarLabelStyle: {
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          letterSpacing: 0.5
        },
        headerStyle: {
          backgroundColor: tokens.bg,
          shadowColor: 'transparent',
          elevation: 0
        },
        headerTitleStyle: {
          fontFamily: 'JetBrainsMono_400Regular',
          fontWeight: '600',
          letterSpacing: -0.02 * 17
        },
        headerTintColor: tokens.text
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Roll',
          headerRight: () => <ContentTabToggle />,
          tabBarIcon: ({ color, size }) => <TabIcon name="dice-outline" color={color} size={size} />
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
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings-outline" color={color} size={size} />
          )
        }}
      />
    </Tabs>
  )
}
