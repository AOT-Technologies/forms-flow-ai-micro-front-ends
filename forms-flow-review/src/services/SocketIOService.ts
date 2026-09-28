/* istanbul ignore file */
import { Client, IMessage } from "@stomp/stompjs";
import API from "../api/endpoints";
import { MULTITENANCY_ENABLED } from "../constants";
import { StorageService } from "@formsflow/service";

interface TaskUpdate {
  id: string;
  eventName: string;
  tenantId?: string;
}

type ReloadCallback = (
  taskId: string,
  forceReload: boolean,
  isUpdateEvent: boolean
) => void;

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

/**
 * process-gateway's `/socket` route is a plain WebSocket (not SockJS), so it
 * must be dialed as ws(s):// rather than http(s)://.
 */
const toWebSocketUrl = (url: string): string => url.replace(/^http/i, "ws");

const connect = (reloadCallback: ReloadCallback): void => {
  const authToken = StorageService.get(StorageService.User.AUTH_TOKEN);
  if (!authToken) {
    console.error("Auth token not found");
    return;
  }

  const socketUrl = toWebSocketUrl(API.BPM_BASE_URL_SOCKET_IO);

  stompClient = new Client({
    brokerURL: socketUrl,
    connectHeaders: {
      Authorization: `Bearer ${authToken}`,
    },
    reconnectDelay: window.location.pathname.includes("review") ? 5000 : 0,
    heartbeatIncoming: 25000,
    heartbeatOutgoing: 0,
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
  }
};

const SocketIOService = {
  connect,
  disconnect,
  isConnected,
};

export default SocketIOService;
