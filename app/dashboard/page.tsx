"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VoiceVideoCall } from "@/components/voice-video-call"
import { ArrowUpRight, FileText, MessageSquare, MoreHorizontal, Upload, Phone, Video } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [callOpen, setCallOpen] = useState(false)
  const [callType, setCallType] = useState<"voice" | "video">("voice")

  const handleStartCall = (type: "voice" | "video") => {
    setCallType(type)
    setCallOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">+22% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 GB</div>
            <div className="mt-2">
              <Progress value={40} className="h-2" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">40% of 6 GB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Available for calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">12 new since yesterday</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
            <CardDescription>Files that were recently uploaded or modified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Q2 Financial Report.pdf", type: "PDF", size: "4.2 MB", date: "Today" },
                { name: "Project Proposal.docx", type: "DOCX", size: "1.8 MB", date: "Yesterday" },
                { name: "Marketing Strategy.pptx", type: "PPTX", size: "6.3 MB", date: "2 days ago" },
                { name: "Team Photo.jpg", type: "JPG", size: "3.1 MB", date: "3 days ago" },
              ].map((file, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size} • {file.date}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Link href="/dashboard/files">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all files
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/files">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
              </Link>
              <Link href="/dashboard/messages">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="h-4 w-4" />
                  New Message
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => handleStartCall("voice")}>
                <Phone className="h-4 w-4" />
                Voice Call
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => handleStartCall("video")}>
                <Video className="h-4 w-4" />
                Video Call
              </Button>
            </div>

            <div className="mt-6">
              <Tabs defaultValue="storage">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="storage">Storage</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="storage" className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Documents</span>
                        <span>1.2 GB</span>
                      </div>
                      <Progress value={50} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Images</span>
                        <span>0.8 GB</span>
                      </div>
                      <Progress value={33} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Videos</span>
                        <span>0.4 GB</span>
                      </div>
                      <Progress value={17} className="h-2" />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="activity" className="pt-4">
                  <div className="space-y-4">
                    {[
                      { user: "You", action: "started a video call with", item: "Sarah Johnson", time: "2 hours ago" },
                      { user: "Mike", action: "shared", item: "Marketing Strategy.pptx", time: "4 hours ago" },
                      { user: "Emily", action: "joined voice call", item: "Team Meeting", time: "Yesterday" },
                    ].map((activity, i) => (
                      <div key={i} className="text-sm">
                        <p>
                          <span className="font-medium">{activity.user}</span>{" "}
                          <span className="text-muted-foreground">{activity.action}</span>{" "}
                          <span className="font-medium">{activity.item}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voice/Video Call Component */}
      <VoiceVideoCall
        isOpen={callOpen}
        onClose={() => setCallOpen(false)}
        contact={{
          id: "1",
          name: "Sarah Johnson",
          avatar: "/placeholder.svg?height=40&width=40",
        }}
        callType={callType}
      />
    </div>
  )
}
