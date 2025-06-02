import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDownloadSchema, type InsertDownload } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Play,
  Pause,
  Download,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertTriangle,
  Video,
  Image,
  FileText,
  Archive,
  File
} from "lucide-react";

interface SidebarProps {
  downloadCounts: {
    total: number;
    active: number;
    paused: number;
    completed: number;
    failed: number;
  };
  filter: string;
  setFilter: (filter: string) => void;
  fileTypeFilter: string;
  setFileTypeFilter: (filter: string) => void;
}

export function Sidebar({ downloadCounts, filter, setFilter, fileTypeFilter, setFileTypeFilter }: SidebarProps) {
  const { toast } = useToast();

  const form = useForm<InsertDownload>({
    resolver: zodResolver(insertDownloadSchema),
    defaultValues: {
      url: "",
      filename: "",
      status: "queued",
    },
  });

  const addDownloadMutation = useMutation({
    mutationFn: async (data: InsertDownload) => {
      await apiRequest("POST", "/api/downloads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      form.reset();
      toast({
        title: "Download added",
        description: "Your download has been added to the queue",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add download",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDownload) => {
    addDownloadMutation.mutate(data);
  };

  const categoryItems = [
    {
      key: "all",
      label: "All Downloads",
      icon: Download,
      count: downloadCounts.total,
      color: "text-primary bg-blue-50",
    },
    {
      key: "downloading",
      label: "Active",
      icon: PlayCircle,
      count: downloadCounts.active,
      color: "text-success",
    },
    {
      key: "paused",
      label: "Paused",
      icon: PauseCircle,
      count: downloadCounts.paused,
      color: "text-warning",
    },
    {
      key: "completed",
      label: "Completed",
      icon: CheckCircle,
      count: downloadCounts.completed,
      color: "text-success",
    },
    {
      key: "failed",
      label: "Failed",
      icon: AlertTriangle,
      count: downloadCounts.failed,
      color: "text-error",
    },
  ];

  const fileTypeItems = [
    { key: "video", label: "Videos", icon: Video, color: "text-purple-500" },
    { key: "image", label: "Images", icon: Image, color: "text-green-500" },
    { key: "archive", label: "Archives", icon: Archive, color: "text-orange-500" },
    { key: "document", label: "Documents", icon: FileText, color: "text-blue-500" },
    { key: "other", label: "Other", icon: File, color: "text-gray-500" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Add New Download
            </label>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Paste download URL here..."
                          {...field}
                          className="text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addDownloadMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Download
                </Button>
              </form>
            </Form>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              <Play className="h-3 w-3 mr-1" />
              Resume All
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              <Pause className="h-3 w-3 mr-1" />
              Pause All
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-neutral-dark mb-3">Categories</h3>
        <nav className="space-y-1">
          {categoryItems.map((item) => {
            const Icon = item.icon;
            const isActive = filter === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? "text-primary bg-blue-50"
                    : "text-neutral-medium hover:text-neutral-dark hover:bg-neutral-light"
                }`}
              >
                <Icon className={`h-4 w-4 mr-3 ${isActive ? "text-primary" : item.color}`} />
                <span className="flex-1 text-left">{item.label}</span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    isActive ? "bg-primary text-white" : "bg-gray-200 text-neutral-dark"
                  }`}
                >
                  {item.count}
                </Badge>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 flex-1">
        <h3 className="text-sm font-medium text-neutral-dark mb-3">File Types</h3>
        <div className="space-y-1">
          {fileTypeItems.map((item) => {
            const Icon = item.icon;
            const isActive = fileTypeFilter === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => setFileTypeFilter(isActive ? "all" : item.key)}
                className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? "text-primary bg-blue-50"
                    : "text-neutral-medium hover:text-neutral-dark hover:bg-neutral-light"
                }`}
              >
                <Icon className={`h-4 w-4 mr-3 ${isActive ? "text-primary" : item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
