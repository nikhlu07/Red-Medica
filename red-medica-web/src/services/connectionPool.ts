import { WsProvider } from '@polkadot/api';

interface ConnectionConfig {
  endpoint: string;
  maxConnections: number;
  timeout: number;
  reconnectDelay: number;
  maxReconnectAttempts: number;
}

interface PooledConnection {
  provider: WsProvider;
  isActive: boolean;
  lastUsed: number;
  connectionId: string;
}

class ConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private config: ConnectionConfig;
  private connectionCounter = 0;

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = {
      endpoint: config.endpoint || 'wss://wss.api.moonbase.moonbeam.network',
      maxConnections: config.maxConnections || 3,
      timeout: config.timeout || 30000,
      reconnectDelay: config.reconnectDelay || 1000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
    };
  }

  async getConnection(): Promise<WsProvider> {
    // Try to find an existing active connection
    for (const [id, connection] of this.connections.entries()) {
      if (connection.isActive && connection.provider.isConnected) {
        connection.lastUsed = Date.now();
        return connection.provider;
      }
    }

    // Create new connection if under limit
    if (this.connections.size < this.config.maxConnections) {
      return await this.createConnection();
    }

    // Find least recently used connection to replace
    let oldestConnection: PooledConnection | null = null;
    let oldestTime = Date.now();

    for (const connection of this.connections.values()) {
      if (connection.lastUsed < oldestTime) {
        oldestTime = connection.lastUsed;
        oldestConnection = connection;
      }
    }

    if (oldestConnection) {
      await this.closeConnection(oldestConnection.connectionId);
      return await this.createConnection();
    }

    throw new Error('Unable to create connection: pool exhausted');
  }

  private async createConnection(): Promise<WsProvider> {
    const connectionId = `conn_${++this.connectionCounter}`;
    
    const provider = new WsProvider(
      this.config.endpoint,
      this.config.reconnectDelay,
      {},
      this.config.timeout
    );

    const connection: PooledConnection = {
      provider,
      isActive: true,
      lastUsed: Date.now(),
      connectionId,
    };

    // Set up connection event handlers
    provider.on('connected', () => {
      console.log(`Connection ${connectionId} established`);
      connection.isActive = true;
    });

    provider.on('disconnected', () => {
      console.log(`Connection ${connectionId} disconnected`);
      connection.isActive = false;
    });

    provider.on('error', (error) => {
      console.error(`Connection ${connectionId} error:`, error);
      connection.isActive = false;
    });

    this.connections.set(connectionId, connection);

    // Wait for connection to be established
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      provider.on('connected', () => {
        clearTimeout(timeout);
        resolve();
      });

      provider.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    return provider;
  }

  private async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      try {
        await connection.provider.disconnect();
      } catch (error) {
        console.error(`Error closing connection ${connectionId}:`, error);
      }
      this.connections.delete(connectionId);
    }
  }

  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.connections.keys()).map(id => 
      this.closeConnection(id)
    );
    await Promise.all(closePromises);
  }

  getStats(): {
    totalConnections: number;
    activeConnections: number;
    maxConnections: number;
  } {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.isActive && conn.provider.isConnected).length;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      maxConnections: this.config.maxConnections,
    };
  }

  // Health check for connections
  async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      return connection.isConnected;
    } catch (error) {
      console.error('Connection pool health check failed:', error);
      return false;
    }
  }
}

// Create singleton connection pool
export const connectionPool = new ConnectionPool();

export { ConnectionPool };