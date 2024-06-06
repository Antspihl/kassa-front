export type Order = {
  id: number;
  drink: string;
  name: string;
  amount: number;
  isSent: boolean;
};

export type OrderForm = {
  customer_name: string,
  drink_name: string,
  quantity: number,
}

export type BarRequest = {
  type: number; // 0 - add, 1 - change, 2 - cancel
  order: Order;
  oldOrder: Order;
}
