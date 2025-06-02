import React from "react";
import { Video, Image, Archive, FileText, File } from "lucide-react";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

export function getFileIcon(fileType: string) {
  const iconProps = { className: "h-6 w-6" };
  
  switch (fileType) {
    case 'video':
      return <Video {...iconProps} className="h-6 w-6 text-blue-600" />;
    case 'image':
      return <Image {...iconProps} className="h-6 w-6 text-green-600" />;
    case 'archive':
      return <Archive {...iconProps} className="h-6 w-6 text-orange-600" />;
    case 'document':
      return <FileText {...iconProps} className="h-6 w-6 text-purple-600" />;
    default:
      return <File {...iconProps} className="h-6 w-6 text-gray-600" />;
  }
}