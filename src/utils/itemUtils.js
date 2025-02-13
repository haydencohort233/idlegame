import items from "../data/items.json";

export function getItem(itemId) {
    return items[itemId] || null;
}
