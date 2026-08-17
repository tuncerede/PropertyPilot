import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextField } from '@/components/forms/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Section';
import { Notice } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { MAX_SCENARIOS_PER_PROPERTY } from '@/constants/analysis';
import { HIT_TARGET, radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { confirmDestructive } from '@/lib/confirm';
import { formatLongDate } from '@/lib/formatting/number';
import { scenarioNameSchema } from '@/lib/validation/scenario';
import type { PropertyScenario } from '@/types/property';

/**
 * Save, load, and manage the named assumption sets on an analysis screen.
 *
 * The active scenario is tracked by the parent: loading one replaces the
 * screen's assumptions, and any later edit marks it dirty so "Save" becomes
 * "Update" rather than silently creating a duplicate.
 */
export interface ScenarioBarProps {
  scenarios: PropertyScenario[];
  /** The scenario currently loaded, if any. */
  activeId: string | null;
  /** True when the on-screen assumptions differ from the loaded scenario. */
  isDirty: boolean;
  isSaving: boolean;
  error?: string | null;
  onLoad: (scenario: PropertyScenario) => void;
  onSaveNew: (name: string) => void;
  onUpdateActive: () => void;
  onRename: (scenarioId: string, name: string) => void;
  onDelete: (scenarioId: string) => void;
  /** Optional per-scenario summary, e.g. "Sell + Invest ahead by $38,568". */
  describe?: (scenario: PropertyScenario) => string | null;
}

export function ScenarioBar({
  scenarios,
  activeId,
  isDirty,
  isSaving,
  error,
  onLoad,
  onSaveNew,
  onUpdateActive,
  onRename,
  onDelete,
  describe,
}: ScenarioBarProps) {
  const colors = useColors();
  const [isNaming, setIsNaming] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const active = scenarios.find((scenario) => scenario.id === activeId) ?? null;
  const isFull = scenarios.length >= MAX_SCENARIOS_PER_PROPERTY;

  const openSaveDialog = () => {
    setRenamingId(null);
    setDraftName(suggestName(scenarios.length));
    setNameError(null);
    setIsNaming(true);
  };

  const openRenameDialog = (scenario: PropertyScenario) => {
    setRenamingId(scenario.id);
    setDraftName(scenario.name);
    setNameError(null);
    setIsNaming(true);
  };

  const submitName = () => {
    const parsed = scenarioNameSchema.safeParse(draftName);
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? 'Give this scenario a name.');
      return;
    }

    if (renamingId) {
      onRename(renamingId, parsed.data);
    } else {
      onSaveNew(parsed.data);
    }

    setIsNaming(false);
    setRenamingId(null);
  };

  const confirmDelete = (scenario: PropertyScenario) =>
    confirmDestructive({
      title: 'Delete this scenario?',
      message: `"${scenario.name}" will be removed. Your property is not affected.`,
      confirmLabel: 'Delete',
      onConfirm: () => onDelete(scenario.id),
    });

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="label" tone="secondary">
            Saved scenarios
          </Text>
          <Text variant="caption" tone="tertiary">
            {active
              ? isDirty
                ? `Editing "${active.name}" — unsaved changes`
                : `Showing "${active.name}"`
              : 'Save these assumptions to come back to them.'}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.notice}>
          <Notice tone="warning" icon="alert-circle-outline">
            {error}
          </Notice>
        </View>
      ) : null}

      {scenarios.length > 0 ? (
        <View style={styles.list}>
          {scenarios.map((scenario, index) => {
            const isActive = scenario.id === activeId;
            const summary = describe?.(scenario) ?? null;

            return (
              <View key={scenario.id}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.row}>
                  <Pressable
                    onPress={() => onLoad(scenario)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`Load scenario ${scenario.name}`}
                    style={styles.rowMain}
                  >
                    <Ionicons
                      name={isActive ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isActive ? colors.brand : colors.textTertiary}
                    />
                    <View style={styles.rowText}>
                      <Text variant={isActive ? 'bodyStrong' : 'body'} numberOfLines={1}>
                        {scenario.name}
                      </Text>
                      <Text variant="caption" tone="tertiary" numberOfLines={1}>
                        {summary ?? `Saved ${formatLongDate(scenario.createdAt)}`}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => openRenameDialog(scenario)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Rename ${scenario.name}`}
                    style={styles.rowAction}
                  >
                    <Ionicons name="pencil-outline" size={17} color={colors.textTertiary} />
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(scenario)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${scenario.name}`}
                    style={styles.rowAction}
                  >
                    <Ionicons name="trash-outline" size={17} color={colors.negative} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.actions}>
        {active && isDirty ? (
          <Button
            label={`Update "${active.name}"`}
            variant="secondary"
            loading={isSaving}
            onPress={onUpdateActive}
          />
        ) : null}
        <Button
          label="Save as new scenario"
          variant={active && isDirty ? 'ghost' : 'secondary'}
          icon="bookmark-outline"
          loading={isSaving}
          disabled={isFull}
          onPress={openSaveDialog}
        />
        {isFull ? (
          <Text variant="caption" tone="tertiary" align="center">
            You have saved the maximum of {MAX_SCENARIOS_PER_PROPERTY} scenarios for this
            property. Delete one to make room.
          </Text>
        ) : null}
      </View>

      <Modal
        visible={isNaming}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNaming(false)}
      >
        <NameDialog
          title={renamingId ? 'Rename scenario' : 'Name this scenario'}
          value={draftName}
          error={nameError}
          onChange={(next) => {
            setDraftName(next);
            setNameError(null);
          }}
          onCancel={() => setIsNaming(false)}
          onSubmit={submitName}
        />
      </Modal>
    </Card>
  );
}

function NameDialog({
  title,
  value,
  error,
  onChange,
  onCancel,
  onSubmit,
}: {
  title: string;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.dialogBackdrop, { backgroundColor: colors.overlay }]}>
      <Pressable
        style={styles.dialogDismiss}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
      />
      <ScrollView
        contentContainerStyle={[styles.dialogScroll, { paddingBottom: spacing.xxl + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.dialog,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text variant="heading">{title}</Text>
          <TextField
            label="Scenario name"
            value={value}
            onChangeText={onChange}
            placeholder="Conservative"
            error={error ?? undefined}
            autoFocus
            maxLength={60}
          />
          <View style={styles.dialogActions}>
            <Button label="Save" onPress={onSubmit} />
            <Button label="Cancel" variant="ghost" onPress={onCancel} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** A sensible default name so saving is one tap for people who do not care. */
function suggestName(existingCount: number): string {
  const defaults = ['Base case', 'Optimistic', 'Conservative'];
  return defaults[existingCount] ?? `Scenario ${existingCount + 1}`;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  headerText: { flex: 1, gap: spacing.xxs },
  notice: { marginTop: spacing.md },
  list: { marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: HIT_TARGET,
  },
  rowText: { flex: 1, gap: spacing.xxs },
  rowAction: {
    width: HIT_TARGET - 8,
    height: HIT_TARGET - 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  dialogBackdrop: { flex: 1, justifyContent: 'center' },
  dialogDismiss: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dialogScroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  dialog: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.lg,
  },
  dialogActions: { gap: spacing.sm },
});
