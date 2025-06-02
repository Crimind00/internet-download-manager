import { useMutation } from "@tanstack/react-query";
import { Download } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatBytes, formatSpeed, formatTime, getFileIcon } from "@/lib/download-utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  X, 
  RotateCcw, 
  ArrowUp,
  Download as DownloadIcon,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface DownloadItemProps {
  download: Download;
}

export function DownloadItem({ download }: DownloadItemProps) {
  const updateDownloadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Download> }) => {
      await apiRequest("PATCH", `/api/downloads/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
    },
  });

  const deleteDownloadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/downloads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
    },
  });

  const retryDownloadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/downloads/${id}/retry`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
    },
  });

  const handlePause = () => {
    updateDownloadMutation.mutate({
      id: download.id,
      updates: { status: "paused" }
    });
  };

  const handleResume = () => {
    updateDownloadMutation.mutate({
      id: download.id,
      updates: { status: "queued" }
    });
  };

  const handleCancel = () => {
    deleteDownloadMutation.mutate(download.id);
  };

  const handleRetry = () => {
    retryDownloadMutation.mutate(download.id);
  };

  const progress = download.fileSize ? (download.downloadedBytes / download.fileSize) * 100 : 0;

  const getStatusIcon = () => {
    switch (download.status) {
      case 'downloading':
        return <DownloadIcon className="h-3 w-3" />;
      case 'paused':
        return <Pause className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'failed':
        return <AlertTriangle className="h-3 w-3" />;
      case 'queued':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (download.status) {
      case 'downloading':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'queued':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBorderColor = () => {
    return download.status === 'failed' ? 'border-red-200' : 'border-gray-200';
  };

  return (
    <div className={`bg-white rounded-lg border ${getBorderColor()} p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            {getFileIcon(download.fileType || 'other')}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-dark truncate">
              {download.filename}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="ml-1 capitalize">{download.status}</span>
              </Badge>
              
              <div className="flex space-x-1">
                {download.status === 'downloading' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handlePause}
                    disabled={updateDownloadMutation.isPending}
                    className="h-6 w-6 p-0 text-warning hover:bg-orange-50"
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                )}
                
                {download.status === 'paused' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleResume}
                    disabled={updateDownloadMutation.isPending}
                    className="h-6 w-6 p-0 text-success hover:bg-green-50"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                
                {download.status === 'failed' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRetry}
                    disabled={retryDownloadMutation.isPending}
                    className="h-6 w-6 p-0 text-primary hover:bg-blue-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                
                {download.status === 'queued' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-primary hover:bg-blue-50"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancel}
                  disabled={deleteDownloadMutation.isPending}
                  className="h-6 w-6 p-0 text-error hover:bg-red-50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {download.status === 'failed' && download.errorMessage && (
              <div className="text-xs text-red-600 mb-1">
                Error: {download.errorMessage}
              </div>
            )}
            
            <div className="flex items-center text-xs text-neutral-medium space-x-4">
              {download.fileSize && (
                <span>{formatBytes(download.fileSize)}</span>
              )}
              {download.status === 'downloading' && download.speed && (
                <span>{formatSpeed(download.speed)}</span>
              )}
              {download.status === 'downloading' && download.eta && (
                <span>{formatTime(download.eta)} remaining</span>
              )}
              {download.status === 'paused' && (
                <span>Paused at {Math.round(progress)}%</span>
              )}
              {(download.status === 'downloading' || download.status === 'paused') && (
                <span>{Math.round(progress)}% complete</span>
              )}
            </div>
            
            {download.status !== 'queued' && download.status !== 'failed' && (
              <Progress 
                value={progress} 
                className="w-full h-2"
              />
            )}
            
            <div className="text-xs text-neutral-medium">
              <span>From: </span>
              <span className="text-primary break-all">{download.url}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
