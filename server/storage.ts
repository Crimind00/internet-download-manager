import { downloads, users, type Download, type InsertDownload, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Download methods
  getDownloads(): Promise<Download[]>;
  getDownload(id: number): Promise<Download | undefined>;
  createDownload(download: InsertDownload): Promise<Download>;
  updateDownload(id: number, updates: Partial<Download>): Promise<Download | undefined>;
  deleteDownload(id: number): Promise<boolean>;
  getDownloadsByStatus(status: string): Promise<Download[]>;
  getDownloadsByFileType(fileType: string): Promise<Download[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private downloads: Map<number, Download>;
  private currentUserId: number;
  private currentDownloadId: number;

  constructor() {
    this.users = new Map();
    this.downloads = new Map();
    this.currentUserId = 1;
    this.currentDownloadId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDownloads(): Promise<Download[]> {
    return Array.from(this.downloads.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getDownload(id: number): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = this.currentDownloadId++;
    const download: Download = {
      ...insertDownload,
      id,
      status: insertDownload.status || "queued",
      fileType: insertDownload.fileType || null,
      fileSize: insertDownload.fileSize || null,
      errorMessage: insertDownload.errorMessage || null,
      createdAt: new Date(),
      completedAt: null,
      downloadedBytes: 0,
      speed: 0,
      eta: 0,
    };
    this.downloads.set(id, download);
    return download;
  }

  async updateDownload(id: number, updates: Partial<Download>): Promise<Download | undefined> {
    const download = this.downloads.get(id);
    if (!download) return undefined;

    const updatedDownload = { ...download, ...updates };
    this.downloads.set(id, updatedDownload);
    return updatedDownload;
  }

  async deleteDownload(id: number): Promise<boolean> {
    return this.downloads.delete(id);
  }

  async getDownloadsByStatus(status: string): Promise<Download[]> {
    return Array.from(this.downloads.values()).filter(d => d.status === status);
  }

  async getDownloadsByFileType(fileType: string): Promise<Download[]> {
    return Array.from(this.downloads.values()).filter(d => d.fileType === fileType);
  }
}

export const storage = new MemStorage();
