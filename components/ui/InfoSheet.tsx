import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { Divider } from './Section';
import { Text } from './Text';

/**
 * "How is this calculated?" sheet.
 *
 * PropertyPilot earns trust through transparent mathematics: every displayed
 * metric can open this sheet to show what it means, the formula used, and
 * the actual inputs that produced the number on screen.
 */

export interface MetricExplanation {
  title: string;
  meaning: string;
  formula: string;
  inputs: { label: string; value: string }[];
  caveat?: string;
}

interface InfoSheetContextValue {
  explain: (explanation: MetricExplanation) => void;
}

const InfoSheetContext = createContext<InfoSheetContextValue>({ explain: () => {} });

export function InfoSheetProvider({ children }: { children: React.ReactNode }) {
  const [explanation, setExplanation] = useState<MetricExplanation | null>(null);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const explain = useCallback((next: MetricExplanation) => setExplanation(next), []);
  const value = useMemo(() => ({ explain }), [explain]);

  return (
    <InfoSheetContext.Provider value={value}>
      {children}
      <Modal
        visible={explanation !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setExplanation(null)}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setExplanation(null)}
          accessibilityLabel="Close explanation"
          accessibilityRole="button"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: spacing.xxl + insets.bottom,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.grabber}>
            <View style={[styles.grabberBar, { backgroundColor: colors.borderStrong }]} />
          </View>

          {explanation ? (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              <View style={styles.titleRow}>
                <Text variant="heading" style={styles.title}>
                  {explanation.title}
                </Text>
                <Pressable
                  onPress={() => setExplanation(null)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={22} color={colors.textTertiary} />
                </Pressable>
              </View>

              <Text variant="body" tone="secondary">
                {explanation.meaning}
              </Text>

              <View style={[styles.formula, { backgroundColor: colors.surfaceMuted }]}>
                <Text variant="label" tone="tertiary">
                  Formula
                </Text>
                <Text variant="body" style={styles.mono}>
                  {explanation.formula}
                </Text>
              </View>

              <View style={styles.inputs}>
                <Text variant="label" tone="tertiary">
                  Inputs used
                </Text>
                {explanation.inputs.map((input, index) => (
                  <View key={input.label}>
                    {index > 0 ? <Divider /> : null}
                    <View style={styles.inputRow}>
                      <Text variant="body" tone="secondary" style={styles.inputLabel}>
                        {input.label}
                      </Text>
                      <Text variant="bodyStrong" tabular>
                        {input.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {explanation.caveat ? (
                <Text variant="caption" tone="tertiary">
                  {explanation.caveat}
                </Text>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </InfoSheetContext.Provider>
  );
}

export function useInfoSheet(): InfoSheetContextValue {
  return useContext(InfoSheetContext);
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  grabber: { alignItems: 'center', paddingVertical: spacing.md },
  grabberBar: { width: 40, height: 4, borderRadius: radius.pill },
  body: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { flex: 1 },
  formula: {
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  mono: { fontFamily: 'Courier', lineHeight: 22 },
  inputs: { gap: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputLabel: { flexShrink: 1 },
});
