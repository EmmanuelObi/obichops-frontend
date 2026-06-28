import type { DayOfWeek } from "@/types/vendor";

export interface CartLineForPacks {
  menuItemId: string;
  dayOfWeek: DayOfWeek;
  quantity: number;
}

export function filterFoodCartLines<T extends CartLineForPacks>(
  lines: T[],
  packItemIds: Set<string>,
): T[] {
  return lines.filter((line) => !packItemIds.has(line.menuItemId));
}

export interface FoodMenuItemForPacks {
  id: string;
  dayOfWeek: DayOfWeek;
  packsRequired?: number;
}

export interface PackMenuItemForDay {
  id: string;
  dayOfWeek: DayOfWeek;
  priceCents: number;
}

export function computePackQuantityForDay(
  foodLines: Array<{ quantity: number; packsRequired: number }>,
): number {
  const itemPacks = foodLines.reduce(
    (sum, line) => sum + line.packsRequired * line.quantity,
    0,
  );
  return Math.max(1, itemPacks);
}

export function computePackSummary(
  cart: CartLineForPacks[],
  menu: FoodMenuItemForPacks[],
  packMenu: PackMenuItemForDay[],
): {
  totalPacks: number;
  totalPackCents: number;
  packLines: Array<{ dayOfWeek: DayOfWeek; quantity: number; unitPriceCents: number }>;
} {
  const menuById = new Map(menu.map((item) => [item.id, item]));
  const packByDay = new Map(packMenu.map((item) => [item.dayOfWeek, item]));

  const linesByDay = new Map<
    DayOfWeek,
    Array<{ quantity: number; packsRequired: number }>
  >();

  for (const line of cart) {
    if (line.quantity <= 0) continue;
    const item = menuById.get(line.menuItemId);
    if (!item) continue;

    const existing = linesByDay.get(line.dayOfWeek) ?? [];
    existing.push({
      quantity: line.quantity,
      packsRequired: item.packsRequired ?? 0,
    });
    linesByDay.set(line.dayOfWeek, existing);
  }

  let totalPacks = 0;
  let totalPackCents = 0;
  const packLines: Array<{
    dayOfWeek: DayOfWeek;
    quantity: number;
    unitPriceCents: number;
  }> = [];

  for (const [day, foodLines] of linesByDay) {
    const packItem = packByDay.get(day);
    if (!packItem) continue;
    const qty = computePackQuantityForDay(foodLines);
    totalPacks += qty;
    totalPackCents += qty * packItem.priceCents;
    packLines.push({
      dayOfWeek: day,
      quantity: qty,
      unitPriceCents: packItem.priceCents,
    });
  }

  return { totalPacks, totalPackCents, packLines };
}
