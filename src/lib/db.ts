import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Song } from "../types";

const songsCol = collection(db, "songs");

/** Live list of all songs (newest first). `null` while the first snapshot loads. */
export function useSongs(): Song[] | null {
  const [songs, setSongs] = useState<Song[] | null>(null);
  useEffect(() => {
    const q = query(songsCol, orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snap) => {
      setSongs(snap.docs.map((d) => d.data() as Song));
    });
  }, []);
  return songs;
}

/** Live single song. `undefined` = loading, `null` = not found. */
export function useSong(id: string): Song | null | undefined {
  const [song, setSong] = useState<Song | null | undefined>(undefined);
  useEffect(() => {
    setSong(undefined);
    return onSnapshot(doc(songsCol, id), (snap) => {
      setSong(snap.exists() ? (snap.data() as Song) : null);
    });
  }, [id]);
  return song;
}

export async function saveSong(song: Song): Promise<void> {
  await setDoc(doc(songsCol, song.id), { ...song, updatedAt: Date.now() });
}

export async function deleteSong(id: string): Promise<void> {
  await deleteDoc(doc(songsCol, id));
}
