import {defineStore} from "pinia";
import axios from "axios";
import {BarRequest, Drink, DrinkRecord, LogItem, Order, OrderForm, UserRecord, tempOrder} from "@/molecules/types";
import {useToast} from "vue-toastification";
import {v4 as uuidv4} from "uuid";

const toast = useToast();

interface BillDetail {
  name: string;
  bill: string;
  drinks: { [key: string]: number };
}

// Get API_URL from localStorage or use default
const DEFAULT_API_URL = `${window.location.protocol}//${window.location.hostname}:5000`;
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
    SAVED_ORDERS_AMOUNT: 20,
    SHOWN_ORDERS_AMOUNT: 10,
    drinks: [] as string[],
    drinks2: [] as Drink[],
    names: [] as string[],
    currentOrder: {
      id: "",
      drink: "" as string,
      name: "" as string,
      amount: 1,
      isSent: false,
    } as Order,
    orders: [] as Order[],
    currentRequest: {} as BarRequest,
    requestList: JSON.parse(localStorage.getItem("requestList") || "[]") as BarRequest[],
    sendingRequests: false,
    sohvik: JSON.parse(localStorage.getItem("sohvik") || "false") as boolean,
    isConnected: true,
    connectionCheckInterval: null as number | null,

    bills: [] as BillDetail[],
    isFetchingBills: false,
    logs: [] as LogItem[],
    isFetchingLogs: false,

    adminDrinks: [] as DrinkRecord[],
    adminUsers: [] as UserRecord[],
    isFetchingAdminDrinks: false,
    isFetchingAdminUsers: false,
  }),
  actions: {
    setSohvik(value: boolean) {
      this.sohvik = value;
      localStorage.setItem("sohvik", JSON.stringify(value));
    },
    async checkConnection() {
      try {
        await axios.get(API_URL, {timeout: 5000});
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

    async updateDrinks() {
      if (this.sohvik) {
        await this.fetchDrinks2()
      } else {
        await this.fetchDrinks();
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
        for (const item of response.data) {
          const newOrder: Order = {
            id: item.orderId || item.id,
            drink: item.drinkName || item.drink,
            name: item.customerName || item.customer,
            amount: item.quantity,
            isSent: true,
          };
          this.addToOrders(newOrder);
        }
        localStorage.setItem("orders", JSON.stringify(this.orders));
        showSuccessToast("Tellimused laetud")
      } catch (error) {
        console.error("Error fetching orders", error);
        showErrorToast("Tellimuste laadimine ebaõnnestus");
      }
    },

    async fetchBills(reFetchTimeout: number = 1000) {
      try {
        console.log('Fetching bills for statistics (store)');
        this.isFetchingBills = true;
        const response = await axios.get(API_URL + '/bills');
        this.bills = response.data;
        this.isFetchingBills = false;
        showSuccessToast('Statistika laetud');
      } catch (error) {
        console.error('Error fetching bills:', error);
        showErrorToast('Statistika laadimine ebaõnnestus');
        setTimeout(() => {
          this.fetchBills(reFetchTimeout * 1.5);
        }, reFetchTimeout);
      }
    },

    async getLogs() {
      try {
        this.isFetchingLogs = true;
        const response = await axios.get(API_URL + "/admin/logs");
        this.logs = response.data || [];
        this.isFetchingLogs = false;
        return this.logs;
      } catch (error) {
        console.error("Error fetching logs", error);
        showErrorToast("Logide laadimine ebaõnnestus");
        this.isFetchingLogs = false;
        return [];
      }
    },

    async fetchAdminDrinks() {
      try {
        this.isFetchingAdminDrinks = true;
        const response = await axios.get(API_URL + "/joogid");
        this.adminDrinks = response.data || [];
        this.isFetchingAdminDrinks = false;
        return this.adminDrinks;
      } catch (error) {
        console.error("Error fetching admin drinks", error);
        showErrorToast("Jookide laadimine ebaõnnestus");
        this.isFetchingAdminDrinks = false;
        return [];
      }
    },

    async getAdminDrink(id: string | number) {
      try {
        const response = await axios.get(API_URL + `/joogid/${id}`);
        return response.data as DrinkRecord;
      } catch (error) {
        console.error("Error fetching admin drink", error);
        showErrorToast("Joogi laadimine ebaõnnestus");
        return null;
      }
    },

    async createAdminDrink(
      payload: { name: string; price: number },
      options?: { refresh?: boolean; silent?: boolean }
    ) {
      try {
        await axios.post(API_URL + "/joogid", payload, {headers: API_HEADERS});
        if (!options?.silent) {
          showSuccessToast("Jook lisatud");
        }
        if (options?.refresh !== false) {
          await this.fetchAdminDrinks();
        }
        return true;
      } catch (error) {
        console.error("Error creating admin drink", error);
        if (!options?.silent) {
          showErrorToast("Joogi lisamine ebaõnnestus");
        }
        return false;
      }
    },

    async updateAdminDrink(id: string | number, payload: { name?: string; price?: number }) {
      try {
        await axios.put(API_URL + `/joogid/${id}`, payload, {headers: API_HEADERS});
        showSuccessToast("Jook muudetud");
        await this.fetchAdminDrinks();
      } catch (error) {
        console.error("Error updating admin drink", error);
        showErrorToast("Joogi muutmine ebaõnnestus");
      }
    },

    async deleteAdminDrink(id: string | number) {
      try {
        await axios.delete(API_URL + `/joogid/${id}`, {headers: API_HEADERS});
        showSuccessToast("Jook kustutatud");
        await this.fetchAdminDrinks();
      } catch (error) {
        console.error("Error deleting admin drink", error);
        showErrorToast("Joogi kustutamine ebaõnnestus");
      }
    },

    async fetchAdminUsers() {
      try {
        this.isFetchingAdminUsers = true;
        const response = await axios.get(API_URL + "/kasutajad");
        this.adminUsers = response.data || [];
        this.isFetchingAdminUsers = false;
        return this.adminUsers;
      } catch (error) {
        console.error("Error fetching admin users", error);
        showErrorToast("Kasutajate laadimine ebaõnnestus");
        this.isFetchingAdminUsers = false;
        return [];
      }
    },

    async getUser(id: string | number) {
      try {
        const response = await axios.get(API_URL + `/kasutajad/${id}`);
        return response.data as UserRecord;
      } catch (error) {
        console.error("Error fetching admin user", error);
        showErrorToast("Kasutaja laadimine ebaõnnestus");
        return null;
      }
    },

    async createAdminUser(
      payload: { name: string; email?: string; username?: string },
      options?: { refresh?: boolean; silent?: boolean }
    ) {
      try {
        await axios.post(API_URL + "/kasutajad", payload, {headers: API_HEADERS});
        if (!options?.silent) {
          showSuccessToast("Kasutaja lisatud");
        }
        if (options?.refresh !== false) {
          await this.fetchAdminUsers();
        }
        return true;
      } catch (error) {
        console.error("Error creating admin user", error);
        if (!options?.silent) {
          showErrorToast("Kasutaja lisamine ebaõnnestus");
        }
        return false;
      }
    },

    async updateAdminUser(id: string | number, payload: { name?: string; email?: string }) {
      try {
        await axios.put(API_URL + `/kasutajad/${id}`, payload, {headers: API_HEADERS});
        showSuccessToast("Kasutaja muudetud");
        await this.fetchAdminUsers();
      } catch (error) {
        console.error("Error updating admin user", error);
        showErrorToast("Kasutaja muutmine ebaõnnestus");
      }
    },

    async deleteAdminUser(id: string | number) {
      try {
        await axios.delete(API_URL + `/kasutajad/${id}`, {headers: API_HEADERS});
        showSuccessToast("Kasutaja kustutatud");
        await this.fetchAdminUsers();
      } catch (error) {
        console.error("Error deleting admin user", error);
        showErrorToast("Kasutaja kustutamine ebaõnnestus");
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
      newOrder.id = uuidv4();
      this.requestList.push({type: 0, order: newOrder, oldOrder: newOrder} as BarRequest);
      localStorage.setItem("requestList", JSON.stringify(this.requestList));
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
        showErrorToast("Tellimuse muutmine ebaõnnestus: vigased tellimuse andmed");
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
        orderId: newOrder.id,
        customerName: newOrder.name,
        drinkName: newOrder.drink,
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
        await axios.post(API_URL + "/orders", {orders}, {headers: API_HEADERS});
        showSuccessToast("Tellimused esitatud");
      } catch (error) {
        console.error("Error adding orders", error);
        showErrorToast("Tellimuste esitamine ebaõnnestus");
      }
      for (const order of orders) {
        const newOrder: Order = {
          id: order.orderId || uuidv4(),
          drink: order.drinkName,
          name: order.customerName,
          amount: order.quantity,
          isSent: true,
        }
        this.addToOrders(newOrder);
      }
    },

    async sendTempOrders(orders: tempOrder[]) {
      if (!orders || orders.length === 0) return;
      const fullOrders: OrderForm[] = orders.map(o => ({
        orderId: uuidv4(),
        customerName: "Sohviku klient",
        drinkName: o.drink,
        quantity: o.amount,
      }));
      await this.sendAddOrders(fullOrders);
    },

    async sendCancelOrder(order: Order) {
      console.log("Cancelling order", order)
      if (!order.isSent) {
        showErrorToast("Tellimust ei saa tühistada");
        return;
      }

      try {
        const response = await axios.post(API_URL + "/order/cancel", {orderId: order.id}, {headers: API_HEADERS});
        if (response.status === 200 && response.data && response.data.cancelled) {
          this.removeFromOrders(order);
          showSuccessToast("Tellimus tühistatud:\n" + order.name + ": " + order.amount + "x" + order.drink);
        } else {
          const reason = response.data && response.data.reason ? response.data.reason : '';
          showErrorToast("Tellimuse tühistamine ebaõnnestus" + (reason ? (": " + reason) : ""));
          this.requestList.unshift({type: 2, order: order, oldOrder: order} as BarRequest);
          localStorage.setItem("requestList", JSON.stringify(this.requestList));
          this.sendingRequests = false;
        }
      } catch (error: any) {
        console.error("Error cancelling order", error);
        if (error.response) {
          if (error.response.status === 404) {
            showErrorToast("Tellimust ei leitud (404)");
          } else if (error.response.status === 400) {
            showErrorToast("Vigane tellimuse payload (400)");
          } else {
            showErrorToast("Tellimuse tühistamine ebaõnnestus");
            this.requestList.unshift({type: 2, order: order, oldOrder: order} as BarRequest);
            localStorage.setItem("requestList", JSON.stringify(this.requestList));
            this.sendingRequests = false;
          }
        } else {
          showErrorToast("Tellimuse tühistamine ebaõnnestus (ühendus)");
          this.requestList.unshift({type: 2, order: order, oldOrder: order} as BarRequest);
          localStorage.setItem("requestList", JSON.stringify(this.requestList));
          this.sendingRequests = false;
          this.isConnected = false;
        }
      }
    },

    async sendChangeOrder(oldOrder: Order, editedOrder: Order) {
      const old = {...oldOrder};
      const edited = {...editedOrder};
      console.log("Changing order from", old, "to", edited);
      const payload = {
        oldOrderId: old.id,
        order: {
          customerName: edited.name,
          drinkName: edited.drink,
          quantity: edited.amount,
        }
      }

      try {
        const response = await axios.put(API_URL + "/order", payload, {headers: API_HEADERS});
        if (response.status === 200 && response.data && (response.data.updated || response.data.success)) {
          const newOrderId = response.data.newOrderId || edited.id;
          const idx = this.orders.findIndex(o => o.id === old.id);
          const updatedOrder: Order = {
            id: newOrderId,
            name: edited.name,
            drink: edited.drink,
            amount: edited.amount,
            isSent: true,
          };
          if (idx !== -1) {
            this.orders[idx] = updatedOrder;
          } else {
            this.addToOrders(updatedOrder);
          }
          localStorage.setItem("orders", JSON.stringify(this.orders));
          showSuccessToast("Tellimus muudetud:\n" + edited.name + ": " + edited.amount + "x" + edited.drink);
        } else {
          const reason = response.data && response.data.reason ? response.data.reason : '';
          showErrorToast("Tellimuse muutmine ebaõnnestus" + (reason ? (": " + reason) : ""));
          this.requestList.unshift({type: 1, order: edited, oldOrder: old} as BarRequest);
          localStorage.setItem("requestList", JSON.stringify(this.requestList));
          this.sendingRequests = false;
        }
      } catch (error: any) {
        console.error("Error changing order", error);
        if (error.response) {
          if (error.response.status === 404) {
            showErrorToast("Tellimust ei leitud (404)");
          } else if (error.response.status === 400) {
            showErrorToast("Vigane tellimuse payload (400)");
          } else {
            showErrorToast("Tellimuse muutmine ebaõnnestus");
            this.requestList.unshift({type: 1, order: edited, oldOrder: old} as BarRequest);
            localStorage.setItem("requestList", JSON.stringify(this.requestList));
            this.sendingRequests = false;
          }
        } else {
          showErrorToast("Tellimuse muutmine ebaõnnestus (ühendus)");
          this.requestList.unshift({type: 1, order: edited, oldOrder: old} as BarRequest);
          localStorage.setItem("requestList", JSON.stringify(this.requestList));
          this.sendingRequests = false;
          this.isConnected = false;
        }
      }
    },

    async adminCancelLog(orderId: string) {
      try {
        await axios.post(API_URL + "/order/cancel", {orderId}, {headers: API_HEADERS});
        showSuccessToast('Tellimus tühistatud (admin)');
        await this.getLogs();
      } catch (error) {
        console.error('Admin cancel error', error);
        showErrorToast('Tellimuse tühistamine ebaõnnestus (admin)');
      }
    },
  }
})
