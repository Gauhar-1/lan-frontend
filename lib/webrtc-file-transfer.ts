interface FileTransferOffer {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  chunks: number
  checksum: string
}

interface FileChunk {
  id: string
  index: number
  data: ArrayBuffer
  checksum: string
}

export class WebRTCFileTransfer {
  private peerConnection: RTCPeerConnection
  private dataChannel: RTCDataChannel | null = null
  private onProgress: (progress: number) => void
  private onComplete: (file: File) => void
  private onError: (error: string) => void

  private fileBuffer: ArrayBuffer[] = []
  private expectedChunks = 0
  private receivedChunks = 0
  private fileMetadata: FileTransferOffer | null = null

  constructor(
    onProgress: (progress: number) => void,
    onComplete: (file: File) => void,
    onError: (error: string) => void,
  ) {
    this.onProgress = onProgress
    this.onComplete = onComplete
    this.onError = onError

    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    })

    this.setupPeerConnection()
  }

  private setupPeerConnection() {
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel
      this.setupDataChannel(channel)
    }

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer via signaling server
        this.sendSignalingMessage({
          type: "ice-candidate",
          candidate: event.candidate,
        })
      }
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel
    channel.binaryType = "arraybuffer"

    channel.onopen = () => {
      console.log("Data channel opened")
    }

    channel.onmessage = (event) => {
      this.handleDataChannelMessage(event.data)
    }

    channel.onerror = (error) => {
      this.onError("Data channel error: " + error)
    }
  }

  private handleDataChannelMessage(data: any) {
    try {
      if (typeof data === "string") {
        const message = JSON.parse(data)

        if (message.type === "file-offer") {
          this.handleFileOffer(message.offer)
        } else if (message.type === "file-accept") {
          this.startFileTransfer()
        } else if (message.type === "file-reject") {
          this.onError("File transfer rejected by recipient")
        }
      } else if (data instanceof ArrayBuffer) {
        this.handleFileChunk(data)
      }
    } catch (error) {
      this.onError("Error handling message: " + error)
    }
  }

  private handleFileOffer(offer: FileTransferOffer) {
    this.fileMetadata = offer
    this.expectedChunks = offer.chunks
    this.fileBuffer = new Array(offer.chunks)

    // Auto-accept for demo (in real app, show user confirmation)
    this.sendDataChannelMessage({
      type: "file-accept",
      offerId: offer.id,
    })
  }

  private handleFileChunk(data: ArrayBuffer) {
    if (!this.fileMetadata) return

    // Extract chunk metadata (first 16 bytes contain chunk index)
    const metadataView = new DataView(data, 0, 16)
    const chunkIndex = metadataView.getUint32(0)
    const chunkData = data.slice(16)

    this.fileBuffer[chunkIndex] = chunkData
    this.receivedChunks++

    const progress = (this.receivedChunks / this.expectedChunks) * 100
    this.onProgress(progress)

    if (this.receivedChunks === this.expectedChunks) {
      this.assembleFile()
    }
  }

  private assembleFile() {
    if (!this.fileMetadata) return

    // Combine all chunks
    const totalSize = this.fileBuffer.reduce((sum, chunk) => sum + chunk.byteLength, 0)
    const completeFile = new Uint8Array(totalSize)

    let offset = 0
    for (const chunk of this.fileBuffer) {
      completeFile.set(new Uint8Array(chunk), offset)
      offset += chunk.byteLength
    }

    // Create file object
    const file = new File([completeFile], this.fileMetadata.fileName, {
      type: this.fileMetadata.fileType,
    })

    this.onComplete(file)
  }

  async sendFile(file: File) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      this.onError("Data channel not ready")
      return
    }

    const chunkSize = 16384 // 16KB chunks
    const chunks = Math.ceil(file.size / chunkSize)

    const offer: FileTransferOffer = {
      id: Date.now().toString(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      chunks: chunks,
      checksum: await this.calculateChecksum(file),
    }

    // Send file offer
    this.sendDataChannelMessage({
      type: "file-offer",
      offer: offer,
    })
  }

  private async startFileTransfer() {
    // Implementation would continue here with actual file sending
    // This is a simplified version for demonstration
  }

  private sendDataChannelMessage(message: any) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify(message))
    }
  }

  private sendSignalingMessage(message: any) {
    // In a real implementation, this would send via WebSocket to signaling server
    console.log("Signaling message:", message)
  }

  private async calculateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    this.dataChannel = this.peerConnection.createDataChannel("fileTransfer", {
      ordered: true,
    })
    this.setupDataChannel(this.dataChannel)

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.peerConnection.setRemoteDescription(offer)
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(answer)
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    await this.peerConnection.addIceCandidate(candidate)
  }

  close() {
    if (this.dataChannel) {
      this.dataChannel.close()
    }
    this.peerConnection.close()
  }
}
