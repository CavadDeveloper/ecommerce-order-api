export class OrderCreatedEvent {
  constructor(
    public readonly orderId: number,
    public readonly userId: number,
    public readonly totalAmount: number,
  ) {}
}
export class OrderPaidEvent {
  constructor(
    public readonly orderId: number,
    public readonly userId: number,
  ) {}
}
export class OrderShippedEvent {
  constructor(
    public readonly orderId: number,
    public readonly userId: number,
  ) {}
}
export class OrderDeliveredEvent {
  constructor(
    public readonly orderId: number,
    public readonly userId: number,
  ) {}
}
