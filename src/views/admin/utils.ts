export function getItemId(item: Record<string, any>): string | number | null {
  return item.id ?? item._id ?? item.uuid ?? item.userId ?? item.drinkId ?? null;
}
