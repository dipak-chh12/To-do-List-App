
import { Task } from './types';

const DB_NAME = 'TomorrowFocusDB';
const STORE_NAME = 'tasks';
const DB_VERSION = 1;

export class TaskDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject('Failed to open database');
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async getAllTasks(): Promise<Task[]> {
    return new Promise((resolve) => {
      if (!this.db) return resolve([]);
      const transaction = this.db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveTask(task: Task): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(task);
      transaction.oncomplete = () => resolve();
    });
  }

  async deleteTask(id: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id);
      transaction.oncomplete = () => resolve();
    });
  }
}

export const db = new TaskDB();
