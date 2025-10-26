import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { CronJob } from 'cron';
import { DatabaseClient } from '@metapulse/core';

// Job Types
export interface TokenAnalysisJob {
  mint: string;
  priority: 'high' | 'medium' | 'low';
  source: 'pumpportal' | 'dexscreener' | 'manual';
  metadata?: any;
}

export interface SignalGenerationJob {
  type: 'hourly' | 'daily' | 'weekly';
  timestamp: number;
  filters?: {
    minScore?: number;
    maxTokens?: number;
    categories?: string[];
  };
}

export interface NotificationJob {
  type: 'telegram' | 'webhook' | 'email';
  recipient: string;
  message: string;
  priority: 'urgent' | 'normal' | 'low';
  metadata?: any;
}

export interface DatabaseCleanupJob {
  table: string;
  olderThan: number; // timestamp
  batchSize?: number;
}

export interface WebhookJob {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  payload: any;
  headers?: Record<string, string>;
  retries?: number;
}

// Job Data Union Type
export type JobData = 
  | { type: 'token-analysis'; data: TokenAnalysisJob }
  | { type: 'signal-generation'; data: SignalGenerationJob }
  | { type: 'notification'; data: NotificationJob }
  | { type: 'database-cleanup'; data: DatabaseCleanupJob }
  | { type: 'webhook'; data: WebhookJob };

// Queue Configuration
export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queues: {
    tokenAnalysis: QueueOptions;
    signalGeneration: QueueOptions;
    notifications: QueueOptions;
    maintenance: QueueOptions;
    webhooks: QueueOptions;
  };
  workers: {
    concurrency: number;
    maxStalledCount: number;
    stalledInterval: number;
  };
}

// Job Results
export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: number;
}

// Queue Manager
export class QueueManager {
  private redis: Redis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private cronJobs: Map<string, CronJob> = new Map();
  private config: QueueConfig;
  private database: DatabaseClient;

  constructor(config: QueueConfig, database: DatabaseClient) {
    this.config = config;
    this.database = database;
    
    // Initialize Redis connection
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 0,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.setupQueues();
    this.setupWorkers();
    this.setupCronJobs();
  }

  private setupQueues() {
    const queueNames = [
      'token-analysis',
      'signal-generation', 
      'notifications',
      'maintenance',
      'webhooks'
    ];

    for (const name of queueNames) {
      const queueConfig = this.config.queues[name as keyof typeof this.config.queues] || {};
      const { connection, ...restConfig } = queueConfig;
      
      const queue = new Queue(name, {
        connection: this.redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
        ...restConfig
      });

      this.queues.set(name, queue);
    }
  }

  private setupWorkers() {
    // Token Analysis Worker
    const tokenAnalysisWorker = new Worker(
      'token-analysis',
      async (job: Job<JobData>) => {
        return this.processTokenAnalysis(job);
      },
      {
        connection: this.redis,
        concurrency: this.config.workers.concurrency,
        maxStalledCount: this.config.workers.maxStalledCount,
        stalledInterval: this.config.workers.stalledInterval,
      }
    );

    // Signal Generation Worker
    const signalWorker = new Worker(
      'signal-generation',
      async (job: Job<JobData>) => {
        return this.processSignalGeneration(job);
      },
      {
        connection: this.redis,
        concurrency: 2, // Lower concurrency for heavy operations
      }
    );

    // Notification Worker
    const notificationWorker = new Worker(
      'notifications',
      async (job: Job<JobData>) => {
        return this.processNotification(job);
      },
      {
        connection: this.redis,
        concurrency: this.config.workers.concurrency * 2, // Higher for I/O operations
      }
    );

    // Maintenance Worker
    const maintenanceWorker = new Worker(
      'maintenance',
      async (job: Job<JobData>) => {
        return this.processMaintenance(job);
      },
      {
        connection: this.redis,
        concurrency: 1, // Single worker for maintenance tasks
      }
    );

    // Webhook Worker
    const webhookWorker = new Worker(
      'webhooks',
      async (job: Job<JobData>) => {
        return this.processWebhook(job);
      },
      {
        connection: this.redis,
        concurrency: this.config.workers.concurrency,
      }
    );

    // Store workers
    this.workers.set('token-analysis', tokenAnalysisWorker);
    this.workers.set('signal-generation', signalWorker);
    this.workers.set('notifications', notificationWorker);
    this.workers.set('maintenance', maintenanceWorker);
    this.workers.set('webhooks', webhookWorker);

    // Setup event listeners
    this.setupWorkerEvents();
  }

  private setupWorkerEvents() {
    for (const [name, worker] of this.workers) {
      worker.on('completed', async (job, result) => {
        console.log(`✅ Job ${job.id} in queue ${name} completed:`, result);
        await this.logJobResult(job, result, 'completed');
      });

      worker.on('failed', async (job, err) => {
        console.error(`❌ Job ${job?.id} in queue ${name} failed:`, err);
        if (job) {
          await this.logJobResult(job, { error: err.message }, 'failed');
        }
      });

      worker.on('stalled', (jobId) => {
        console.warn(`⚠️ Job ${jobId} in queue ${name} stalled`);
      });

      worker.on('error', (err) => {
        console.error(`❌ Worker ${name} error:`, err);
      });
    }
  }

  private setupCronJobs() {
    // Hourly signal generation
    const hourlySignals = new CronJob(
      '0 0 * * * *', // Every hour
      async () => {
        await this.addSignalGenerationJob({
          type: 'hourly',
          timestamp: Date.now(),
          filters: {
            minScore: 70,
            maxTokens: 10
          }
        });
      },
      null,
      false,
      'UTC'
    );

    // Daily cleanup
    const dailyCleanup = new CronJob(
      '0 0 2 * * *', // 2 AM daily
      async () => {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        await this.addMaintenanceJob({
          table: 'raw_events',
          olderThan: oneDayAgo,
          batchSize: 1000
        });
      },
      null,
      false,
      'UTC'
    );

    // Weekly deep cleanup
    const weeklyCleanup = new CronJob(
      '0 0 3 * * 0', // 3 AM on Sundays
      async () => {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        await this.addMaintenanceJob({
          table: 'logs',
          olderThan: oneWeekAgo,
          batchSize: 5000
        });
      },
      null,
      false,
      'UTC'
    );

    this.cronJobs.set('hourly-signals', hourlySignals);
    this.cronJobs.set('daily-cleanup', dailyCleanup);
    this.cronJobs.set('weekly-cleanup', weeklyCleanup);
  }

  // Job Processing Methods
  private async processTokenAnalysis(job: Job<JobData>): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      if (job.data.type !== 'token-analysis') {
        throw new Error('Invalid job type for token analysis');
      }

      const { mint, priority, source, metadata } = job.data.data;
      
      console.log(`🔍 Analyzing token: ${mint} (${priority} priority from ${source})`);

      // Here you would integrate with your scoring engine
      // For now, we'll simulate the process
      const analysisResult = {
        mint,
        score: Math.floor(Math.random() * 100),
        risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        signals: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)],
        metadata: {
          ...metadata,
          analyzedAt: new Date().toISOString(),
          source
        }
      };

      // Save to database
      await this.database.upsertTokenScore({
        mint,
        heuristic_score: analysisResult.score,
        ai_score: analysisResult.score,
        final_score: analysisResult.score,
        confidence: 0.8,
        prob_enterable: 0.7,
        expected_roi_p50: 1.5,
        expected_roi_p90: 3.0,
        risk: analysisResult.risk as any,
        reasoning: `Automated analysis: ${analysisResult.signals}`,
        meta_category: undefined,
        meta_score: undefined
      });

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: analysisResult,
        duration,
        timestamp: Date.now()
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: Date.now()
      };
    }
  }

  private async processSignalGeneration(job: Job<JobData>): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      if (job.data.type !== 'signal-generation') {
        throw new Error('Invalid job type for signal generation');
      }

      const { type, timestamp, filters } = job.data.data;
      
      console.log(`📊 Generating ${type} signals with filters:`, filters);

      // Get top tokens based on filters
      const topTokens = await this.database.getTopTokens(
        filters?.maxTokens || 10,
        filters?.minScore || 0
      );

      // Generate signal
      const signal = {
        type,
        timestamp,
        tokens: topTokens,
        metadata: {
          generatedAt: new Date().toISOString(),
          filters,
          tokenCount: topTokens.length
        }
      };

      // Save signal
      await this.database.insertHourlySignal({
        signal_time: new Date().toISOString(),
        top_tokens: topTokens,
        top_metas: [],
        market_summary: signal.metadata,
        published_telegram: false,
        published_web: false
      });

      // Trigger notifications for high-priority signals
      if (topTokens.some(t => t.score > 90)) {
        await this.addNotificationJob({
          type: 'telegram',
          recipient: 'all',
          message: `🚀 High-priority ${type} signal generated with ${topTokens.length} tokens!`,
          priority: 'urgent',
          metadata: { signalId: signal.timestamp }
        });
      }

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: signal,
        duration,
        timestamp: Date.now()
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: Date.now()
      };
    }
  }

  private async processNotification(job: Job<JobData>): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      if (job.data.type !== 'notification') {
        throw new Error('Invalid job type for notification');
      }

      const { type, recipient, message, priority, metadata } = job.data.data;
      
      console.log(`📢 Sending ${type} notification to ${recipient} (${priority} priority)`);

      // Here you would integrate with your notification services
      // For now, we'll simulate the process
      const result = {
        type,
        recipient,
        message,
        priority,
        sentAt: new Date().toISOString(),
        success: true,
        metadata
      };

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        duration,
        timestamp: Date.now()
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: Date.now()
      };
    }
  }

  private async processMaintenance(job: Job<JobData>): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      if (job.data.type !== 'database-cleanup') {
        throw new Error('Invalid job type for maintenance');
      }

      const { table, olderThan, batchSize = 1000 } = job.data.data;
      
      console.log(`🧹 Cleaning up ${table} table (older than ${new Date(olderThan).toISOString()})`);

      // Here you would implement actual cleanup logic
      // For now, we'll simulate the process
      const deletedCount = Math.floor(Math.random() * batchSize);
      
      const result = {
        table,
        olderThan,
        batchSize,
        deletedCount,
        cleanedAt: new Date().toISOString()
      };

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        duration,
        timestamp: Date.now()
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: Date.now()
      };
    }
  }

  private async processWebhook(job: Job<JobData>): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      if (job.data.type !== 'webhook') {
        throw new Error('Invalid job type for webhook');
      }

      const { url, method, payload, headers, retries = 3 } = job.data.data;
      
      console.log(`🔗 Sending ${method} webhook to ${url}`);

      // Here you would implement actual HTTP request
      // For now, we'll simulate the process
      const result = {
        url,
        method,
        status: 200,
        response: 'OK',
        sentAt: new Date().toISOString(),
        retries: 0
      };

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        duration,
        timestamp: Date.now()
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: Date.now()
      };
    }
  }

  // Job Addition Methods
  async addTokenAnalysisJob(data: TokenAnalysisJob, options?: any): Promise<Job> {
    const queue = this.queues.get('token-analysis');
    if (!queue) throw new Error('Token analysis queue not found');

    return queue.add('analyze-token', { type: 'token-analysis', data }, {
      priority: data.priority === 'high' ? 10 : data.priority === 'medium' ? 5 : 1,
      delay: data.priority === 'low' ? 5000 : 0, // Delay low priority jobs
      ...options
    });
  }

  async addSignalGenerationJob(data: SignalGenerationJob, options?: any): Promise<Job> {
    const queue = this.queues.get('signal-generation');
    if (!queue) throw new Error('Signal generation queue not found');

    return queue.add('generate-signal', { type: 'signal-generation', data }, {
      priority: 8,
      ...options
    });
  }

  async addNotificationJob(data: NotificationJob, options?: any): Promise<Job> {
    const queue = this.queues.get('notifications');
    if (!queue) throw new Error('Notifications queue not found');

    return queue.add('send-notification', { type: 'notification', data }, {
      priority: data.priority === 'urgent' ? 10 : data.priority === 'normal' ? 5 : 1,
      ...options
    });
  }

  async addMaintenanceJob(data: DatabaseCleanupJob, options?: any): Promise<Job> {
    const queue = this.queues.get('maintenance');
    if (!queue) throw new Error('Maintenance queue not found');

    return queue.add('cleanup-database', { type: 'database-cleanup', data }, {
      priority: 3,
      ...options
    });
  }

  async addWebhookJob(data: WebhookJob, options?: any): Promise<Job> {
    const queue = this.queues.get('webhooks');
    if (!queue) throw new Error('Webhooks queue not found');

    return queue.add('send-webhook', { type: 'webhook', data }, {
      priority: 5,
      attempts: data.retries || 3,
      ...options
    });
  }

  // Utility Methods
  private async logJobResult(job: Job, result: any, status: string) {
    try {
      await this.database.insertLog({
        level: status === 'failed' ? 'error' : 'info',
        type: 'scoring',
        message: `Job ${job.id} ${status}`,
        metadata: {
          jobId: job.id,
          jobName: job.name,
          queueName: job.queueName,
          result,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn
        },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log job result:', error);
    }
  }

  async getQueueStats() {
    const stats: any = {};
    
    for (const [name, queue] of this.queues) {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();
      
      stats[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      };
    }
    
    return stats;
  }

  async startCronJobs() {
    console.log('🕐 Starting cron jobs...');
    for (const [name, cronJob] of this.cronJobs) {
      cronJob.start();
      console.log(`✅ Started cron job: ${name}`);
    }
  }

  async stopCronJobs() {
    console.log('🛑 Stopping cron jobs...');
    for (const [name, cronJob] of this.cronJobs) {
      cronJob.stop();
      console.log(`⏹️ Stopped cron job: ${name}`);
    }
  }

  async shutdown() {
    console.log('🛑 Shutting down queue manager...');
    
    // Stop cron jobs
    await this.stopCronJobs();
    
    // Close workers
    for (const [name, worker] of this.workers) {
      await worker.close();
      console.log(`⏹️ Closed worker: ${name}`);
    }
    
    // Close queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      console.log(`⏹️ Closed queue: ${name}`);
    }
    
    // Close Redis connection
    await this.redis.quit();
    console.log('⏹️ Closed Redis connection');
  }
}

// Export types and classes
export * from 'bullmq';