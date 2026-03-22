import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTemplates } from '../hooks/useTemplates'
import { useTheme } from '../hooks/useTheme'
import { useWizardStore } from '../lib/stores/wizardStore'
import type { RollTemplate } from '../lib/types'

const STEP_LABELS = ['Type', 'Build', 'Variables', 'Name'] as const
const STEP_KEYS = ['type', 'build', 'variables', 'name'] as const

function StepIndicator({ currentStep }: { readonly currentStep: string }): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const currentIdx = STEP_KEYS.indexOf(currentStep as (typeof STEP_KEYS)[number])

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12
    },
    step: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12
    },
    stepActive: {
      backgroundColor: tokens.accent
    },
    stepInactive: {
      backgroundColor: tokens.surfaceAlt
    },
    text: {
      fontSize: fontSizes.sm
    },
    textActive: {
      color: tokens.text,
      fontWeight: '600'
    },
    textInactive: {
      color: tokens.textDim
    }
  })

  return (
    <View style={styles.container}>
      {STEP_LABELS.map((label, i) => (
        <View
          key={label}
          style={[styles.step, i === currentIdx ? styles.stepActive : styles.stepInactive]}
        >
          <Text style={[styles.text, i === currentIdx ? styles.textActive : styles.textInactive]}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  )
}

function TypeStep(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const type = useWizardStore(s => s.type)
  const setType = useWizardStore(s => s.setType)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20
    },
    title: {
      color: tokens.text,
      fontSize: fontSizes.xl,
      fontWeight: '600',
      marginBottom: 20
    },
    option: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 2
    },
    optionSelected: {
      backgroundColor: tokens.surfaceAlt,
      borderColor: tokens.accent
    },
    optionUnselected: {
      backgroundColor: tokens.surface,
      borderColor: tokens.border
    },
    optionTitle: {
      color: tokens.text,
      fontSize: fontSizes.base,
      fontWeight: '600'
    },
    optionDesc: {
      color: tokens.textMuted,
      fontSize: fontSizes.sm,
      marginTop: 4
    }
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What kind of roll?</Text>
      <Pressable
        style={[
          styles.option,
          type === 'standard' ? styles.optionSelected : styles.optionUnselected
        ]}
        onPress={() => setType('standard')}
        accessibilityLabel="Standard notation roll"
        accessibilityRole="button"
      >
        <Text style={styles.optionTitle}>Standard</Text>
        <Text style={styles.optionDesc}>Use dice notation (e.g. 2d6+3)</Text>
      </Pressable>
      <Pressable
        style={[styles.option, type === 'game' ? styles.optionSelected : styles.optionUnselected]}
        onPress={() => setType('game')}
        accessibilityLabel="Game-specific roll"
        accessibilityRole="button"
      >
        <Text style={styles.optionTitle}>Game</Text>
        <Text style={styles.optionDesc}>Use a game system&apos;s rules</Text>
      </Pressable>
    </View>
  )
}

function BuildStep(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const type = useWizardStore(s => s.type)
  const draft = useWizardStore(s => s.draft)
  const updateDraft = useWizardStore(s => s.updateDraft)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20
    },
    title: {
      color: tokens.text,
      fontSize: fontSizes.xl,
      fontWeight: '600',
      marginBottom: 20
    },
    label: {
      color: tokens.textMuted,
      fontSize: fontSizes.sm,
      marginBottom: 4
    },
    input: {
      backgroundColor: tokens.surfaceAlt,
      color: tokens.text,
      fontSize: fontSizes.base,
      fontFamily: 'JetBrainsMono_400Regular',
      borderRadius: 8,
      padding: 12,
      minHeight: 44
    },
    hint: {
      color: tokens.textDim,
      fontSize: fontSizes.sm,
      marginTop: 8
    },
    placeholder: {
      color: tokens.textMuted,
      fontSize: fontSizes.base,
      marginTop: 20,
      textAlign: 'center'
    }
  })

  if (type === 'game') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Build Your Roll</Text>
        <Text style={styles.placeholder}>Game template building is coming in a future update.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Build Your Roll</Text>
      <Text style={styles.label}>Notation</Text>
      <TextInput
        style={styles.input}
        value={draft.notation ?? ''}
        onChangeText={text => updateDraft({ notation: text })}
        placeholder="e.g. 2d6+3 or 1d20+{mod}"
        placeholderTextColor={tokens.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Dice notation"
      />
      <Text style={styles.hint}>
        Use {'{'} {'}'} for variables, e.g. 1d20+{'{'}mod{'}'}
      </Text>
    </View>
  )
}

function VariablesStep(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const draft = useWizardStore(s => s.draft)
  const updateDraft = useWizardStore(s => s.updateDraft)

  const notation = draft.notation ?? ''
  const matches = [...notation.matchAll(/\{(\w+)\}/g)]
  const detectedNames = [...new Set(matches.map(m => m[1]!))]
  const currentVariables = draft.variables ?? []

  // Auto-populate variables from notation
  useEffect(() => {
    if (detectedNames.length === 0 && currentVariables.length === 0) return
    const existing = new Map(currentVariables.map(v => [v.name, v]))
    const variables = detectedNames.map(name => existing.get(name) ?? { name, default: 0 })
    if (JSON.stringify(variables) !== JSON.stringify(currentVariables)) {
      updateDraft({ variables })
    }
  }, [notation])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20
    },
    title: {
      color: tokens.text,
      fontSize: fontSizes.xl,
      fontWeight: '600',
      marginBottom: 20
    },
    noVars: {
      color: tokens.textMuted,
      fontSize: fontSizes.base,
      textAlign: 'center',
      marginTop: 20
    },
    variableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12
    },
    varName: {
      color: tokens.text,
      fontSize: fontSizes.base,
      fontFamily: 'JetBrainsMono_400Regular',
      flex: 1
    },
    varInput: {
      backgroundColor: tokens.surfaceAlt,
      color: tokens.text,
      fontSize: fontSizes.base,
      fontFamily: 'JetBrainsMono_400Regular',
      borderRadius: 8,
      padding: 10,
      width: 80,
      textAlign: 'center',
      minHeight: 44
    },
    defaultLabel: {
      color: tokens.textDim,
      fontSize: fontSizes.sm
    }
  })

  function handleDefaultChange(name: string, text: string): void {
    const parsed = Number(text)
    const defaultVal = Number.isNaN(parsed) ? 0 : parsed
    const variables = (draft.variables ?? []).map(v =>
      v.name === name ? { ...v, default: defaultVal } : v
    )
    updateDraft({ variables })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Variables</Text>
      {detectedNames.length === 0 ? (
        <Text style={styles.noVars}>
          No variables detected. Use {'{'}name{'}'} in your notation to add variables.
        </Text>
      ) : (
        detectedNames.map(name => {
          const variable = currentVariables.find(v => v.name === name)
          return (
            <View key={name} style={styles.variableRow}>
              <Text style={styles.varName}>{name}</Text>
              <View>
                <Text style={styles.defaultLabel}>Default</Text>
                <TextInput
                  style={styles.varInput}
                  value={String(variable?.default ?? 0)}
                  onChangeText={text => handleDefaultChange(name, text)}
                  keyboardType="numeric"
                  accessibilityLabel={`Default value for ${name}`}
                />
              </View>
            </View>
          )
        })
      )}
    </View>
  )
}

function NameStep(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const draft = useWizardStore(s => s.draft)
  const updateDraft = useWizardStore(s => s.updateDraft)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20
    },
    title: {
      color: tokens.text,
      fontSize: fontSizes.xl,
      fontWeight: '600',
      marginBottom: 20
    },
    label: {
      color: tokens.textMuted,
      fontSize: fontSizes.sm,
      marginBottom: 4
    },
    input: {
      backgroundColor: tokens.surfaceAlt,
      color: tokens.text,
      fontSize: fontSizes.base,
      borderRadius: 8,
      padding: 12,
      minHeight: 44
    }
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Name Your Template</Text>
      <Text style={styles.label}>Template name</Text>
      <TextInput
        style={styles.input}
        value={draft.name ?? ''}
        onChangeText={text => updateDraft({ name: text })}
        placeholder="e.g. Attack Roll"
        placeholderTextColor={tokens.textDim}
        autoCapitalize="words"
        accessibilityLabel="Template name"
      />
    </View>
  )
}

export default function WizardScreen(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const router = useRouter()
  const { saveTemplate } = useTemplates()

  const step = useWizardStore(s => s.step)
  const draft = useWizardStore(s => s.draft)
  const canAdvance = useWizardStore(s => s.canAdvance)
  const goToNext = useWizardStore(s => s.goToNext)
  const goToPrev = useWizardStore(s => s.goToPrev)
  const reset = useWizardStore(s => s.reset)

  // Reset wizard state on entry
  useEffect(() => {
    reset()
    return () => {
      reset()
    }
  }, [reset])

  const isFirstStep = step === 'type'
  const isLastStep = step === 'name'

  async function handleSave(): Promise<void> {
    const template: RollTemplate = {
      id: crypto.randomUUID(),
      name: draft.name ?? 'Untitled',
      notation: draft.notation ?? '',
      variables: draft.variables ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(draft.gameId !== undefined ? { gameId: draft.gameId } : {}),
      ...(draft.gameInputs !== undefined ? { gameInputs: draft.gameInputs } : {})
    }
    await saveTemplate(template)
    reset()
    router.back()
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16
    },
    cancelText: {
      color: tokens.accent,
      fontSize: fontSizes.base
    },
    headerTitle: {
      color: tokens.text,
      fontSize: fontSizes.lg,
      fontWeight: '600'
    },
    headerSpacer: {
      width: 60
    },
    stepContent: {
      flex: 1
    },
    footer: {
      flexDirection: 'row',
      padding: 16,
      gap: 12
    },
    backButton: {
      flex: 1,
      backgroundColor: tokens.surfaceAlt,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center'
    },
    nextButton: {
      flex: 1,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center'
    },
    nextEnabled: {
      backgroundColor: tokens.accent
    },
    nextDisabled: {
      backgroundColor: tokens.surfaceAlt
    },
    buttonText: {
      fontSize: fontSizes.base,
      fontWeight: '600'
    },
    buttonTextEnabled: {
      color: tokens.text
    },
    buttonTextDisabled: {
      color: tokens.textDim
    }
  })

  function renderStep(): React.JSX.Element {
    switch (step) {
      case 'type':
        return <TypeStep />
      case 'build':
        return <BuildStep />
      case 'variables':
        return <VariablesStep />
      case 'name':
        return <NameStep />
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            reset()
            router.back()
          }}
          accessibilityLabel="Cancel"
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Template</Text>
        <View style={styles.headerSpacer} />
      </View>

      <StepIndicator currentStep={step} />

      <View style={styles.stepContent}>{renderStep()}</View>

      <View style={styles.footer}>
        {!isFirstStep && (
          <Pressable
            style={styles.backButton}
            onPress={goToPrev}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, styles.buttonTextEnabled]}>Back</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.nextButton, canAdvance ? styles.nextEnabled : styles.nextDisabled]}
          onPress={isLastStep ? handleSave : goToNext}
          disabled={!canAdvance}
          accessibilityLabel={isLastStep ? 'Save' : 'Next'}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.buttonText,
              canAdvance ? styles.buttonTextEnabled : styles.buttonTextDisabled
            ]}
          >
            {isLastStep ? 'Save' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
