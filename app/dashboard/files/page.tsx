"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  ChevronDown,
  Download,
  FileText,
  Filter,
  Grid3X3,
  ImageIcon,
  LayoutList,
  MoreHorizontal,
  Music,
  Search,
  Share2,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react"
import { P2PFileTransfer } from "@/components/p2p-file-transfer"

type FileType = "document" | "image" | "video" | "audio" | "other"

interface FileItem {
  id: string
  name: string
  type: FileType
  size: string
  sizeBytes: number
  modified: string
  shared: boolean
  url?: string
  file?: File
}

const getFileType = (fileName: string): FileType => {
  const extension = fileName.split(".").pop()?.toLowerCase()
  if (!extension) return "other"

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) return "image"
  if (["mp4", "avi", "mov", "wmv", "flv"].includes(extension)) return "video"
  if (["mp3", "wav", "flac", "aac"].includes(extension)) return "audio"
  if (["pdf", "doc", "docx", "txt", "rtf", "ppt", "pptx", "xls", "xlsx"].includes(extension)) return "document"
  return "other"
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const getFileIcon = (type: FileType) => {
  switch (type) {
    case "document":
      return <FileText className="h-6 w-6 text-blue-500" />
    case "image":
      return <ImageIcon className="h-6 w-6 text-green-500" />
    case "video":
      return <Video className="h-6 w-6 text-red-500" />
    case "audio":
      return <Music className="h-6 w-6 text-purple-500" />
    default:
      return <FileText className="h-6 w-6 text-gray-500" />
  }
}

export default function FilesPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filterType, setFilterType] = useState<string>("all")
  const { toast } = useToast()

  const [p2pTransferOpen, setP2pTransferOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<{ id: string; name: string } | null>(null)

  // Load files from localStorage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem("commshare-files")
    if (savedFiles) {
      try {
        setFiles(JSON.parse(savedFiles))
      } catch (error) {
        console.error("Error loading files:", error)
      }
    }
  }, [])

  // Save files to localStorage whenever files change
  useEffect(() => {
    localStorage.setItem("commshare-files", JSON.stringify(files))
  }, [files])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      setSelectedFiles(Array.from(fileList))
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const newFiles: FileItem[] = []

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]

        // Simulate upload progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100)

        // Create file URL for preview/download
        const fileUrl = URL.createObjectURL(file)

        const newFile: FileItem = {
          id: Date.now().toString() + i,
          name: file.name,
          type: getFileType(file.name),
          size: formatFileSize(file.size),
          sizeBytes: file.size,
          modified: new Date().toLocaleDateString(),
          shared: false,
          url: fileUrl,
          file: file,
        }

        newFiles.push(newFile)

        // Small delay to simulate upload time
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      setFiles((prev) => [...newFiles, ...prev])
      setSelectedFiles([])
      setUploadDialogOpen(false)

      toast({
        title: "Upload successful",
        description: `${newFiles.length} file(s) uploaded successfully.`,
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDownload = (file: FileItem) => {
    if (file.url && file.file) {
      const link = document.createElement("a")
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: `Downloading ${file.name}`,
      })
    }
  }

  const handleDelete = (fileId: string) => {
    const fileToDelete = files.find((f) => f.id === fileId)
    if (fileToDelete?.url) {
      URL.revokeObjectURL(fileToDelete.url)
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId))

    toast({
      title: "File deleted",
      description: "File has been successfully deleted.",
    })
  }

  const handleShare = (file: FileItem) => {
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, shared: !f.shared } : f)))

    toast({
      title: file.shared ? "File unshared" : "File shared",
      description: file.shared ? `${file.name} is no longer shared.` : `${file.name} has been shared with your team.`,
    })
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      filterType === "all" ||
      (filterType === "shared" && file.shared) ||
      (filterType === "documents" && file.type === "document") ||
      (filterType === "images" && file.type === "image") ||
      (filterType === "videos" && file.type === "video") ||
      (filterType === "audio" && file.type === "audio")

    return matchesSearch && matchesFilter
  })

  const totalSize = files.reduce((acc, file) => acc + file.sizeBytes, 0)
  const maxSize = 6 * 1024 * 1024 * 1024 // 6GB limit
  const usagePercentage = (totalSize / maxSize) * 100

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Files</h1>
          <p className="text-muted-foreground">
            {files.length} files • {formatFileSize(totalSize)} used of {formatFileSize(maxSize)}
          </p>
          <Progress value={usagePercentage} className="w-48 h-2 mt-2" />
        </div>

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>Select files to upload to your storage</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Drop your files here or click to browse</p>
                <Input type="file" className="hidden" id="file-upload" multiple onChange={handleFileSelect} />
                <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                  Select Files
                </Button>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected files:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(getFileType(file.name))}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeSelectedFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading}>
                {uploading ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {filterType === "all"
                  ? "All Files"
                  : filterType === "shared"
                    ? "Shared"
                    : filterType === "documents"
                      ? "Documents"
                      : filterType === "images"
                        ? "Images"
                        : filterType === "videos"
                          ? "Videos"
                          : filterType === "audio"
                            ? "Audio"
                            : "Filter"}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => setFilterType("all")}>All Files</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("documents")}>Documents</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("images")}>Images</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("videos")}>Videos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("audio")}>Audio</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType("shared")}>Shared with me</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-none rounded-l-md"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-none rounded-r-md"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {files.length === 0 ? "No files uploaded yet" : "No files match your search"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <span>{file.name}</span>
                        {file.shared && <Share2 className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>{file.modified}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(file)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            {file.shared ? "Unshare" : "Share"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedContact({ id: "1", name: "Sarah Johnson" })
                              setP2pTransferOpen(true)
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            P2P Transfer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(file.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              {files.length === 0 ? "No files uploaded yet" : "No files match your search"}
            </div>
          ) : (
            filteredFiles.map((file) => (
              <Card key={file.id} className="overflow-hidden">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {file.type === "image" && file.url ? (
                    <img src={file.url || "/placeholder.svg"} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-6">{getFileIcon(file.type)}</div>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="truncate mr-2">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size}</p>
                      {file.shared && (
                        <div className="flex items-center gap-1 mt-1">
                          <Share2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Shared</span>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(file)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          {file.shared ? "Unshare" : "Share"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(file.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
      {/* P2P File Transfer */}
      {selectedContact && (
        <P2PFileTransfer
          isOpen={p2pTransferOpen}
          onClose={() => setP2pTransferOpen(false)}
          contactId={selectedContact.id}
          contactName={selectedContact.name}
        />
      )}
    </div>
  )
}
