/* istanbul ignore file */
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import API from "../api/endpoints";
import { WEBSOCKET_ENCRYPT_KEY, MULTITENANCY_ENABLED } from "../constants";
import AES from "crypto-js/aes";
import { StorageService } from "@formsflow/service";

interface TaskUpdate {
  id: string;
  eventName: string;
  tenantId?: string;
}

type ReloadCallback = (taskId: string, forceReload: boolean, isUpdateEvent: boolean) => void;

let tenantData: string | null = localStorage.getItem("tenantData");
let tenantKey: string = "";

if (tenantData) {
  try {
    const parsedData = JSON.parse(tenantData);
    tenantKey = parsedData["key"] || "";
  } catch (error) {
    console.error("Error parsing tenantData from localStorage", error);
  }
}

let stompClient: Client | null = null;
let reconnectTimeOut: NodeJS.Timeout | null = null;

const connect = (reloadCallback: ReloadCallback): void => {
  const authToken = StorageService.get(StorageService.User.AUTH_TOKEN);
  if (!authToken) {
    console.error("Auth token not found");
    return;
  }
  
  const accessToken = AES.encrypt(authToken, WEBSOCKET_ENCRYPT_KEY).toString();
  const socketUrl = `${API.BPM_BASE_URL_SOCKET_IO}?accesstoken=${accessToken}`;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(socketUrl),
    reconnectDelay: window.location.pathname.includes("review") && 5000, // Auto-reconnect after 5 seconds if reconnects
    debug: () => {}, // Disable debug logging
    onConnect: () => {
      console.log("Connected to WebSocket");
      stompClient?.subscribe("/topic/task-event", (message: IMessage) => {
        try {
          const taskUpdate: TaskUpdate = JSON.parse(message.body);

          if (MULTITENANCY_ENABLED && tenantKey !== taskUpdate.tenantId) {
            return; // Ignore if tenant does not match
          }

          const forceReload = taskUpdate.eventName === "complete";
          const isUpdateEvent = taskUpdate.eventName === "update";
          reloadCallback(taskUpdate.id, forceReload, isUpdateEvent);
        } catch (error) {
          console.error("Error parsing WebSocket message", error);
        }
      });
    },
    onStompError: (frame) => {
      console.error("Broker error: ", frame.headers["message"], frame.body);
    },
    onWebSocketClose: () => {
      console.log("WebSocket connection closed. Attempting reconnect...");
    },
  });

  stompClient.activate();
};

const isConnected = (): boolean => stompClient?.connected || false;

const disconnect = (): void => {
  if (stompClient) {
    stompClient.deactivate();
    if (reconnectTimeOut) {
      clearTimeout(reconnectTimeOut);
    }
  }
};

const SocketIOService = {
  connect,
  disconnect,
  isConnected,
};

export default SocketIOService;