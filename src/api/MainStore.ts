import {defineStore} from "pinia";
import axios from "axios";
import {Order, OrderForm} from "../molecules/types";
import {useToast} from "vue-toastification";
import {Constants} from "../molecules/Constants";

const toast = useToast();

export const API_URL: string = "http://localhost:5000";
export const API_HEADERS: {} = {'content-type': 'application/json'};

function showSuccessToast(text: string) {
  toast.success(text);
}

function showErrorToast(text: string) {
  toast.error(text);
}

export const useMainStore = defineStore('main', {
  state: () => ({
    orderId: 0,
    drinks: [] as string[],
    names: [] as string[],
    currentOrder: {
      id: null,
      drink: "" as string,
      name: "" as string,
      amount: 1,
      isSent: false,
    } as Order,
    orders: [] as Order[],
    loading: [] as string[],
  }),
  actions: {
    async fetchDrinks() {
      console.log("Fetching drinks")
      try {
        const response = await axios.get(API_URL + "/drinks");
        this.drinks = response.data;
        localStorage.setItem("drinks", JSON.stringify(this.drinks));
        showSuccessToast("Joogid laetud")
      } catch (error) {
        console.error("Error fetching drinks", error);
        showErrorToast("Jookide laadimine ebaõnnestus");
      }
    },

    async fetchNames() {
      console.log("Fetching names")
      try {
        const response = await axios.get(API_URL + "/names");
        this.names = response.data;
        localStorage.setItem("names", JSON.stringify(this.names));
        showSuccessToast("Nimed laetud")
      } catch (error) {
        showErrorToast("Nimede laadimine ebaõnnestus");
      }
    },

    addToOrders(order: Order) {
      this.orders.unshift(order);
      if (this.orders.length > Constants.SAVED_ORDERS_AMOUNT) this.orders.pop();
      localStorage.setItem("orders", JSON.stringify(this.orders));
    },

    removeFromOrders(order: Order) {
      this.orders = this.orders.filter((o: Order) => o.id !== order.id);
      localStorage.setItem("orders", JSON.stringify(this.orders));
    },

    addToLoading(loading: string) {
      this.loading.push(loading);
    },

    removeFromLoading(loading: string) {
      this.loading = this.loading.filter((l: string) => l !== loading);
    },

    async addOrder(newOrder: Order, timeOut: number = 0) {
      console.log("Adding order", newOrder)
      this.addToLoading("add")

      if (!newOrder.drink || !newOrder.name) {
        showErrorToast("Vali jook ja nimi");
        this.removeFromLoading("add")
        return;
      }

      const sentOrder: OrderForm = {
        customer_name: newOrder.name,
        drink_name: newOrder.drink,
        quantity: newOrder.amount,
      }

      try {
        await axios.post(API_URL + "/order", sentOrder, {headers: API_HEADERS});
        newOrder.isSent = true;
        newOrder.id = this.orderId++;
        this.addToOrders(newOrder);
        showSuccessToast("Tellimus esitatud:\n"
          + newOrder.name + ": " + newOrder.amount + "x" + newOrder.drink);
        this.removeFromLoading("add")
      } catch (error) {
        console.error("Error adding order", error);
        showErrorToast("Tellimuse esitamine ebaõnnestus:\n"
          + newOrder.name + ": " + newOrder.amount + "x" + newOrder.drink);
        setTimeout(() => {}, timeOut)
        await this.addOrder(newOrder, timeOut + 5000);
      }
      console.log(this.orders)
    },

    async cancelOrder(order: Order) {
      console.log("Cancelling order", order)
      this.addToLoading("cancel")
      if (!order.isSent) {
        showErrorToast("Tellimust ei saa tühistada");
        return;
      }

      const sentOrder: OrderForm = {
        customer_name: order.name,
        drink_name: order.drink,
        quantity: -order.amount,
      }
      try {
        await axios.post(API_URL + "/order", sentOrder, {headers: API_HEADERS});
        this.removeFromOrders(order);
        showSuccessToast("Tellimus tühistatud:\n"
          + order.name + ": " + order.amount + "x" + order.drink);
      } catch (error) {
        console.error("Error cancelling order", error);
        showErrorToast("Tellimuse tühistamine ebaõnnestus:\n"
          + order.name + ": " + order.amount + "x" + order.drink);
      }
      this.removeFromLoading("cancel")
    },

    async changeOrder(oldOrder: Order, editedOrder: Order) {
      const old = {...oldOrder};
      const edited = {...editedOrder};
      this.addToLoading("change")
      console.log("Changing order from", old, "to",edited)
      await this.cancelOrder(old);
      await this.addOrder(edited);
      this.removeFromLoading("change")
    }
  }
})
