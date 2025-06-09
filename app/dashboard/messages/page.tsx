"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Archive,
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  Clock,
  Copy,
  Download,
  FileText,
  Forward,
  ImageIcon,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Pin,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  Video,
  VolumeX,
  X,
  MessageSquare,
  Share2,
} from "lucide-react"
import { VoiceVideoCall } from "@/components/voice-video-call"
import { P2PFileTransfer } from "@/components/p2p-file-transfer"

interface Contact {
  id: string
  name: string
  avatar: string
  status: "online" | "offline" | "away"
  lastSeen: string
  lastMessage: string
  time: string
  unread: number
  pinned: boolean
  archived: boolean
  isGroup: boolean
  typing: boolean
}

interface Message {
  id: string
  content: string
  time: string
  timestamp: number
  sender: "me" | "them"
  status: "sending" | "sent" | "delivered" | "read"
  contactId: string
  replyTo?: string
  reactions: { emoji: string; users: string[] }[]
  attachments?: {
    type: "image" | "document" | "voice" | "video"
    name: string
    size?: string
    url?: string
    duration?: string
  }[]
  forwarded?: boolean
}

const initialContacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    lastSeen: "online",
    lastMessage: "Can you send me the latest design files?",
    time: "12:45 PM",
    unread: 2,
    pinned: true,
    archived: false,
    isGroup: false,
    typing: false,
  },
  {
    id: "2",
    name: "Design Team",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    lastSeen: "online",
    lastMessage: "Michael: Great work on the new mockups!",
    time: "11:30 AM",
    unread: 5,
    pinned: false,
    archived: false,
    isGroup: true,
    typing: true,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "away",
    lastSeen: "last seen 5 minutes ago",
    lastMessage: "Let's schedule a meeting for tomorrow",
    time: "Yesterday",
    unread: 0,
    pinned: false,
    archived: false,
    isGroup: false,
    typing: false,
  },
  {
    id: "4",
    name: "David Kim",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "offline",
    lastSeen: "last seen yesterday at 6:30 PM",
    lastMessage: "Thanks for your help with the presentation",
    time: "Yesterday",
    unread: 0,
    pinned: false,
    archived: false,
    isGroup: false,
    typing: false,
  },
  {
    id: "5",
    name: "Marketing Team",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    lastSeen: "online",
    lastMessage: "New campaign assets are ready for review",
    time: "2 days ago",
    unread: 0,
    pinned: false,
    archived: false,
    isGroup: true,
    typing: false,
  },
]

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } else if (diffInHours < 48) {
    return "Yesterday"
  } else {
    return date.toLocaleDateString()
  }
}

const MessageStatus = ({ status }: { status: Message["status"] }) => {
  switch (status) {
    case "sending":
      return <Clock className="h-3 w-3 text-muted-foreground" />
    case "sent":
      return <Check className="h-3 w-3 text-muted-foreground" />
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />
    case "read":
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    default:
      return null
  }
}

export default function WhatsAppMessages() {
  const [searchQuery, setSearchQuery] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const [callOpen, setCallOpen] = useState(false)
  const [callType, setCallType] = useState<"voice" | "video">("voice")
  const [isIncomingCall, setIsIncomingCall] = useState(false)

  const [p2pTransferOpen, setP2pTransferOpen] = useState(false)

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("whatsapp-messages")
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (error) {
        console.error("Error loading messages:", error)
      }
    }
  }, [])

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem("whatsapp-messages", JSON.stringify(messages))
  }, [messages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Simulate typing and auto-responses
  useEffect(() => {
    if (!activeContact) return

    const interval = setInterval(() => {
      // Random chance to receive a message
      if (Math.random() < 0.05) {
        const responses = [
          "Hey! How are you doing?",
          "Thanks for the update!",
          "Looks great! 👍",
          "Can we schedule a call?",
          "Perfect, thanks!",
          "I'll review this and get back to you",
          "Sounds good to me!",
          "Let me check and confirm",
        ]

        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        const newMessage: Message = {
          id: Date.now().toString(),
          content: randomResponse,
          time: formatTime(Date.now()),
          timestamp: Date.now(),
          sender: "them",
          status: "delivered",
          contactId: activeContact.id,
          reactions: [],
        }

        setMessages((prev) => [...prev, newMessage])
        updateContactLastMessage(activeContact.id, randomResponse)

        // Mark as read after 2 seconds
        setTimeout(() => {
          setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "read" } : msg)))
        }, 2000)
      }

      // Random typing indicator
      if (Math.random() < 0.1) {
        setContacts((prev) =>
          prev.map((contact) => (contact.id === activeContact.id ? { ...contact, typing: !contact.typing } : contact)),
        )
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [activeContact])

  const updateContactLastMessage = (contactId: string, message: string) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              lastMessage: message,
              time: formatTime(Date.now()),
              unread: contact.unread + 1,
            }
          : contact,
      ),
    )
  }

  const filteredContacts = contacts
    .filter((contact) => !contact.archived)
    .filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })

  const currentMessages = messages.filter((msg) => msg.contactId === activeContact?.id)

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return
    if (!activeContact) return

    const timestamp = Date.now()
    const attachments =
      selectedFiles.length > 0
        ? selectedFiles.map((file) => ({
            type: file.type.startsWith("image/")
              ? ("image" as const)
              : file.type.startsWith("video/")
                ? ("video" as const)
                : ("document" as const),
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            url: URL.createObjectURL(file),
          }))
        : undefined

    const message: Message = {
      id: timestamp.toString(),
      content: newMessage.trim(),
      time: formatTime(timestamp),
      timestamp,
      sender: "me",
      status: "sending",
      contactId: activeContact.id,
      replyTo: replyingTo?.id,
      reactions: [],
      attachments,
    }

    setMessages((prev) => [...prev, message])

    // Update message status progression
    setTimeout(() => {
      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, status: "sent" } : msg)))
    }, 500)

    setTimeout(() => {
      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, status: "delivered" } : msg)))
    }, 1000)

    setTimeout(() => {
      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, status: "read" } : msg)))
    }, 2000)

    const lastMessageText = newMessage.trim() || (attachments ? `📎 ${attachments.length} file(s)` : "")
    updateContactLastMessage(activeContact.id, lastMessageText)

    setNewMessage("")
    setSelectedFiles([])
    setReplyingTo(null)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions.find((r) => r.emoji === emoji)
          if (existingReaction) {
            if (existingReaction.users.includes("me")) {
              // Remove reaction
              return {
                ...msg,
                reactions: msg.reactions
                  .map((r) => (r.emoji === emoji ? { ...r, users: r.users.filter((u) => u !== "me") } : r))
                  .filter((r) => r.users.length > 0),
              }
            } else {
              // Add reaction
              return {
                ...msg,
                reactions: msg.reactions.map((r) => (r.emoji === emoji ? { ...r, users: [...r.users, "me"] } : r)),
              }
            }
          } else {
            // New reaction
            return {
              ...msg,
              reactions: [...msg.reactions, { emoji, users: ["me"] }],
            }
          }
        }
        return msg
      }),
    )
  }

  const handleContactClick = (contact: Contact) => {
    setActiveContact(contact)
    setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, unread: 0, typing: false } : c)))
  }

  const handlePinContact = (contactId: string) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, pinned: !c.pinned } : c)))
  }

  const handleArchiveContact = (contactId: string) => {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, archived: !c.archived } : c)))
    if (activeContact?.id === contactId) {
      setActiveContact(null)
    }
  }

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      // Start recording
      toast({
        title: "Recording started",
        description: "Tap to stop recording",
      })
      // Simulate recording for 3 seconds
      setTimeout(() => {
        setIsRecording(false)
        if (activeContact) {
          const voiceMessage: Message = {
            id: Date.now().toString(),
            content: "",
            time: formatTime(Date.now()),
            timestamp: Date.now(),
            sender: "me",
            status: "sent",
            contactId: activeContact.id,
            reactions: [],
            attachments: [
              {
                type: "voice",
                name: "Voice message",
                duration: "0:03",
              },
            ],
          }
          setMessages((prev) => [...prev, voiceMessage])
          updateContactLastMessage(activeContact.id, "🎤 Voice message")
        }
      }, 3000)
    }
  }

  const handleStartCall = (type: "voice" | "video") => {
    setCallType(type)
    setCallOpen(true)
    setIsIncomingCall(false)
  }

  // Simulate incoming calls
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.02 && !callOpen) {
        // 2% chance every 5 seconds
        setCallType(Math.random() > 0.5 ? "video" : "voice")
        setIsIncomingCall(true)
        setCallOpen(true)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [callOpen])

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold">Chats</h1>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Camera className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>New group</DropdownMenuItem>
                  <DropdownMenuItem>New contact</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or start new chat"
              className="pl-10 rounded-full bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No chats found</div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 ${
                  activeContact?.id === contact.id ? "bg-muted border-l-primary" : "border-l-transparent"
                }`}
                onClick={() => handleContactClick(contact)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                      <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {contact.status === "online" && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{contact.name}</p>
                        {contact.pinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{contact.time}</span>
                        {contact.unread > 0 && (
                          <Badge variant="default" className="h-5 w-5 p-0 text-xs rounded-full">
                            {contact.unread}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.typing ? <span className="text-primary">typing...</span> : contact.lastMessage}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePinContact(contact.id)}>
                        <Pin className="h-4 w-4 mr-2" />
                        {contact.pinned ? "Unpin" : "Pin"} chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchiveContact(contact.id)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive chat
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-background">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activeContact.avatar || "/placeholder.svg"} alt={activeContact.name} />
                    <AvatarFallback>{activeContact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {activeContact.status === "online" && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{activeContact.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeContact.typing ? "typing..." : activeContact.lastSeen}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleStartCall("video")}>
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleStartCall("voice")}>
                  <Phone className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Contact info</DropdownMenuItem>
                    <DropdownMenuItem>Select messages</DropdownMenuItem>
                    <DropdownMenuItem>Mute notifications</DropdownMenuItem>
                    <DropdownMenuItem>Clear messages</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Block contact</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4 bg-muted/20">
              {currentMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                currentMessages.map((message, index) => {
                  const isConsecutive =
                    index > 0 &&
                    currentMessages[index - 1].sender === message.sender &&
                    message.timestamp - currentMessages[index - 1].timestamp < 60000

                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] ${message.sender === "me" ? "order-2" : "order-1"}`}>
                        {message.replyTo && (
                          <div className="mb-1">
                            <div
                              className={`text-xs p-2 rounded border-l-4 ${
                                message.sender === "me"
                                  ? "bg-primary/10 border-l-primary"
                                  : "bg-muted border-l-muted-foreground"
                              }`}
                            >
                              <p className="font-medium">
                                {currentMessages.find((m) => m.id === message.replyTo)?.sender === "me"
                                  ? "You"
                                  : activeContact.name}
                              </p>
                              <p className="truncate">
                                {currentMessages.find((m) => m.id === message.replyTo)?.content}
                              </p>
                            </div>
                          </div>
                        )}

                        <div
                          className={`group relative rounded-lg p-3 ${
                            message.sender === "me" ? "bg-primary text-primary-foreground" : "bg-background border"
                          } ${!isConsecutive ? "mt-2" : ""}`}
                          onDoubleClick={() => setSelectedMessage(message.id)}
                        >
                          {message.forwarded && (
                            <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                              <Forward className="h-3 w-3" />
                              Forwarded
                            </div>
                          )}

                          {message.content && <p className="text-sm">{message.content}</p>}

                          {message.attachments && message.attachments.length > 0 && (
                            <div className={`${message.content ? "mt-2" : ""} space-y-2`}>
                              {message.attachments.map((attachment, i) => (
                                <div key={i} className="rounded overflow-hidden">
                                  {attachment.type === "image" && attachment.url && (
                                    <img
                                      src={attachment.url || "/placeholder.svg"}
                                      alt={attachment.name}
                                      className="max-w-full h-auto rounded"
                                    />
                                  )}
                                  {attachment.type === "voice" && (
                                    <div className="flex items-center gap-2 p-2 bg-background/10 rounded">
                                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                                        <VolumeX className="h-4 w-4" />
                                      </Button>
                                      <div className="flex-1 h-1 bg-background/20 rounded">
                                        <div className="h-full w-1/3 bg-current rounded" />
                                      </div>
                                      <span className="text-xs">{attachment.duration}</span>
                                    </div>
                                  )}
                                  {attachment.type === "document" && (
                                    <div className="flex items-center gap-2 p-2 bg-background/10 rounded">
                                      <FileText className="h-5 w-5" />
                                      <div className="flex-1">
                                        <p className="text-xs font-medium">{attachment.name}</p>
                                        <p className="text-xs opacity-70">{attachment.size}</p>
                                      </div>
                                      <Button size="icon" variant="ghost" className="h-6 w-6">
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div
                            className={`flex items-center justify-between mt-1 ${
                              message.sender === "me" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="text-xs opacity-70">{message.time}</span>
                            {message.sender === "me" && (
                              <div className="ml-2">
                                <MessageStatus status={message.status} />
                              </div>
                            )}
                          </div>

                          {message.reactions.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {message.reactions.map((reaction, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1 bg-background/20 rounded-full px-2 py-1 text-xs"
                                >
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.users.length}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Message Actions */}
                          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                                  <Reply className="h-4 w-4 mr-2" />
                                  Reply
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Forward className="h-4 w-4 mr-2" />
                                  Forward
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Quick Reactions */}
                          <div className="absolute -bottom-2 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1 bg-background border rounded-full p-1 shadow-lg">
                              {emojis.map((emoji) => (
                                <Button
                                  key={emoji}
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-xs"
                                  onClick={() => handleReaction(message.id, emoji)}
                                >
                                  {emoji}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="p-3 bg-muted/50 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-8 bg-primary rounded" />
                  <div>
                    <p className="text-xs font-medium">
                      Replying to {replyingTo.sender === "me" ? "yourself" : activeContact.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{replyingTo.content}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-end gap-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full" asChild>
                    <label htmlFor="file-attachment">
                      <Paperclip className="h-5 w-5" />
                    </label>
                  </Button>
                  <Input
                    id="file-attachment"
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files
                      if (files) {
                        setSelectedFiles(Array.from(files))
                        setAttachmentDialogOpen(true)
                      }
                    }}
                  />
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Camera className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setP2pTransferOpen(true)}
                    disabled={!activeContact}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message"
                    className="rounded-full pr-12"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>

                {newMessage.trim() ? (
                  <Button size="icon" className="rounded-full" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant={isRecording ? "destructive" : "default"}
                    className="rounded-full"
                    onClick={handleVoiceRecord}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-20 right-4 bg-background border rounded-lg p-3 shadow-lg">
                  <div className="grid grid-cols-8 gap-2">
                    {[
                      "😀",
                      "😃",
                      "😄",
                      "😁",
                      "😆",
                      "😅",
                      "😂",
                      "🤣",
                      "😊",
                      "😇",
                      "🙂",
                      "🙃",
                      "😉",
                      "😌",
                      "😍",
                      "🥰",
                      "😘",
                      "😗",
                      "😙",
                      "😚",
                      "😋",
                      "😛",
                      "😝",
                      "😜",
                      "🤪",
                      "🤨",
                      "🧐",
                      "🤓",
                      "😎",
                      "🤩",
                      "🥳",
                      "😏",
                    ].map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setNewMessage((prev) => prev + emoji)
                          setShowEmojiPicker(false)
                        }}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-8 bg-muted rounded-full flex items-center justify-center">
                <MessageSquare className="h-24 w-24 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">WhatsApp Web</h2>
              <p className="text-muted-foreground max-w-md">
                Send and receive messages without keeping your phone online. Use WhatsApp on up to 4 linked devices and
                1 phone at the same time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Attachment Dialog */}
      <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Files</DialogTitle>
            <DialogDescription>
              {selectedFiles.length} file(s) selected to send to {activeContact?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAttachmentDialogOpen(false)
                handleSendMessage()
              }}
            >
              Send Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voice/Video Call Component */}
      <VoiceVideoCall
        isOpen={callOpen}
        onClose={() => setCallOpen(false)}
        contact={activeContact || contacts[0]}
        callType={callType}
        isIncoming={isIncomingCall}
      />

      {/* P2P File Transfer */}
      {activeContact && (
        <P2PFileTransfer
          isOpen={p2pTransferOpen}
          onClose={() => setP2pTransferOpen(false)}
          contactId={activeContact.id}
          contactName={activeContact.name}
        />
      )}
    </div>
  )
}
