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
