/**
 * Database Utilities
 * Provides helper functions for database operations with proper error handling
 * and optimization patterns
 */

import mongoose, { Model, Document, FilterQuery, QueryOptions } from 'mongoose';
import { DatabaseError, NotFoundError } from './errors';
import { logger } from './logger';
import { PAGINATION } from '../config/constants';

/**
 * Pagination result interface
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Query options for pagination
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string | Record<string, 1 | -1>;
}

/**
 * Safe database operation wrapper
 * Catches and transforms database errors into application errors
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Database operation failed: ${operationName}`, error);
    throw new DatabaseError(`Failed to ${operationName}`, error as Error);
  }
}

/**
 * Find one document with proper error handling
 */
export async function findOne<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options?: QueryOptions
): Promise<T | null> {
  return safeDbOperation(
    async () => {
      const doc = await model.findOne(filter, null, options).lean();
      return doc as T | null;
    },
    `find ${model.modelName}`
  );
}

/**
 * Find one document or throw NotFoundError
 */
export async function findOneOrFail<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options?: QueryOptions
): Promise<T> {
  const doc = await findOne(model, filter, options);
  if (!doc) {
    throw new NotFoundError(model.modelName);
  }
  return doc;
}

/**
 * Find by ID with proper error handling
 */
export async function findById<T extends Document>(
  model: Model<T>,
  id: string,
  options?: QueryOptions
): Promise<T | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return safeDbOperation(
    async () => {
      const doc = await model.findById(id, null, options).lean();
      return doc as T | null;
    },
    `find ${model.modelName} by ID`
  );
}

/**
 * Find by ID or throw NotFoundError
 */
export async function findByIdOrFail<T extends Document>(
  model: Model<T>,
  id: string,
  options?: QueryOptions
): Promise<T> {
  const doc = await findById(model, id, options);
  if (!doc) {
    throw new NotFoundError(model.modelName, id);
  }
  return doc;
}

/**
 * Find multiple documents with pagination
 */
export async function findPaginated<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, options.page || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    options.limit || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  return safeDbOperation(
    async () => {
      const [data, total] = await Promise.all([
        model
          .find(filter)
          .sort(options.sort || { createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        model.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: data as T[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    },
    `find paginated ${model.modelName}`
  );
}

/**
 * Create document with proper error handling
 */
export async function create<T extends Document>(
  model: Model<T>,
  data: Partial<T>
): Promise<T> {
  return safeDbOperation(
    async () => {
      const doc = await model.create(data);
      return doc.toObject() as T;
    },
    `create ${model.modelName}`
  );
}

/**
 * Update document by ID
 */
export async function updateById<T extends Document>(
  model: Model<T>,
  id: string,
  update: Partial<T>,
  options?: QueryOptions
): Promise<T | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return safeDbOperation(
    async () => {
      const doc = await model
        .findByIdAndUpdate(id, update, { new: true, runValidators: true, ...options })
        .lean();
      return doc as T | null;
    },
    `update ${model.modelName}`
  );
}

/**
 * Update document by ID or throw error
 */
export async function updateByIdOrFail<T extends Document>(
  model: Model<T>,
  id: string,
  update: Partial<T>,
  options?: QueryOptions
): Promise<T> {
  const doc = await updateById(model, id, update, options);
  if (!doc) {
    throw new NotFoundError(model.modelName, id);
  }
  return doc;
}

/**
 * Update one document
 */
export async function updateOne<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  update: Partial<T>,
  options?: QueryOptions
): Promise<T | null> {
  return safeDbOperation(
    async () => {
      const doc = await model
        .findOneAndUpdate(filter, update, { new: true, runValidators: true, ...options })
        .lean();
      return doc as T | null;
    },
    `update ${model.modelName}`
  );
}

/**
 * Update many documents
 */
export async function updateMany<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  update: Partial<T>
): Promise<number> {
  return safeDbOperation(
    async () => {
      const result = await model.updateMany(filter, update);
      return result.modifiedCount || 0;
    },
    `update many ${model.modelName}`
  );
}

/**
 * Delete document by ID
 */
export async function deleteById<T extends Document>(
  model: Model<T>,
  id: string
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  return safeDbOperation(
    async () => {
      const result = await model.findByIdAndDelete(id);
      return result !== null;
    },
    `delete ${model.modelName}`
  );
}

/**
 * Delete many documents
 */
export async function deleteMany<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>
): Promise<number> {
  return safeDbOperation(
    async () => {
      const result = await model.deleteMany(filter);
      return result.deletedCount || 0;
    },
    `delete many ${model.modelName}`
  );
}

/**
 * Count documents
 */
export async function count<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {}
): Promise<number> {
  return safeDbOperation(
    async () => model.countDocuments(filter),
    `count ${model.modelName}`
  );
}

/**
 * Check if document exists
 */
export async function exists<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>
): Promise<boolean> {
  return safeDbOperation(
    async () => {
      const result = await model.exists(filter);
      return result !== null;
    },
    `check ${model.modelName} exists`
  );
}

/**
 * Aggregate with proper error handling
 */
export async function aggregate<T extends Document, R = any>(
  model: Model<T>,
  pipeline: any[]
): Promise<R[]> {
  return safeDbOperation(
    async () => model.aggregate(pipeline),
    `aggregate ${model.modelName}`
  );
}

/**
 * Batch insert documents
 */
export async function bulkCreate<T extends Document>(
  model: Model<T>,
  documents: Partial<T>[]
): Promise<T[]> {
  if (documents.length === 0) {
    return [];
  }

  return safeDbOperation(
    async () => {
      const docs = await model.insertMany(documents, { ordered: false });
      return docs.map((doc) => doc.toObject() as T);
    },
    `bulk create ${model.modelName}`
  );
}

/**
 * Transaction wrapper
 */
export async function transaction<T>(
  callback: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Ensure indexes are created
 * Should be called during application startup
 */
export async function ensureIndexes(): Promise<void> {
  try {
    logger.info('Creating database indexes...');
    
    const models = mongoose.modelNames();
    const indexCreation = models.map(async (modelName) => {
      const model = mongoose.model(modelName);
      await model.createIndexes();
      logger.debug(`Indexes created for ${modelName}`);
    });

    await Promise.all(indexCreation);
    logger.info('All database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create database indexes', error);
    throw new DatabaseError('Failed to create database indexes', error as Error);
  }
}

/**
 * Connection health check
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Wait for database connection
 */
export async function waitForConnection(timeoutMs: number = 10000): Promise<void> {
  const startTime = Date.now();

  while (!isDatabaseConnected()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new DatabaseError('Database connection timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<any> {
  return safeDbOperation(
    async () => {
      const db = mongoose.connection.db;
      return await db.stats();
    },
    'get database stats'
  );
}

/**
 * Optimize common query patterns
 */
export class QueryBuilder<T extends Document> {
  private query: any;

  constructor(private model: Model<T>) {
    this.query = model.find();
  }

  where(filter: FilterQuery<T>): this {
    this.query = this.query.find(filter);
    return this;
  }

  select(fields: string | Record<string, 1 | 0>): this {
    this.query = this.query.select(fields);
    return this;
  }

  sort(sort: string | Record<string, 1 | -1>): this {
    this.query = this.query.sort(sort);
    return this;
  }

  limit(limit: number): this {
    this.query = this.query.limit(limit);
    return this;
  }

  skip(skip: number): this {
    this.query = this.query.skip(skip);
    return this;
  }

  populate(path: string | Record<string, any>): this {
    this.query = this.query.populate(path);
    return this;
  }

  async exec(): Promise<T[]> {
    return safeDbOperation(
      async () => {
        const docs = await this.query.lean();
        return docs as T[];
      },
      `execute query for ${this.model.modelName}`
    );
  }

  async execOne(): Promise<T | null> {
    return safeDbOperation(
      async () => {
        const doc = await this.query.findOne().lean();
        return doc as T | null;
      },
      `execute query for ${this.model.modelName}`
    );
  }

  async count(): Promise<number> {
    return safeDbOperation(
      async () => this.query.countDocuments(),
      `count for ${this.model.modelName}`
    );
  }
}

/**
 * Create query builder
 */
export function query<T extends Document>(model: Model<T>): QueryBuilder<T> {
  return new QueryBuilder(model);
}



