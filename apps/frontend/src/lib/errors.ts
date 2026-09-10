// src/lib/errors.ts

/** Surfaces the backend's `{ error: string }` body when present, so mutation error
 *  toasts show the exact legacy strings from robago-prd.md §8 (e.g. "Can't delete.
 *  Dependent data exists.") instead of a generic fallback. */
export function getErrorMessage(err: unknown, fallback: string): string {
    if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error ===
            "string"
    ) {
        return (err as { response: { data: { error: string } } }).response.data.error;
    }
    return fallback;
}

/** Extracts the backend's `{ fieldErrors: Record<string,string> } }` body, for surfacing
 *  server-side validation (e.g. duplicate phone number) on the specific RHF field. */
export function getFieldErrors(err: unknown): Record<string, string> | undefined {
    if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { fieldErrors?: unknown } } }).response?.data
            ?.fieldErrors === "object"
    ) {
        return (err as { response: { data: { fieldErrors: Record<string, string> } } }).response
            .data.fieldErrors;
    }
    return undefined;
}
