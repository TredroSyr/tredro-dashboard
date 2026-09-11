/** Maps a notification's event_key + payload/data ids to the screen it should open (backend §7). */
export const resolveNotificationUrl = (
  eventKey: string | undefined,
  data: Record<string, unknown> | undefined,
): string => {
  const id = (key: string) => {
    const value = data?.[key];
    return value === undefined || value === null ? undefined : String(value);
  };

  switch (eventKey) {
    case "stock_transfer.requested":
    case "stock_transfer.dispatched":
    case "stock_transfer.modified":
    case "stock_transfer.confirmed":
    case "stock_transfer.received":
    case "stock_transfer.cancelled": {
      const stockTransferId = id("stock_transfer_id");
      return stockTransferId
        ? `/stock-transfers/detail?id=${stockTransferId}`
        : "/stock-transfers";
    }
    case "customer_request.created":
    case "customer_request.accepted":
    case "customer_request.rejected":
    case "customer_request.unassigned": {
      const customerRequestId = id("customer_request_id");
      return customerRequestId
        ? `/orders/detail?id=${customerRequestId}`
        : "/orders";
    }
    default:
      return "/notifications";
  }
};
