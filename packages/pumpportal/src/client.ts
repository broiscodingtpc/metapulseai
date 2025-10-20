import WebSocket from "ws";

export type SubMsg =
  | { method: "subscribeNewToken" }
  | { method: "subscribeMigration" }
  | { method: "subscribeTokenTrade"; keys: string[] }
  | { method: "subscribeAccountTrade"; keys: string[] }
  | { method: "unsubscribeNewToken" }
  | { method: "unsubscribeTokenTrade"; keys: string[] }
  | { method: "unsubscribeAccountTrade"; keys: string[] };

export class PumpPortalWS {
  private ws?: WebSocket;
  private url: string;
  private queue: SubMsg[] = [];
  private onMessage: (data: any) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(apiKey: string | undefined, onMessage: (d: any) => void) {
    this.url = apiKey
      ? `wss://pumpportal.fun/api/data?api-key=${apiKey}`
      : `wss://pumpportal.fun/api/data`;
    this.onMessage = onMessage;
  }

  connect() {
    console.log("🔌 Connecting to PumpPortal WebSocket...");
    this.ws = new WebSocket(this.url);
    
    this.ws.on("open", () => {
      console.log("✅ Connected to PumpPortal WebSocket");
      this.reconnectAttempts = 0;
      
      // Send queued messages
      for (const m of this.queue) {
        this.ws!.send(JSON.stringify(m));
      }
      this.queue = [];
      
      // Subscribe to new tokens by default
      this.subscribe({ method: "subscribeNewToken" });
    });
    
    this.ws.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        console.log("📡 Received data:", parsed.type || "unknown");
        this.onMessage(parsed);
      } catch (error) {
        console.log("❌ Error parsing message:", error);
      }
    });
    
    this.ws.on("close", (code, reason) => {
      console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
      } else {
        console.log("❌ Max reconnection attempts reached");
      }
    });
    
    this.ws.on("error", (error) => {
      console.log("❌ WebSocket error:", error);
    });
  }

  subscribe(msg: SubMsg) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log("📝 Queuing subscription:", msg.method);
      this.queue.push(msg);
    } else {
      console.log("📤 Sending subscription:", msg.method);
      this.ws.send(JSON.stringify(msg));
    }
  }

  unsubscribe(msg: SubMsg) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log("📝 Queuing unsubscription:", msg.method);
      this.queue.push(msg);
    } else {
      console.log("📤 Sending unsubscription:", msg.method);
      this.ws.send(JSON.stringify(msg));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
