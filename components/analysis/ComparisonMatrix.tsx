import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import {
  bestIndexFor,
  type ComparisonColumn,
  type ComparisonRow,
} from '@/lib/comparison';

/**
 * Side-by-side scenario comparison.
 *
 * Row labels stay pinned on the left while the scenario columns scroll
 * horizontally, so the reader never loses track of which figure they are
 * looking at — the failure mode of a plain wide table on a phone.
 *
 * Rows carry the numeric value alongside its formatted string so the matrix
 * can mark the best column itself. Screens therefore never pre-compute
 * "which one wins", which is exactly the kind of logic that drifts.
 */

const LABEL_WIDTH = 148;
const HEADER_HEIGHT = 60;
const ROW_HEIGHT = 56;
const COLUMN_WIDTH = 150;

export function ComparisonMatrix({
  columns,
  rows,
  onSelectColumn,
  selectedId,
}: {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  /** Called when a column header is tapped, e.g. to open that scenario. */
  onSelectColumn?: (id: string) => void;
  selectedId?: string | null;
}) {
  const colors = useColors();

  return (
    <Card flush>
      <View style={styles.frame}>
        {/* Pinned label column */}
        <View style={[styles.labelColumn, { borderRightColor: colors.border }]}>
          <View style={[styles.headerCell, { backgroundColor: colors.surfaceMuted }]} />
          {rows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.labelCell,
                { borderTopColor: colors.border },
                index % 2 === 1 ? { backgroundColor: colors.surfaceMuted } : null,
              ]}
            >
              <Text
                variant={row.emphasis ? 'captionStrong' : 'caption'}
                tone="secondary"
                numberOfLines={2}
              >
                {row.label}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Column headers */}
            <View style={styles.row}>
              {columns.map((column) => {
                const isSelected = column.id === selectedId;
                return (
                  <Pressable
                    key={column.id}
                    onPress={() => onSelectColumn?.(column.id)}
                    disabled={!onSelectColumn}
                    accessibilityRole={onSelectColumn ? 'button' : undefined}
                    accessibilityLabel={
                      onSelectColumn ? `Open scenario ${column.title}` : column.title
                    }
                    style={[
                      styles.headerCell,
                      {
                        backgroundColor: isSelected ? colors.brandMuted : colors.surfaceMuted,
                        borderLeftColor: colors.border,
                      },
                    ]}
                  >
                    <Text variant="captionStrong" numberOfLines={2} tone={isSelected ? 'brand' : 'primary'}>
                      {column.title}
                    </Text>
                    {column.subtitle ? (
                      <Text variant="caption" tone="tertiary" numberOfLines={1}>
                        {column.subtitle}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {rows.map((row, rowIndex) => {
              const bestIndex = bestIndexFor(row);

              return (
                <View key={row.label} style={styles.row}>
                  {row.cells.map((cell, columnIndex) => {
                    const isBest = bestIndex === columnIndex;

                    return (
                      <View
                        key={`${row.label}-${columns[columnIndex]?.id ?? columnIndex}`}
                        style={[
                          styles.cell,
                          { borderTopColor: colors.border, borderLeftColor: colors.border },
                          rowIndex % 2 === 1 ? { backgroundColor: colors.surfaceMuted } : null,
                        ]}
                      >
                        <View style={styles.cellContent}>
                          {isBest ? (
                            <Ionicons name="caret-up" size={12} color={colors.positive} />
                          ) : null}
                          <Text
                            variant={row.emphasis || isBest ? 'captionStrong' : 'caption'}
                            tone={cell.tone ?? (isBest ? 'positive' : 'primary')}
                            tabular
                            numberOfLines={1}
                          >
                            {cell.display}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  frame: { flexDirection: 'row' },
  labelColumn: { width: LABEL_WIDTH, borderRightWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row' },
  headerCell: {
    width: COLUMN_WIDTH,
    height: HEADER_HEIGHT,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    gap: spacing.xxs,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  labelCell: {
    height: ROW_HEIGHT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xxs,
  },
  cell: {
    width: COLUMN_WIDTH,
    height: ROW_HEIGHT,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  cellContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
});
