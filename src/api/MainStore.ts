import {defineStore} from "pinia";
import axios from "axios";
import {BarRequest, Drink, LogItem, Order, OrderForm, tempOrder} from "@/molecules/types";
import {useToast} from "vue-toastification";
import {v4 as uuidv4} from "uuid";

const toast = useToast();

interface BillDetail {
  name: string;
  bill: string;
  drinks: { [key: string]: number };
}

export const DEFAULT_API_URL = `${window.location.origin}/api`;
export function normalizeApiUrl(input: string): string {
  const value = input.trim();
  if (!value || value === '/api') return DEFAULT_API_URL;

  const hasProtocol = /^https?:\/\//i.test(value);
  const isRelative = value.startsWith('/');
  let url: URL;
  try {
    url = new URL(isRelative ? value : hasProtocol ? value : `${window.location.protocol}//${value}`, window.location.origin);
  } catch {
    throw new Error('Vigane API URL');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Vigane API URL');
  }
  if (!hasProtocol && !isRelative && !url.port) url.port = window.location.port;
  if (url.pathname === '/') url.pathname = '/api';
  return url.toString().replace(/\/$/, '');
}

function isLegacyApiUrl(url: string): boolean {
  if (url === '/api') return true;
  try {
    const parsed = new URL(url);
    if (['localhost', '127.0.0.1'].includes(parsed.hostname) && parsed.origin !== window.location.origin && /^\/api\/?$/.test(parsed.pathname)) return true;
    return parsed.port === '5000' && (parsed.hostname === 'localhost' || parsed.hostname === window.location.hostname);
  } catch {
    return false;
  }
}
function loadApiUrl(): string {
  const saved = localStorage.getItem('API_URL');
  if (!saved) return DEFAULT_API_URL;
  try {
    const normalized = isLegacyApiUrl(saved) ? DEFAULT_API_URL : normalizeApiUrl(saved);
    if (normalized === DEFAULT_API_URL) localStorage.removeItem('API_URL');
    else if (normalized !== saved) localStorage.setItem('API_URL', normalized);
    return normalized;
  } catch {
    localStorage.removeItem('API_URL');
    return DEFAULT_API_URL;
  }
}
export let API_URL: string = loadApiUrl();
axios.defaults.withCredentials = true;

export const API_HEADERS: {} = {'content-type': 'application/json'};

export function setApiUrl(url: string): string {
  API_URL = normalizeApiUrl(url);
  if (API_URL === DEFAULT_API_URL) localStorage.removeItem('API_URL');
  else localStorage.setItem('API_URL', API_URL);
  return API_URL;
}

function showSuccessToast(text: string) {
  toast.success(text);
}

function showErrorToast(text: string) {
  toast.error(text);
}

function loadQueue(): BarRequest[] {
  const queued = JSON.parse(localStorage.getItem('requestList') || '[]') as BarRequest[];
  const inflight = localStorage.getItem('inflightRequest');
  if (inflight) queued.unshift(JSON.parse(inflight) as BarRequest);
  return queued;
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
    requestList: loadQueue(),
    sendingRequests: false,
    sohvik: true,
    mode: null as 'paid' | 'unpaid' | null,
    modeLoaded: false,
    modeLocked: false,
    billingLocked: false,
    isOrganizer: false,
    paidCart: JSON.parse(localStorage.getItem('paidCart') || '[]') as tempOrder[],
    isConnected: true,
    connectionCheckInterval: null as number | null,

    bills: [] as BillDetail[],
    isFetchingBills: false,
    logs: [] as LogItem[],
    isFetchingLogs: false,
  }),
  actions: {
    async loadMode() {
      const response = await axios.get(API_URL + '/mode');
      this.mode = response.data.mode;
      this.modeLocked = response.data.locked;
      this.billingLocked = response.data.billingLocked;
      this.sohvik = this.mode === 'paid';
      this.modeLoaded = true;
    },
    async setMode(mode: 'paid' | 'unpaid') {
      await axios.put(API_URL + '/admin/mode', {mode});
      await this.loadMode();
    },
    async checkOrganizer() {
      if (sessionStorage.getItem('organizerLoggedIn') !== '1') {
        this.isOrganizer = false;
        return;
      }
      try { await axios.get(API_URL + '/admin/session'); this.isOrganizer = true; }
      catch {
        sessionStorage.removeItem('organizerLoggedIn');
        this.isOrganizer = false;
      }
    },
    async organizerLogin(password: string) {
      await axios.post(API_URL + '/admin/login', {password});
      sessionStorage.setItem('organizerLoggedIn', '1');
      this.isOrganizer = true;
    },
    async organizerLogout() {
      await axios.post(API_URL + '/admin/logout');
      sessionStorage.removeItem('organizerLoggedIn');
      this.isOrganizer = false;
    },
    async importDrinks() {
      await axios.post(API_URL + '/admin/import/drinks');
      await this.fetchDrinks();
      await this.fetchDrinks2();
    },
    async importNames() {
      await axios.post(API_URL + '/admin/import/names');
      await this.fetchNames();
    },
    async checkConnection() {
      try {
        await axios.get(API_URL, {timeout: 5000});
        await this.loadMode();
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
        this.orders = response.data.map((item: any): Order => ({
            id: item.order_id || item.id,
            drink: item.drink_name || item.drink,
            name: item.customer_name || item.customer,
            amount: item.quantity,
            isSent: true,
          })).reverse();
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
      editedOrder.id = uuidv4();
      localStorage.setItem('requestList', JSON.stringify(this.requestList));
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
      localStorage.setItem('requestList', JSON.stringify(this.requestList));
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
        localStorage.setItem('inflightRequest', JSON.stringify(this.currentRequest));
        localStorage.setItem("requestList", JSON.stringify(this.requestList));
        if (!this.currentRequest) continue;
        if (this.currentRequest.type === 0) {
          await this.sendAddOrder(this.currentRequest.order);
        } else if (this.currentRequest.type === 1) {
          await this.sendChangeOrder(this.currentRequest.oldOrder, this.currentRequest.order);
        } else if (this.currentRequest.type === 2) {
          await this.sendCancelOrder(this.currentRequest.order);
        } else if (this.currentRequest.type === 3) {
          await this.sendPaidBatch((this.currentRequest as any).batch);
        }
        localStorage.removeItem('inflightRequest');
      }
      this.currentRequest = {} as BarRequest;
      this.sendingRequests = false;
    },

    async sendAddOrder(newOrder: Order) {
      console.log("Adding order", newOrder)

      const sentOrder: OrderForm = {
        order_id: newOrder.id,
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
        await axios.post(API_URL + "/orders", {orders}, {headers: API_HEADERS});
        showSuccessToast("Tellimused esitatud");
      } catch (error) {
        console.error("Error adding orders", error);
        showErrorToast("Tellimuste esitamine ebaõnnestus");
        throw error;
      }
      for (const order of orders) {
        const newOrder: Order = {
          id: order.order_id || uuidv4(),
          drink: order.drink_name,
          name: order.customer_name,
          amount: order.quantity,
          isSent: true,
        }
        this.addToOrders(newOrder);
      }
    },

    async sendTempOrders(orders: tempOrder[]) {
      if (!orders || orders.length === 0) return;
      if (this.requestList.some(r => r.type === 3) || this.currentRequest?.type === 3) return false;
      const fullOrders: OrderForm[] = orders.map(o => ({
        order_id: uuidv4(),
        customer_name: "Sohviku klient",
        drink_name: o.drink,
        quantity: o.amount,
      }));
      this.requestList.push({type: 3, batch: fullOrders, order: {} as Order, oldOrder: {} as Order} as BarRequest);
      localStorage.setItem('requestList', JSON.stringify(this.requestList));
      await this.startSendingRequests();
      return this.paidCart.length === 0;
    },
    async sendPaidBatch(orders: OrderForm[]) {
      try {
        await this.sendAddOrders(orders);
        this.paidCart = [];
        localStorage.setItem('paidCart', '[]');
      } catch {
        this.requestList.unshift({type: 3, batch: orders, order: {} as Order, oldOrder: {} as Order} as BarRequest);
        localStorage.setItem('requestList', JSON.stringify(this.requestList));
        this.isConnected = false;
      }
    },

    async sendCancelOrder(order: Order) {
      console.log("Cancelling order", order)
      if (!order.isSent) {
        showErrorToast("Tellimust ei saa tühistada");
        return;
      }

      try {
        const response = await axios.post(API_URL + "/order/cancel", {order_id: order.id}, {headers: API_HEADERS});
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
        old_order_id: old.id,
        new_order_id: edited.id,
        order: {
          customer_name: edited.name,
          drink_name: edited.drink,
          quantity: edited.amount,
        }
      }

      try {
        const response = await axios.put(API_URL + "/order", payload, {headers: API_HEADERS});
        if (response.status === 200 && response.data && (response.data.updated || response.data.success)) {
          const newOrderId = response.data.new_order_id || edited.id;
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

    async adminCancelLog(order_id: string) {
      try {
        await axios.post(API_URL + "/order/cancel", {order_id}, {headers: API_HEADERS});
        showSuccessToast('Tellimus tühistatud (admin)');
        await this.getLogs();
      } catch (error) {
        console.error('Admin cancel error', error);
        showErrorToast('Tellimuse tühistamine ebaõnnestus (admin)');
      }
    },
  }
})
