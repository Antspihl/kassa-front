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
