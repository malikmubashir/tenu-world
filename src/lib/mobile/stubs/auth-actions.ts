/**
 * Mobile-build stub for src/app/actions/auth.
 *
 * The real module is a Server Action ("use server"), which is not
 * supported with Next.js `output: 'export'`. For the mobile static
 * export, this stub replaces the import via webpack alias (see
 * next.config.ts). The mobile shell never renders UserMenu anyway —
 * the export exists only to keep transitive imports resolving during
 * the mobile build.
 */

export async function signOutAction(): Promise<void> {
  return;
}
