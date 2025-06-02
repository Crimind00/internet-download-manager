import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertDownloadSchema, type Download } from "@shared/schema";
import axios from "axios";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast update to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Helper function to detect file type from URL
  function detectFileType(url: string, filename: string): string {
    const ext = path.extname(filename || url).toLowerCase();
    
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'].includes(ext)) {
      return 'video';
    }
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
      return 'image';
    }
    if (['.pdf', '.doc', '.docx', '.txt', '.rtf', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) {
      return 'document';
    }
    if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) {
      return 'archive';
    }
    return 'other';
  }

  // Helper function to extract filename from URL
  function extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = path.basename(pathname);
      return filename || 'download';
    } catch {
      return 'download';
    }
  }

  // Get all downloads
  app.get('/api/downloads', async (req, res) => {
    try {
      const downloads = await storage.getDownloads();
      res.json(downloads);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch downloads' });
    }
  });

  // Get downloads by status
  app.get('/api/downloads/status/:status', async (req, res) => {
    try {
      const { status } = req.params;
      const downloads = await storage.getDownloadsByStatus(status);
      res.json(downloads);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch downloads by status' });
    }
  });

  // Get downloads by file type
  app.get('/api/downloads/type/:fileType', async (req, res) => {
    try {
      const { fileType } = req.params;
      const downloads = await storage.getDownloadsByFileType(fileType);
      res.json(downloads);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch downloads by file type' });
    }
  });

  // Create new download
  app.post('/api/downloads', async (req, res) => {
    try {
      const validatedData = insertDownloadSchema.parse(req.body);
      
      // Extract filename and detect file type
      const filename = validatedData.filename || extractFilename(validatedData.url);
      const fileType = detectFileType(validatedData.url, filename);

      const downloadData = {
        ...validatedData,
        filename,
        fileType,
        status: 'queued' as const,
      };

      const download = await storage.createDownload(downloadData);
      
      // Broadcast new download to clients
      broadcast({ type: 'download_created', download });

      // Start download process
      startDownload(download.id);

      res.status(201).json(download);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create download' });
    }
  });

  // Update download (pause/resume/cancel)
  app.patch('/api/downloads/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const download = await storage.updateDownload(id, updates);
      if (!download) {
        return res.status(404).json({ message: 'Download not found' });
      }

      // Broadcast update to clients
      broadcast({ type: 'download_updated', download });

      res.json(download);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update download' });
    }
  });

  // Delete download
  app.delete('/api/downloads/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDownload(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Download not found' });
      }

      // Broadcast deletion to clients
      broadcast({ type: 'download_deleted', id });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete download' });
    }
  });

  // Retry failed download
  app.post('/api/downloads/:id/retry', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const download = await storage.getDownload(id);
      
      if (!download) {
        return res.status(404).json({ message: 'Download not found' });
      }

      const updatedDownload = await storage.updateDownload(id, {
        status: 'queued',
        errorMessage: null,
        downloadedBytes: 0,
        speed: 0,
        eta: 0,
      });

      if (updatedDownload) {
        broadcast({ type: 'download_updated', download: updatedDownload });
        startDownload(id);
      }

      res.json(updatedDownload);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retry download' });
    }
  });

  // Download process simulation (in a real app, this would be more sophisticated)
  async function startDownload(downloadId: number) {
    try {
      const download = await storage.getDownload(downloadId);
      if (!download || download.status !== 'queued') return;

      // Start downloading
      await storage.updateDownload(downloadId, { status: 'downloading' });
      broadcast({ type: 'download_updated', download: await storage.getDownload(downloadId) });

      // Simulate download progress
      const totalSize = download.fileSize || Math.floor(Math.random() * 500 + 50) * 1024 * 1024; // Random size between 50-550 MB
      await storage.updateDownload(downloadId, { fileSize: totalSize });

      let downloadedBytes = download.downloadedBytes || 0;
      const chunkSize = Math.floor(Math.random() * 2 + 1) * 1024 * 1024; // 1-3 MB chunks

      while (downloadedBytes < totalSize) {
        const currentDownload = await storage.getDownload(downloadId);
        if (!currentDownload || currentDownload.status === 'paused' || currentDownload.status === 'failed') {
          break;
        }

        // Simulate download progress
        const progressChunk = Math.min(chunkSize, totalSize - downloadedBytes);
        downloadedBytes += progressChunk;
        
        const speed = Math.floor(Math.random() * 3 + 0.5) * 1024 * 1024; // 0.5-3.5 MB/s
        const remainingBytes = totalSize - downloadedBytes;
        const eta = remainingBytes > 0 ? Math.floor(remainingBytes / speed) : 0;

        await storage.updateDownload(downloadId, {
          downloadedBytes,
          speed,
          eta,
        });

        const updatedDownload = await storage.getDownload(downloadId);
        broadcast({ type: 'download_progress', download: updatedDownload });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Complete download if not paused/failed
      const finalDownload = await storage.getDownload(downloadId);
      if (finalDownload && finalDownload.status === 'downloading') {
        await storage.updateDownload(downloadId, {
          status: 'completed',
          completedAt: new Date(),
          speed: 0,
          eta: 0,
        });

        const completedDownload = await storage.getDownload(downloadId);
        broadcast({ type: 'download_completed', download: completedDownload });
      }
    } catch (error) {
      console.error('Download error:', error);
      await storage.updateDownload(downloadId, {
        status: 'failed',
        errorMessage: 'Download failed due to network error',
        speed: 0,
        eta: 0,
      });

      const failedDownload = await storage.getDownload(downloadId);
      broadcast({ type: 'download_failed', download: failedDownload });
    }
  }

  return httpServer;
}
