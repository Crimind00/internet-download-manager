import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "@shared/schema";
import { Sidebar } from "@/components/sidebar";
import { DownloadItem } from "@/components/download-item";
import { SpeedMeter } from "@/components/speed-meter";
import { useWebSocket } from "@/hooks/use-websocket";
import { formatBytes, formatSpeed } from "@/lib/download-utils";
import { Button } from "@/components/ui/button";
import { Settings, HelpCircle, RotateCcw, Trash2 } from "lucide-react";

export default function DownloadManager() {
  const [filter, setFilter] = useState<string>("all");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");

  const { data: downloads = [], refetch } = useQuery<Download[]>({
    queryKey: ["/api/downloads"],
  });

  // WebSocket connection for real-time updates
  useWebSocket({
    onMessage: (data) => {
      if (data.type === 'download_created' || 
          data.type === 'download_updated' || 
          data.type === 'download_progress' || 
          data.type === 'download_completed' || 
          data.type === 'download_failed' || 
          data.type === 'download_deleted') {
        refetch();
      }
    },
  });

  const filteredDownloads = downloads.filter(download => {
    const statusMatch = filter === "all" || download.status === filter;
    const typeMatch = fileTypeFilter === "all" || download.fileType === fileTypeFilter;
    return statusMatch && typeMatch;
  });

  const activeDownloads = downloads.filter(d => d.status === 'downloading');
  const queuedDownloads = downloads.filter(d => d.status === 'queued');
  const totalSpeed = activeDownloads.reduce((sum, d) => sum + (d.speed || 0), 0);

  const downloadCounts = {
    total: downloads.length,
    active: downloads.filter(d => d.status === 'downloading').length,
    paused: downloads.filter(d => d.status === 'paused').length,
    completed: downloads.filter(d => d.status === 'completed').length,
    failed: downloads.filter(d => d.status === 'failed').length,
  };

  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-dark">DownloadMax Pro</h1>
          </div>
          <nav className="hidden md:flex space-x-6 ml-8">
            <button 
              className={`text-sm font-medium transition-colors ${filter === 'all' ? 'text-primary' : 'text-neutral-medium hover:text-primary'}`}
              onClick={() => setFilter('all')}
            >
              Downloads
            </button>
            <button 
              className={`text-sm font-medium transition-colors ${filter === 'completed' ? 'text-primary' : 'text-neutral-medium hover:text-primary'}`}
              onClick={() => setFilter('completed')}
            >
              History
            </button>
          </nav>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          downloadCounts={downloadCounts}
          filter={filter}
          setFilter={setFilter}
          fileTypeFilter={fileTypeFilter}
          setFileTypeFilter={setFileTypeFilter}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-medium text-neutral-dark">
                {filter === 'all' ? 'All Downloads' : 
                 filter === 'downloading' ? 'Active Downloads' :
                 filter === 'completed' ? 'Download History' :
                 filter.charAt(0).toUpperCase() + filter.slice(1) + ' Downloads'}
              </h2>
              <span className="text-sm text-neutral-medium">
                {activeDownloads.length} downloading, {queuedDownloads.length} queued
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-neutral-medium">
                <span>Speed:</span>
                <span className="font-medium text-primary">{formatSpeed(totalSpeed)}</span>
              </div>
              <Button variant="ghost" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Downloads List */}
          <div className="flex-1 overflow-auto p-6">
            {filteredDownloads.length > 0 ? (
              <div className="space-y-4">
                {filteredDownloads.map((download) => (
                  <DownloadItem key={download.id} download={download} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-dark mb-2">No downloads found</h3>
                <p className="text-neutral-medium mb-4">
                  {filter === 'all' 
                    ? 'Paste a URL in the sidebar to start downloading files'
                    : `No ${filter} downloads to show`
                  }
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Speed Meter */}
      {totalSpeed > 0 && <SpeedMeter currentSpeed={totalSpeed} />}
    </div>
  );
}
