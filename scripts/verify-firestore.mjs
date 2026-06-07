// Headless check of the Firestore data layer + security rules.
// Default: real project. Set FIRESTORE_EMULATOR=1 to use the local emulator (needs Java 21+).
import { initializeApp } from "firebase/app";
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";

const app = initializeApp({
  projectId: "notation-11b7c",
  apiKey: "AIzaSyAeEdybh8iouysg2W3E_xaEHhhKxqQYPNc",
  appId: "1:70522508536:web:c091e163767546391b570d",
  authDomain: "notation-11b7c.firebaseapp.com",
});
const db = getFirestore(app);
if (process.env.FIRESTORE_EMULATOR === "1") connectFirestoreEmulator(db, "127.0.0.1", 8080);

const valid = {
  id: "verify-1",
  title: "Verify Song",
  sections: [],
  tags: ["test"],
  tuning: { name: "Standard", strings: ["E", "A", "D", "G", "B", "E"] },
  timeSignature: { numerator: 4, denominator: 4 },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

let pass = true;

await setDoc(doc(db, "songs", valid.id), valid);
const snap = await getDoc(doc(db, "songs", valid.id));
console.log("valid write read-back:", snap.exists(), JSON.stringify(snap.data()?.title));
if (!snap.exists() || snap.data().title !== "Verify Song") pass = false;

try {
  await setDoc(doc(db, "songs", "verify-bad"), { title: 123, sections: [], tags: [], updatedAt: 1 });
  console.log("INVALID WRITE WAS ALLOWED — rules failed");
  pass = false;
  await deleteDoc(doc(db, "songs", "verify-bad")).catch(() => {});
} catch (e) {
  console.log("invalid write rejected:", e.code);
}

const all = await getDocs(collection(db, "songs"));
console.log("songs in collection:", all.size);

await deleteDoc(doc(db, "songs", valid.id)); // cleanup
console.log(pass ? "VERIFY: PASS" : "VERIFY: FAIL");
process.exit(pass ? 0 : 1);
