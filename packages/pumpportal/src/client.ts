import WebSocket from "ws";
import { EventEmitter } from "events";

export type SubMsg =
  | { method: "subscribeNewToken" }
  | { method: "subscribeMigration" }
  | { method: "subscribeTokenTrade"; keys: string[] }
  | { method: "subscribeAccountTrade"; keys: string[] }
  | { method: "unsubscribeNewToken" }
  | { method: "unsubscribeTokenTrade"; keys: string[] }
  | { method: "unsubscribeAccountTrade"; keys: string[] };

export interface RawEvent {
  id?: string;
  mint: string;
  signature?: string;
  trader_pubkey?: string;
  tx_type: string; // create | trade | migrate
  initial_buy?: number;
  sol_amount?: number;
  v_tokens_in_curve?: number;
  v_sol_in_curve?: number;
  market_cap_sol?: number;
  name?: string;
  symbol?: string;
  uri?: string;
  pool?: string;
  payload: any;
  received_at: Date;
}

export interface PumpPortalConfig {
  apiKey?: string;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
  enableLogging?: boolean;
  onRawEvent?: (event: RawEvent) => void;
}

export interface ConnectionStats {
  connected: boolean;
  reconnectAttempts: number;
  totalMessages: number;
  lastMessageAt?: Date;
  connectedAt?: Date;
  uptime: number;
  subscriptions: string[];
}

export class PumpPortalWS extends EventEmitter {
  private ws?: WebSocket;
  private url: string;
  private config: Required<PumpPortalConfig>;
  private queue: SubMsg[] = [];
  private onMessage: (data: any) => void;
  private reconnectAttempts = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private connectionTimer?: NodeJS.Timeout;
  private stats: ConnectionStats;
  private activeSubscriptions = new Set<string>();
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(config: PumpPortalConfig, onMessage?: (d: any) => void) {
    super();
    
    this.config = {
      apiKey: config.apiKey || '',
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      reconnectDelay: config.reconnectDelay || 2000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      connectionTimeout: config.connectionTimeout || 10000,
      enableLogging: config.enableLogging !== false,
      onRawEvent: config.onRawEvent || (() => {})
    };

    this.url = this.config.apiKey
      ? `wss://pumpportal.fun/api/data?api-key=${this.config.apiKey}`
      : `wss://pumpportal.fun/api/data`;
    
    this.onMessage = onMessage || this.handleRawMessage.bind(this);
    
    this.stats = {
      connected: false,
      reconnectAttempts: 0,
      totalMessages: 0,
      uptime: 0,
      subscriptions: []
    };

    // Bind methods to preserve context
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this.config.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [PumpPortal]`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️ ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
    }
  }

  private normalizeEvent(rawData: any): RawEvent {
    const now = new Date();
    
    // Handle different event types from PumpPortal
    if (rawData.txType === 'create') {
      return {
        mint: rawData.mint,
        signature: rawData.signature,
        trader_pubkey: rawData.traderPublicKey,
        tx_type: 'create',
        initial_buy: rawData.initialBuy,
        sol_amount: rawData.solAmount,
        market_cap_sol: rawData.marketCapSol,
        name: rawData.name,
        symbol: rawData.symbol,
        uri: rawData.uri,
        payload: rawData,
        received_at: now
      };
    } else if (rawData.txType === 'trade') {
      return {
        mint: rawData.mint,
        signature: rawData.signature,
        trader_pubkey: rawData.traderPublicKey,
        tx_type: 'trade',
        sol_amount: rawData.solAmount,
        v_tokens_in_curve: rawData.vTokensInCurve,
        v_sol_in_curve: rawData.vSolInCurve,
        market_cap_sol: rawData.marketCapSol,
        payload: rawData,
        received_at: now
      };
    } else if (rawData.txType === 'migrate') {
      return {
        mint: rawData.mint,
        signature: rawData.signature,
        tx_type: 'migrate',
        pool: rawData.pool,
        payload: rawData,
        received_at: now
      };
    } else {
      // Generic fallback
      return {
        mint: rawData.mint || rawData.tokenAddress || 'unknown',
        signature: rawData.signature,
        tx_type: rawData.txType || rawData.type || 'unknown',
        payload: rawData,
        received_at: now
      };
    }
  }

  private handleRawMessage(data: any) {
    try {
      const normalizedEvent = this.normalizeEvent(data);
      
      // Emit normalized event
      this.emit('rawEvent', normalizedEvent);
      
      // Call callback if provided
      if (this.config.onRawEvent) {
        this.config.onRawEvent(normalizedEvent);
      }
      
      this.log(`Processed ${normalizedEvent.tx_type} event for ${normalizedEvent.mint}`);
    } catch (error) {
      this.log(`Error normalizing event: ${error.message}`, 'error');
      this.emit('error', error);
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        this.log('Connection already in progress');
        return resolve();
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.log('Already connected');
        return resolve();
      }

      this.isConnecting = true;
      this.shouldReconnect = true;
      this.log("🔌 Connecting to PumpPortal WebSocket...");
      
      // Set connection timeout
      this.connectionTimer = setTimeout(() => {
        if (this.isConnecting) {
          this.log('Connection timeout', 'error');
          this.cleanup();
          reject(new Error('Connection timeout'));
        }
      }, this.config.connectionTimeout);

      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.on("open", () => {
          this.handleOpen();
          resolve();
        });
        
        this.ws.on("message", this.handleMessage);
        this.ws.on("close", this.handleClose);
        this.ws.on("error", (error) => {
          this.handleError(error);
          if (this.isConnecting) {
            reject(error);
          }
        });
        
      } catch (error) {
        this.isConnecting = false;
        this.log(`Failed to create WebSocket: ${error}`, 'error');
        reject(error);
      }
    });
  }

  private handleOpen() {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.stats.connected = true;
    this.stats.connectedAt = new Date();
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = undefined;
    }

    this.log("✅ Connected to PumpPortal WebSocket");
    this.emit('connected');
    
    // Send queued messages
    this.processQueue();
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Re-subscribe to active subscriptions
    this.resubscribe();
  }

  private handleMessage(data: any) {
    try {
      const parsed = JSON.parse(data.toString());
      this.stats.totalMessages++;
      this.stats.lastMessageAt = new Date();
      
      // Handle different message types
      if (parsed.message) {
        this.log(`📢 Server message: ${parsed.message}`);
        this.emit('serverMessage', parsed.message);
      } else if (parsed.errors) {
        this.log(`Server error: ${JSON.stringify(parsed.errors)}`, 'error');
        this.emit('serverError', parsed.errors);
      } else {
        // Regular data message
        this.log(`📡 Received data: ${parsed.type || parsed.txType || 'unknown'}`);
        this.emit('data', parsed);
        this.onMessage(parsed);
      }
    } catch (error) {
      this.log(`Error parsing message: ${error}`, 'error');
      this.emit('parseError', error);
    }
  }

  private handleClose(code: number, reason: Buffer) {
    this.stats.connected = false;
    this.isConnecting = false;
    this.stopHeartbeat();
    
    const reasonStr = reason.toString();
    this.log(`🔌 WebSocket closed: ${code} - ${reasonStr}`);
    this.emit('disconnected', { code, reason: reasonStr });
    
    if (this.shouldReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log("❌ Max reconnection attempts reached", 'error');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  private handleError(error: any) {
    this.log(`WebSocket error: ${error}`, 'error');
    this.emit('error', error);
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect) return;
    
    this.reconnectAttempts++;
    this.stats.reconnectAttempts = this.reconnectAttempts;
    
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    this.log(`🔄 Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(error => {
          this.log(`Reconnection failed: ${error}`, 'error');
        });
      }
    }, delay);
  }

  private processQueue() {
    if (this.queue.length === 0) return;
    
    this.log(`📤 Processing ${this.queue.length} queued messages`);
    
    for (const msg of this.queue) {
      this.sendMessage(msg);
    }
    this.queue = [];
  }

  private resubscribe() {
    if (this.activeSubscriptions.size === 0) return;
    
    this.log(`🔄 Re-subscribing to ${this.activeSubscriptions.size} subscriptions`);
    
    for (const subscription of this.activeSubscriptions) {
      try {
        const msg = JSON.parse(subscription);
        this.sendMessage(msg);
      } catch (error) {
        this.log(`Failed to re-subscribe: ${error}`, 'error');
      }
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.ping();
        } catch (error) {
          this.log(`Heartbeat failed: ${error}`, 'error');
        }
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private sendMessage(msg: SubMsg) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log(`📝 Queuing message: ${msg.method}`);
      this.queue.push(msg);
      return false;
    }

    try {
      const msgStr = JSON.stringify(msg);
      this.ws.send(msgStr);
      this.log(`📤 Sent: ${msg.method}`);
      return true;
    } catch (error) {
      this.log(`Failed to send message: ${error}`, 'error');
      return false;
    }
  }

  subscribe(msg: SubMsg): boolean {
    const msgStr = JSON.stringify(msg);
    this.activeSubscriptions.add(msgStr);
    this.updateSubscriptionStats();
    
    return this.sendMessage(msg);
  }

  unsubscribe(msg: SubMsg): boolean {
    const msgStr = JSON.stringify(msg);
    this.activeSubscriptions.delete(msgStr);
    this.updateSubscriptionStats();
    
    return this.sendMessage(msg);
  }

  private updateSubscriptionStats() {
    this.stats.subscriptions = Array.from(this.activeSubscriptions).map(sub => {
      try {
        const parsed = JSON.parse(sub);
        return parsed.method;
      } catch {
        return 'unknown';
      }
    });
  }

  // Convenience methods for common subscriptions
  subscribeNewTokens(): boolean {
    return this.subscribe({ method: "subscribeNewToken" });
  }

  subscribeMigrations(): boolean {
    return this.subscribe({ method: "subscribeMigration" });
  }

  subscribeTokenTrades(mints: string[]): boolean {
    return this.subscribe({ method: "subscribeTokenTrade", keys: mints });
  }

  subscribeAccountTrades(accounts: string[]): boolean {
    return this.subscribe({ method: "subscribeAccountTrade", keys: accounts });
  }

  unsubscribeNewTokens(): boolean {
    return this.unsubscribe({ method: "unsubscribeNewToken" });
  }

  unsubscribeTokenTrades(mints: string[]): boolean {
    return this.unsubscribe({ method: "unsubscribeTokenTrade", keys: mints });
  }

  unsubscribeAccountTrades(accounts: string[]): boolean {
    return this.unsubscribe({ method: "unsubscribeAccountTrade", keys: accounts });
  }

  getStats(): ConnectionStats {
    if (this.stats.connectedAt) {
      this.stats.uptime = Date.now() - this.stats.connectedAt.getTime();
    }
    return { ...this.stats };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.stats.connected;
  }

  getReadyState(): number | undefined {
    return this.ws?.readyState;
  }

  private cleanup() {
    this.isConnecting = false;
    this.stopHeartbeat();
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = undefined;
    }
    
    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.log("🔌 Disconnecting...");
    this.cleanup();
    this.stats.connected = false;
    this.emit('disconnected', { code: 1000, reason: 'Manual disconnect' });
  }

  // Force reconnect
  reconnect(): Promise<void> {
    this.log("🔄 Force reconnecting...");
    this.disconnect();
    return new Promise(resolve => {
      setTimeout(() => {
        this.connect().then(resolve).catch(resolve);
      }, 1000);
    });
  }
}
