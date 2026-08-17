import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirmation prompt.
 *
 * `Alert.alert` is a no-op on react-native-web, which silently turns any
 * destructive button into a button that does nothing. This routes web to
 * `window.confirm` so a destructive action either happens or is cancelled on
 * every platform.
 */
export function confirmDestructive(options: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}): void {
  const { title, message, confirmLabel, onConfirm } = options;

  if (Platform.OS === 'web') {
    const accepted = typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`);
    if (accepted) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

/** Informational prompt with a single dismiss button. */
export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}
