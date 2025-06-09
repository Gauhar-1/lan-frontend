export class FileEncryption {
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    )
  }

  private static async exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return await crypto.subtle.exportKey("raw", key)
  }

  private static async importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    )
  }

  static async encryptFile(
    file: File,
    password?: string,
  ): Promise<{
    encryptedData: ArrayBuffer
    key: ArrayBuffer
    iv: ArrayBuffer
  }> {
    const key = await this.generateKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const fileData = await file.arrayBuffer()

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      fileData,
    )

    const exportedKey = await this.exportKey(key)

    return {
      encryptedData,
      key: exportedKey,
      iv: iv.buffer,
    }
  }

  static async decryptFile(
    encryptedData: ArrayBuffer,
    keyData: ArrayBuffer,
    iv: ArrayBuffer,
    fileName: string,
    fileType: string,
  ): Promise<File> {
    const key = await this.importKey(keyData)

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData,
    )

    return new File([decryptedData], fileName, { type: fileType })
  }

  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    )
  }

  static async encryptKey(key: ArrayBuffer, publicKey: CryptoKey): Promise<ArrayBuffer> {
    return await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      key,
    )
  }

  static async decryptKey(encryptedKey: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer> {
    return await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedKey,
    )
  }
}
