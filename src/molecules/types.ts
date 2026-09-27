export type Order = {
  id: string;
  drink: string;
  name: string;
  amount: number;
  isSent: boolean;
};

export type tempOrder = {
  drink: string;
  amount: number
  price: number;
}

export type Drink = {
  name: string;
  price: number;
}

export type OrderForm = {
  order_id: string,
  customer_name: string,
  drink_name: string,
  quantity: number,
}

export type BarRequest = {
  type: number; // 0 - add, 1 - change, 2 - cancel, 3 - paid batch
  order: Order;
  oldOrder: Order;
  batch?: OrderForm[];
}

export type LogItem = {
  timestamp: string,
  order_id: string,
  customer_name: string,
  drink_name: string,
  quantity: number,
  cancellation_timestamp?: string,
}
