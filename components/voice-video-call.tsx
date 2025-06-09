"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react"

interface CallProps {
  isOpen: boolean
  onClose: () => void
  contact: {
    id: string
    name: string
    avatar: string
  }
  callType: "voice" | "video"
  isIncoming?: boolean
}

export function VoiceVideoCall({ isOpen, onClose, contact, callType, isIncoming = false }: CallProps) {
  const [callStatus, setCallStatus] = useState<"ringing" | "connecting" | "connected" | "ended">(
    isIncoming ? "ringing" : "connecting",
  )
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const { toast } = useToast()

  // Simulate call progression
  useEffect(() => {
    if (!isOpen) return

    let timer: NodeJS.Timeout

    if (callStatus === "connecting") {
      timer = setTimeout(() => {
        setCallStatus("connected")
        toast({
          title: "Call connected",
          description: `${callType === "video" ? "Video" : "Voice"} call with ${contact.name} started`,
        })
      }, 2000)
    } else if (callStatus === "ringing" && isIncoming) {
      // Auto-answer after 5 seconds for demo
      timer = setTimeout(() => {
        setCallStatus("connected")
        toast({
          title: "Call answered",
          description: `${callType === "video" ? "Video" : "Voice"} call with ${contact.name}`,
        })
      }, 5000)
    }

    return () => clearTimeout(timer)
  }, [callStatus, isOpen, callType, contact.name, isIncoming, toast])

  // Call duration timer
  useEffect(() => {
    if (callStatus !== "connected") return

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [callStatus])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleEndCall = () => {
    setCallStatus("ended")
    toast({
      title: "Call ended",
      description: `Call duration: ${formatDuration(duration)}`,
    })
    setTimeout(() => {
      onClose()
      setDuration(0)
      setCallStatus("ringing")
    }, 1000)
  }

  const handleAnswerCall = () => {
    setCallStatus("connected")
    toast({
      title: "Call answered",
      description: `${callType === "video" ? "Video" : "Voice"} call with ${contact.name}`,
    })
  }

  const handleDeclineCall = () => {
    setCallStatus("ended")
    toast({
      title: "Call declined",
      description: "Call was declined",
    })
    setTimeout(() => {
      onClose()
      setCallStatus("ringing")
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isMinimized ? "w-80 h-48" : callType === "video" ? "w-[800px] h-[600px]" : "w-96 h-[500px]"
        } p-0 overflow-hidden transition-all duration-300`}
      >
        <div className="relative w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
          {/* Video Call Layout */}
          {callType === "video" && !isMinimized && (
            <div className="relative w-full h-full">
              {/* Remote Video (Simulated) */}
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                {callStatus === "connected" && !isVideoOff ? (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Avatar className="w-32 h-32 mx-auto mb-4">
                        <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                        <AvatarFallback className="text-4xl">{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="text-lg opacity-75">Video simulation</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                      <AvatarFallback className="text-4xl">{contact.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-semibold">{contact.name}</h3>
                    <p className="text-sm opacity-75">
                      {callStatus === "ringing"
                        ? isIncoming
                          ? "Incoming video call..."
                          : "Ringing..."
                        : callStatus === "connecting"
                          ? "Connecting..."
                          : callStatus === "connected"
                            ? "Video is off"
                            : "Call ended"}
                    </p>
                  </div>
                )}
              </div>

              {/* Local Video (Picture-in-Picture) */}
              {callStatus === "connected" && (
                <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs">You</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Voice Call Layout */}
          {(callType === "voice" || isMinimized) && (
            <div className="flex flex-col items-center justify-center h-full text-white p-8">
              <Avatar className={`${isMinimized ? "w-16 h-16" : "w-32 h-32"} mb-4`}>
                <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                <AvatarFallback className={`${isMinimized ? "text-lg" : "text-4xl"}`}>
                  {contact.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className={`${isMinimized ? "text-lg" : "text-2xl"} font-semibold mb-2`}>{contact.name}</h3>
              <p className={`${isMinimized ? "text-xs" : "text-sm"} opacity-75 mb-4`}>
                {callStatus === "ringing"
                  ? isIncoming
                    ? `Incoming ${callType} call...`
                    : "Ringing..."
                  : callStatus === "connecting"
                    ? "Connecting..."
                    : callStatus === "connected"
                      ? formatDuration(duration)
                      : "Call ended"}
              </p>

              {/* Call Status Indicator */}
              {callStatus === "connected" && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs">Connected</span>
                </div>
              )}
            </div>
          )}

          {/* Call Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center justify-center gap-4">
              {/* Incoming Call Controls */}
              {callStatus === "ringing" && isIncoming && (
                <>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="w-14 h-14 rounded-full"
                    onClick={handleDeclineCall}
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                  <Button
                    size="icon"
                    className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600"
                    onClick={handleAnswerCall}
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Active Call Controls */}
              {(callStatus === "connected" || (callStatus === "ringing" && !isIncoming)) && (
                <>
                  {/* Mute */}
                  <Button
                    size="icon"
                    variant={isMuted ? "destructive" : "secondary"}
                    className="w-12 h-12 rounded-full"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>

                  {/* Video Toggle (Video calls only) */}
                  {callType === "video" && (
                    <Button
                      size="icon"
                      variant={isVideoOff ? "destructive" : "secondary"}
                      className="w-12 h-12 rounded-full"
                      onClick={() => setIsVideoOff(!isVideoOff)}
                    >
                      {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>
                  )}

                  {/* Speaker (Voice calls only) */}
                  {callType === "voice" && (
                    <Button
                      size="icon"
                      variant={isSpeakerOn ? "default" : "secondary"}
                      className="w-12 h-12 rounded-full"
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    >
                      {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>
                  )}

                  {/* Minimize/Maximize */}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-12 h-12 rounded-full"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    {isMinimized ? <Maximize className="h-5 w-5" /> : <Minimize className="h-5 w-5" />}
                  </Button>

                  {/* More Options */}
                  <Button size="icon" variant="secondary" className="w-12 h-12 rounded-full">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>

                  {/* End Call */}
                  <Button size="icon" variant="destructive" className="w-14 h-14 rounded-full" onClick={handleEndCall}>
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>

            {/* Additional Controls for Video Calls */}
            {callType === "video" && callStatus === "connected" && !isMinimized && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button size="sm" variant="secondary" className="rounded-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>
            )}
          </div>

          {/* Minimize/Close Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            {callStatus === "connected" && (
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
