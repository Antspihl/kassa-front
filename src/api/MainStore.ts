import {defineStore} from "pinia";
import axios from "axios";
import {BarRequest, Order, OrderForm} from "../molecules/types";
import {useToast} from "vue-toastification";

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
    SAVED_ORDERS_AMOUNT: 20,
    SHOWN_ORDERS_AMOUNT: 10,
    drinks: [] as string[],
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
    requestList: [] as BarRequest[],
    sendingRequests: false,
  }),
  actions: {
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
      console.log("Sending requests")
      this.sendingRequests = true;
      while (this.requestList.length > 0) {
        // @ts-ignore
        this.currentRequest = this.requestList.shift();
        if (!this.currentRequest) continue;
        if (this.currentRequest.type === 0) {
          await this.addOrder(this.currentRequest.order);
        } else if (this.currentRequest.type === 1) {
          await this.changeOrder(this.currentRequest.oldOrder, this.currentRequest.order);
        } else if (this.currentRequest.type === 2) {
          await this.cancelOrder(this.currentRequest.order);
        }
      }
      this.currentRequest = {} as BarRequest;
      this.sendingRequests = false;
    },

    async addOrder(newOrder: Order, timeOut: number = 0) {
      console.log("Adding order", newOrder)

      if (!newOrder.drink || !newOrder.name) {
        showErrorToast("Vali jook ja nimi");
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
      } catch (error) {
        console.error("Error adding order", error);
        showErrorToast("Tellimuse esitamine ebaõnnestus:\n"
          + newOrder.name + ": " + newOrder.amount + "x" + newOrder.drink);
        setTimeout(() => {
        }, timeOut)
        await this.addOrder(newOrder, 5000);
      }
      console.log(this.orders)
    },

    async cancelOrder(order: Order) {
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
      }
    },

    async changeOrder(oldOrder: Order, editedOrder: Order) {
      const old = {...oldOrder};
      const edited = {...editedOrder};
      console.log("Changing order from", old, "to", edited)
      await this.cancelOrder(old);
      await this.addOrder(edited);
    }
  }
})
