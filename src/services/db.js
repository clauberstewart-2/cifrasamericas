import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject
} from 'firebase/storage';
import { db, storage } from './firebase';

// ── MÚSICAS ──────────────────────────────────────────────

export async function getSongs(userId) {
  const q = query(
    collection(db, 'songs'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addSong(userId, songData) {
  return await addDoc(collection(db, 'songs'), {
    ...songData,
    userId,
    createdAt: serverTimestamp(),
  });
}

export async function updateSong(songId, data) {
  await updateDoc(doc(db, 'songs', songId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSong(songId) {
  await deleteDoc(doc(db, 'songs', songId));
}

// ── UPLOAD DE PDF ────────────────────────────────────────

export function uploadPDF(userId, file, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `pdfs/${userId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      reject,
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ downloadURL, storagePath: uploadTask.snapshot.ref.fullPath });
      }
    );
  });
}

export async function deletePDF(storagePath) {
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (e) {
    console.warn('Erro ao deletar PDF:', e);
  }
}

// ── PLAYLISTS ─────────────────────────────────────────────

export async function getPlaylists(userId) {
  const q = query(
    collection(db, 'playlists'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPlaylist(userId, data) {
  return await addDoc(collection(db, 'playlists'), {
    ...data,
    userId,
    songs: [],
    createdAt: serverTimestamp(),
  });
}

export async function updatePlaylist(playlistId, data) {
  await updateDoc(doc(db, 'playlists', playlistId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlaylist(playlistId) {
  await deleteDoc(doc(db, 'playlists', playlistId));
}
