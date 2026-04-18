/**
 * Thin haptics wrapper with a web no-op. Following Apple HIG:
 *   - light:  item selection, tab switch
 *   - medium: primary CTA confirm, photo captured
 *   - heavy:  destructive confirmed (delete draft)
 *   - notify.success / warning / error: end-of-flow feedback
 */
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNative } from "./platform";

export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* ignore */ }
}

export async function hapticMedium(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { /* ignore */ }
}

export async function hapticHeavy(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch { /* ignore */ }
}

export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch { /* ignore */ }
}

export async function hapticWarning(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch { /* ignore */ }
}

export async function hapticError(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch { /* ignore */ }
}
