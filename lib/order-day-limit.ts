export function orderDayLimitMessage(
  maxOrderDays: number,
  context: "add" | "tab" | "inline",
) {
  const dayWord = maxOrderDays === 1 ? "day" : "days";
  if (context === "tab") {
    return `You've used all ${maxOrderDays} order ${dayWord} this week. Remove items from another day to order here.`;
  }
  if (context === "inline") {
    return `You've reached the ${maxOrderDays}-day limit for this week. Switch to a day you've already ordered on, or remove items from your cart.`;
  }
  return `You can only order on ${maxOrderDays} ${dayWord} this week. Remove items from another day to add here.`;
}

export function isUnderOrderDayAllowance(
  daysUsed: number,
  maxOrderDays: number,
) {
  return daysUsed > 0 && daysUsed < maxOrderDays;
}

export function incompleteOrderDaysTitle(daysUsed: number, maxOrderDays: number) {
  return `You've ordered for ${daysUsed} of ${maxOrderDays} days`;
}

export function incompleteOrderDaysDescription(maxOrderDays: number) {
  const dayWord = maxOrderDays === 1 ? "day" : "days";
  return `You can order on up to ${maxOrderDays} ${dayWord} this week. Switch days with the tabs above to add more, or submit with what you have.`;
}
