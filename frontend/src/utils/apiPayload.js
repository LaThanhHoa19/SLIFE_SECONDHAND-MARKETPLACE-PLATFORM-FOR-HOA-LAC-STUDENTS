/**
 * Unwrap common API payload shapes used across the app.
 * Many endpoints return: { data: { data: ... } }
 * Others return: { data: ... }
 */
export function unwrapApiData(res) {
    const body = res?.data;
    return body?.data ?? body;
}

