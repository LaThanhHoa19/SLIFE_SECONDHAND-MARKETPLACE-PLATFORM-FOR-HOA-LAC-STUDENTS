/**
 * Snapshot user admin cho RouteGuard (không phụ thuộc render order của React).
 */
let adminUserSnapshot = null;

export function setAdminUserSnapshot(user) {
    adminUserSnapshot = user || null;
}

export function getAdminUserSnapshot() {
    return adminUserSnapshot;
}

export function clearAdminUserSnapshot() {
    adminUserSnapshot = null;
}
