import {defineStore} from "pinia";
import axios from "axios";
import {BarRequest, Drink, Order, OrderForm} from "@/molecules/types";
import {useToast} from "vue-toastification";

const toast = useToast();

// Get API_URL from localStorage or use default
const DEFAULT_API_URL = "http://localhost:5000";
export let API_URL: string = localStorage.getItem("API_URL") || DEFAULT_API_URL;

export const API_HEADERS: {} = {'content-type': 'application/json'};

export function setApiUrl(url: string) {
  API_URL = url;
  localStorage.setItem("API_URL", url);
}

function showSuccessToast(text: string) {
  toast.success(text);
}

function showErrorToast(text: string) {
  toast.error(text);
}

export const useMainStore = defineStore('main', {
  state: () => ({
    apiUrl: API_URL,
    orderId: 0,
    SAVED_ORDERS_AMOUNT: 20,
    SHOWN_ORDERS_AMOUNT: 10,
    drinks: [] as string[],
    drinks2: [] as Drink[],
    names: [] as string[],
    currentOrder: {
      id: 0,
      drink: "" as string,
      name: "" as string,
      amount: 1,
      isSent: false,
    } as Order,
    orders: [] as Order[],
    currentRequest: {} as BarRequest,
    requestList: JSON.parse(localStorage.getItem("requestList") || "[]") as BarRequest[],
    sendingRequests: false,
    sohvik: false,
    isConnected: true,
    connectionCheckInterval: null as number | null,
  }),
  actions: {
    async checkConnection() {
      try {
        await axios.get(API_URL, { timeout: 5000 });
        if (!this.isConnected) {
          this.isConnected = true;
          showSuccessToast("Ühendus taastatud");
          if (this.requestList.length > 0) {
            await this.startSendingRequests();
          }
        }
        return true;
      } catch (error) {
        if (this.isConnected) {
          this.isConnected = false;
          showErrorToast("Ühendus serveriga katkes");
        }
        return false;
      }
    },

    startConnectionCheck() {
      this.checkConnection();

      if (this.connectionCheckInterval) {
        clearInterval(this.connectionCheckInterval);
      }
      this.connectionCheckInterval = window.setInterval(() => {
        this.checkConnection();
      }, 5000);
    },

    stopConnectionCheck() {
      if (this.connectionCheckInterval) {
        clearInterval(this.connectionCheckInterval);
        this.connectionCheckInterval = null;
      }
    },

    async fetchDrinks() {
      console.log("Fetching drinks")
      this.drinks = []
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

    async fetchDrinks2() {
      console.log("Fetching drinks2")
      this.drinks2 = []
      try {
        const response = await axios.get(API_URL + "/drinks2");
        this.drinks2 = response.data;
        localStorage.setItem("drinks2", JSON.stringify(this.drinks2));
        showSuccessToast("Joogid2 laetud")
      } catch (error) {
        console.error("Error fetching drinks", error);
        showErrorToast("Jookide2 laadimine ebaõnnestus");
      }
    },

    async fetchNames() {
      console.log("Fetching names")
      this.names = []
      try {
        const response = await axios.get(API_URL + "/names");
        this.names = response.data;
        localStorage.setItem("names", JSON.stringify(this.names));
        showSuccessToast("Nimed laetud")
      } catch (error) {
        showErrorToast("Nimede laadimine ebaõnnestus");
      }
    },

    async fetchOrders() {
      console.log("Fetching orders")
      try {
        const response = await axios.get(API_URL + "/orders");
        let newOrder: Order;
        for (let order in response.data) {
          newOrder = {
            id: this.orderId++,
            drink: response.data[order].drink_name,
            name: response.data[order].customer_name,
            amount: response.data[order].quantity,
            isSent: true,
          }
          this.addToOrders(newOrder);
        }
        localStorage.setItem("orders", JSON.stringify(this.orders));
        showSuccessToast("Tellimused laetud")
      } catch (error) {
        console.error("Error fetching orders", error);
        showErrorToast("Tellimuste laadimine ebaõnnestus");
      }
    },

    getPrice() {
      const drink = this.drinks2.find(d => d.name === this.currentOrder.drink);
      if (drink) {
        return drink.price;
      }
      return 0;
    },

    clearOrders() {
      this.orders = [];
      localStorage.setItem("orders", JSON.stringify(this.orders));
    },

    refreshOrders() {
      this.clearOrders();
      this.fetchOrders();
    },

    addToOrders(order: Order) {
      this.orders.unshift(order);
      if (this.orders.length > this.SAVED_ORDERS_AMOUNT) this.orders.pop();
      localStorage.setItem("orders", JSON.stringify(this.orders));
    },

    removeFromOrders(order: Order) {
      this.orders = this.orders.filter((o: Order) => o.id !== order.id);
      localStorage.setItem("orders", JSON.stringify(this.orders));
    },

    addOrderRequest(newOrder: Order) {
      for (const element of this.requestList) {
        if (element.order.id === newOrder.id) {
          showErrorToast("Tellimus juba järjekorras");
          return;
        }
      }
      console.log("Adding order request", newOrder)
      if (!newOrder.drink || !newOrder.name) {
        showErrorToast("Vali jook ja nimi");
        return;
      }
      newOrder.id = this.orderId++;
      this.requestList.push({type: 0, order: newOrder, oldOrder: newOrder} as BarRequest);
      this.startSendingRequests();
    },

    addChangeOrderRequest(oldOrder: Order, editedOrder: Order) {
      for (const element of this.requestList) {
        if (element.order.id === editedOrder.id) {
          showErrorToast("Tellimus juba muutmise järjekorras");
          return;
        }
      }
      console.log("Adding change order request", oldOrder, editedOrder)
      if (!editedOrder.drink || !editedOrder.name || !oldOrder.drink || !oldOrder.name) {
        showErrorToast("");
        return;
      }
      this.requestList.push({type: 1, order: editedOrder, oldOrder: oldOrder} as BarRequest);
      this.startSendingRequests();
    },

    addCancelOrderRequest(order: Order) {
      for (const element of this.requestList) {
        if (element.order.id === order.id) {
          showErrorToast("Tellimus juba tühistamise järjekorras");
          return;
        }
      }
      console.log("Adding remove order request", order)
      this.orders = this.orders.filter((o: Order) => o.id !== order.id);
      this.requestList.push({type: 2, order: order, oldOrder: order} as BarRequest);
      this.startSendingRequests();
    },

    async startSendingRequests() {
      if (this.sendingRequests || this.requestList.length <= 0) return;

      if (!this.isConnected) {
        console.log("Not connected, waiting for connection...");
        return;
      }

      console.log("Sending requests")
      this.sendingRequests = true;
      while (this.requestList.length > 0) {
        if (!this.isConnected) {
          console.log("Connection lost during sending, pausing...");
          this.sendingRequests = false;
          return;
        }

        // @ts-ignore
        this.currentRequest = this.requestList.shift();
        localStorage.setItem("requestList", JSON.stringify(this.requestList));
        if (!this.currentRequest) continue;
        if (this.currentRequest.type === 0) {
          await this.sendAddOrder(this.currentRequest.order);
        } else if (this.currentRequest.type === 1) {
          await this.sendChangeOrder(this.currentRequest.oldOrder, this.currentRequest.order);
        } else if (this.currentRequest.type === 2) {
          await this.sendCancelOrder(this.currentRequest.order);
        }
      }
      this.currentRequest = {} as BarRequest;
      this.sendingRequests = false;
    },

    async sendAddOrder(newOrder: Order) {
      console.log("Adding order", newOrder)

      const sentOrder: OrderForm = {
        customer_name: newOrder.name,
        drink_name: newOrder.drink,
        quantity: newOrder.amount,
      }
      try {
        await axios.post(API_URL + "/order", sentOrder, {headers: API_HEADERS});
        newOrder.isSent = true;
        this.addToOrders(newOrder);
        showSuccessToast("Tellimus esitatud:\n"
          + newOrder.name + ": " + newOrder.amount + "x" + newOrder.drink);
      } catch (error) {
        console.error("Error adding order", error);
        showErrorToast("Tellimuse esitamine ebaõnnestus:\n"
          + newOrder.name + ": " + newOrder.amount + "x" + newOrder.drink);
        // Re-add to the front of the queue instead of infinite retry
        this.requestList.unshift({type: 0, order: newOrder, oldOrder: newOrder} as BarRequest);
        localStorage.setItem("requestList", JSON.stringify(this.requestList));
        this.sendingRequests = false;
        // Mark as disconnected to trigger connection check
        this.isConnected = false;
      }
    },

    async sendAddOrders(orders: OrderForm[]) {
      console.log("Adding orders", orders)
      try {
      await axios.post(API_URL + "/orders", { orders }, { headers: API_HEADERS });
        showSuccessToast("Tellimused esitatud");
      } catch (error) {
        console.error("Error adding orders", error);
        showErrorToast("Tellimuste esitamine ebaõnnestus");
      }
      for (const order of orders) {
        const newOrder: Order = {
          id: this.orderId++,
          drink: order.drink_name,
          name: order.customer_name,
          amount: order.quantity,
          isSent: true,
        }
        this.addToOrders(newOrder);
      }
    },

    async sendCancelOrder(order: Order) {
      console.log("Cancelling order", order)
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
        // Re-add to the front of the queue
        this.requestList.unshift({type: 2, order: order, oldOrder: order} as BarRequest);
        localStorage.setItem("requestList", JSON.stringify(this.requestList));
        this.sendingRequests = false;
        // Mark as disconnected to trigger connection check
        this.isConnected = false;
      }
    },

    async sendChangeOrder(oldOrder: Order, editedOrder: Order) {
      const old = {...oldOrder};
      const edited = {...editedOrder};
      console.log("Changing order from", old, "to", edited)
      await this.sendCancelOrder(old);
      await this.sendAddOrder(edited);
    }
  }
})
