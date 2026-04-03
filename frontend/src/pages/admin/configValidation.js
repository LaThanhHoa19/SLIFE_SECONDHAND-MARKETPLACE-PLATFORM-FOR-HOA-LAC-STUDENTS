function buildRangeHint(meta) {
    const min = Number.isFinite(meta?.min) ? meta.min : null;
    const max = Number.isFinite(meta?.max) ? meta.max : null;
    if (min == null && max == null) return '';
    if (min != null && max != null) return `Giá trị hợp lệ: ${min}–${max}.`;
    if (min != null) return `Giá trị hợp lệ: ≥ ${min}.`;
    return `Giá trị hợp lệ: ≤ ${max}.`;
}

export function isIntegerValidation(meta) {
    return String(meta?.type ?? '').toLowerCase() === 'integer';
}

export function sanitizeUnsignedIntegerInput(raw) {
    return String(raw ?? '').replace(/\D+/g, '');
}

export function validateConfigByMeta(meta, raw) {
    const s = String(raw ?? '').trim();
    if (s === '') return { ok: false, message: 'Vui lòng nhập giá trị.' };

    if (!isIntegerValidation(meta)) {
        return { ok: true, value: s };
    }

    if (/^-/.test(s)) return { ok: false, message: 'Không được nhập số âm.' };

    const n = Number.parseInt(s, 10);
    if (Number.isNaN(n)) return { ok: false, message: 'Chỉ nhập số nguyên.' };
    if (n < 0) return { ok: false, message: 'Không được nhập số âm.' };

    const min = Number.isFinite(meta?.min) ? meta.min : null;
    const max = Number.isFinite(meta?.max) ? meta.max : null;
    if ((min != null && n < min) || (max != null && n > max)) {
        return { ok: false, message: meta?.hint || buildRangeHint(meta) || 'Giá trị không hợp lệ.' };
    }

    return { ok: true, value: String(n) };
}

export function getValidationHint(meta) {
    if (!meta) return '';
    return String(meta?.hint ?? '').trim() || buildRangeHint(meta);
}

export function extractApiErrorMessage(error, fallback) {
    return (
        error?.raw?.response?.data?.message ||
        error?.raw?.response?.data?.error ||
        error?.message ||
        fallback
    );
}

export function mapApiValidationErrors(error, editingKey) {
    const payload = error?.raw?.response?.data;
    const details = payload?.errors;
    const topMessage = String(payload?.message || payload?.error || error?.message || '').trim();
    const keyLower = String(editingKey ?? '').toLowerCase();

    let valueError = '';
    let descriptionError = '';

    if (details && typeof details === 'object') {
        for (const [field, rawMsg] of Object.entries(details)) {
            const fieldName = String(field || '').toLowerCase();
            const msg = String(rawMsg ?? '').trim();
            if (!msg) continue;

            if (fieldName.includes('description')) {
                descriptionError = descriptionError || msg;
                continue;
            }

            if (
                fieldName.includes('value') ||
                fieldName.includes('configvalue') ||
                fieldName.includes('config_value') ||
                fieldName === keyLower
            ) {
                valueError = valueError || msg;
            }
        }
    }

    const fullText = [topMessage, JSON.stringify(details || {})].join(' ').toLowerCase();
    if (!descriptionError && (fullText.includes('description') || fullText.includes('mô tả'))) {
        descriptionError = topMessage || 'Mô tả không hợp lệ.';
    }
    if (
        !valueError &&
        (fullText.includes('value') ||
            fullText.includes('giá trị') ||
            (keyLower && fullText.includes(keyLower)))
    ) {
        valueError = topMessage || 'Giá trị không hợp lệ.';
    }

    return { valueError, descriptionError, topMessage };
}

export function withSourcePrefix(message, source) {
    if (!message) return '';
    if (!import.meta?.env?.DEV) return message;
    const prefix = source === 'server' ? '(Server) ' : '(Client) ';
    return `${prefix}${message}`;
}
