"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  FileText,
  ImageIcon,
  Video,
  Music,
  Shield,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Share2,
  X,
} from "lucide-react"
import { WebRTCFileTransfer } from "@/lib/webrtc-file-transfer"
import { FileEncryption } from "@/lib/encryption"

interface FileTransfer {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  progress: number
  status: "pending" | "connecting" | "transferring" | "completed" | "failed" | "cancelled"
  direction: "sending" | "receiving"
  peerId: string
  peerName: string
  encrypted: boolean
  startTime: number
  endTime?: number
  speed?: number
}

interface P2PFileTransferProps {
  isOpen: boolean
  onClose: () => void
  contactId: string
  contactName: string
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-green-500" />
  if (fileType.startsWith("video/")) return <Video className="h-5 w-5 text-red-500" />
  if (fileType.startsWith("audio/")) return <Music className="h-5 w-5 text-purple-500" />
  return <FileText className="h-5 w-5 text-blue-500" />
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const formatSpeed = (bytesPerSecond: number): string => {
  return formatFileSize(bytesPerSecond) + "/s"
}

const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

export function P2PFileTransfer({ isOpen, onClose, contactId, contactName }: P2PFileTransferProps) {
  const [transfers, setTransfers] = useState<FileTransfer[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [encryptionEnabled, setEncryptionEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const webrtcRef = useRef<WebRTCFileTransfer | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && !webrtcRef.current) {
      initializeConnection()
    }

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.close()
        webrtcRef.current = null
      }
    }
  }, [isOpen])

  const initializeConnection = async () => {
    setConnectionStatus("connecting")

    try {
      webrtcRef.current = new WebRTCFileTransfer(
        (progress) => updateTransferProgress(progress),
        (file) => handleFileReceived(file),
        (error) => handleTransferError(error),
      )

      // Simulate connection establishment
      setTimeout(() => {
        setConnectionStatus("connected")
        setIsConnected(true)
        toast({
          title: "P2P Connection Established",
          description: `Connected to ${contactName} for secure file transfer`,
        })
      }, 2000)
    } catch (error) {
      setConnectionStatus("disconnected")
      toast({
        title: "Connection Failed",
        description: "Unable to establish P2P connection",
        variant: "destructive",
      })
    }
  }

  const updateTransferProgress = (progress: number) => {
    setTransfers((prev) =>
      prev.map((transfer) => {
        if (transfer.status === "transferring") {
          const now = Date.now()
          const elapsed = now - transfer.startTime
          const speed = elapsed > 0 ? (transfer.fileSize * (progress / 100)) / (elapsed / 1000) : 0

          return {
            ...transfer,
            progress,
            speed,
            status: progress >= 100 ? "completed" : "transferring",
            endTime: progress >= 100 ? now : undefined,
          }
        }
        return transfer
      }),
    )
  }

  const handleFileReceived = (file: File) => {
    const transferId = Date.now().toString()
    const newTransfer: FileTransfer = {
      id: transferId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      progress: 100,
      status: "completed",
      direction: "receiving",
      peerId: contactId,
      peerName: contactName,
      encrypted: encryptionEnabled,
      startTime: Date.now(),
      endTime: Date.now(),
    }

    setTransfers((prev) => [...prev, newTransfer])

    // Auto-download received file
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "File Received",
      description: `${file.name} has been downloaded`,
    })
  }

  const handleTransferError = (error: string) => {
    setTransfers((prev) =>
      prev.map((transfer) => (transfer.status === "transferring" ? { ...transfer, status: "failed" } : transfer)),
    )

    toast({
      title: "Transfer Failed",
      description: error,
      variant: "destructive",
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setSelectedFiles(Array.from(files))
    }
  }

  const startFileTransfer = async () => {
    if (!webrtcRef.current || !isConnected || selectedFiles.length === 0) return

    for (const file of selectedFiles) {
      const transferId = Date.now().toString() + Math.random()
      const newTransfer: FileTransfer = {
        id: transferId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        progress: 0,
        status: "connecting",
        direction: "sending",
        peerId: contactId,
        peerName: contactName,
        encrypted: encryptionEnabled,
        startTime: Date.now(),
      }

      setTransfers((prev) => [...prev, newTransfer])

      try {
        let fileToSend = file

        if (encryptionEnabled) {
          // Encrypt file before sending
          const { encryptedData, key, iv } = await FileEncryption.encryptFile(file)
          fileToSend = new File([encryptedData], file.name + ".encrypted", { type: "application/octet-stream" })

          // In a real implementation, you'd securely exchange the key
          console.log("File encrypted with key:", key, "and IV:", iv)
        }

        setTransfers((prev) => prev.map((t) => (t.id === transferId ? { ...t, status: "transferring" } : t)))

        await webrtcRef.current.sendFile(fileToSend)
      } catch (error) {
        setTransfers((prev) => prev.map((t) => (t.id === transferId ? { ...t, status: "failed" } : t)))

        toast({
          title: "Transfer Failed",
          description: `Failed to send ${file.name}`,
          variant: "destructive",
        })
      }
    }

    setSelectedFiles([])
  }

  const cancelTransfer = (transferId: string) => {
    setTransfers((prev) =>
      prev.map((transfer) => (transfer.id === transferId ? { ...transfer, status: "cancelled" } : transfer)),
    )
  }

  const removeTransfer = (transferId: string) => {
    setTransfers((prev) => prev.filter((transfer) => transfer.id !== transferId))
  }

  const getStatusIcon = (status: FileTransfer["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "transferring":
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: FileTransfer["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "failed":
      case "cancelled":
        return "bg-red-500"
      case "transferring":
        return "bg-blue-500"
      default:
        return "bg-yellow-500"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            P2P File Transfer with {contactName}
          </DialogTitle>
          <DialogDescription>
            Send and receive files directly without server storage using encrypted peer-to-peer connection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <Badge variant={isConnected ? "default" : "destructive"}>{connectionStatus}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Direct connection to {contactName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEncryptionEnabled(!encryptionEnabled)}
                    className="gap-2"
                  >
                    {encryptionEnabled ? (
                      <>
                        <Lock className="h-3 w-3" />
                        Encrypted
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3" />
                        Unencrypted
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Send Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Select files to send directly to {contactName}</p>
                <Input type="file" multiple onChange={handleFileSelect} className="hidden" id="p2p-file-input" />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("p2p-file-input")?.click()}
                  disabled={!isConnected}
                >
                  Choose Files
                </Button>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Files:</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(file.type)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={startFileTransfer} disabled={!isConnected} className="gap-2">
                      <Upload className="h-4 w-4" />
                      Send {selectedFiles.length} file(s)
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedFiles([])}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfer History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Transfer Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-3">
                {transfers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No file transfers yet</p>
                ) : (
                  transfers.map((transfer) => (
                    <div key={transfer.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(transfer.fileType)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{transfer.fileName}</p>
                              {transfer.encrypted && <Shield className="h-3 w-3 text-green-500" />}
                              <Badge variant="outline" className="text-xs">
                                {transfer.direction}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(transfer.fileSize)}
                              {transfer.speed && transfer.status === "transferring" && (
                                <> • {formatSpeed(transfer.speed)}</>
                              )}
                              {transfer.endTime && <> • {formatDuration(transfer.endTime - transfer.startTime)}</>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transfer.status)}
                          {transfer.status === "transferring" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => cancelTransfer(transfer.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                          {(transfer.status === "completed" ||
                            transfer.status === "failed" ||
                            transfer.status === "cancelled") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeTransfer(transfer.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {transfer.status === "transferring" && (
                        <div className="space-y-1">
                          <Progress value={transfer.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">{Math.round(transfer.progress)}% complete</p>
                        </div>
                      )}

                      {transfer.status === "completed" && (
                        <div className={`h-2 ${getStatusColor(transfer.status)} rounded-full`} />
                      )}

                      {(transfer.status === "failed" || transfer.status === "cancelled") && (
                        <div className={`h-2 ${getStatusColor(transfer.status)} rounded-full`} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
