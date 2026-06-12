"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/types";

const provider = new GoogleAuthProvider();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setAppUser(snap.data() as AppUser);
        } else {
          // 初回ログイン時は student として登録
          const newUser: AppUser = {
            uid: u.uid,
            email: u.email ?? "",
            role: "student" as UserRole,
          };
          await setDoc(ref, newUser);
          setAppUser(newUser);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = () => signInWithPopup(auth, provider);
  const signOut = () => fbSignOut(auth);

  return { user, appUser, loading, signIn, signOut };
}
