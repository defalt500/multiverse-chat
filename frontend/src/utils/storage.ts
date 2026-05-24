// src/utils/storage.ts
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { getFirebaseStorage } from '../config/firebase'

/**
 * Upload a file to Firebase Storage and return the public download URL.
 * @param file The file to upload
 * @param path The storage path (e.g., 'avatars/uid.png')
 * @param onProgress Optional callback for upload progress (0-100)
 */
export async function uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    const storage = getFirebaseStorage()
    const storageRef = ref(storage, path)

    const uploadTask = uploadBytesResumable(storageRef, file)

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                if (onProgress) onProgress(progress)
            },
            (error) => {
                console.error('Storage upload error:', error)
                reject(new Error('Falló la subida del archivo. Por favor verifica los permisos de Firebase Storage.'))
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                    resolve(downloadURL)
                } catch (err) {
                    reject(new Error('Falló al obtener la URL de descarga.'))
                }
            }
        )
    })
}

/**
 * Validate if a file is an allowed image type and within size limits.
 * @param file The file to validate
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Solo se permiten imágenes (JPG, PNG, WEBP).' }
    }

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
        return { valid: false, error: 'La imagen es demasiado grande (máximo 2MB).' }
    }

    return { valid: true }
}
