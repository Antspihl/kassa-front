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

export type DrinkRecord = {
  id: string | number;
  name: string;
  price: number;
}

export type UserRecord = {
  id: string | number;
  name: string;
  email: string;
}

export type OrderForm = {
  orderId: string,
  customerName: string,
  drinkName: string,
  quantity: number,
}

export type BarRequest = {
  type: number; // 0 - add, 1 - change, 2 - cancel
  order: Order;
  oldOrder: Order;
}

export type LogItem = {
  timestamp: string,
  orderId: string,
  customerName: string,
  drinkName: string,
  quantity: number,
  cancellationTimestamp?: string,
}
