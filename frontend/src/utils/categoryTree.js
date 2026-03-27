export function buildCategoryTree(flatList) {
    if (!Array.isArray(flatList) || flatList.length === 0) return [];

    const byId = new Map();
    flatList.forEach((item) => {
        const id = item.id ?? item.categoryId;
        byId.set(id, { ...item, id, children: [] });
    });

    const roots = [];
    flatList.forEach((item) => {
        const node = byId.get(item.id ?? item.categoryId);
        if (!node) return;

        const parentId = item.parentId ?? item.parent_id ?? null;
        if (parentId == null) {
            roots.push(node);
            return;
        }

        const parent = byId.get(parentId);
        if (parent) parent.children.push(node);
        else roots.push(node);
    });

    return roots;
}
