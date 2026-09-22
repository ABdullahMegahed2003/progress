"use client";
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, startTransition, useEffect, useState } from "react";
import { ImagePlus, Trophy } from "lucide-react";

type Profile = { name: string; avatar: string };

export function ProfileScreen() {
  const [profile, setProfile] = useState<Profile>({ name: "", avatar: "" });

  useEffect(() => {
    const localProfile = localStorage.getItem("gym-profile");
    if (localProfile) {
      const saved = JSON.parse(localProfile);
      startTransition(() => setProfile({ name: saved.name ?? "", avatar: saved.avatar ?? "" }));
    }

    fetch("/api/profile")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data?.profile) return;
        startTransition(() => setProfile({ name: data.profile.name ?? "", avatar: data.profile.avatar ?? "" }));
      })
      .catch(() => undefined);
  }, []);

  function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const nextProfile = { ...profile, avatar: String(reader.result) };
      setProfile(nextProfile);
      localStorage.setItem("gym-profile", JSON.stringify(nextProfile));
      fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextProfile) }).catch(() => undefined);
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="profile-only-shell">
      <section className="profile-only-card">
        <div className="profile-only-avatar-wrap">
          <div className="profile-only-avatar">{profile.avatar ? <img src={profile.avatar} alt="صورتك الشخصية" /> : <span>{profile.name.slice(0, 1) || "G"}</span>}</div>
          <label className="profile-only-upload" htmlFor="profile-avatar" title="تغيير الصورة"><ImagePlus size={16} /></label>
          <input id="profile-avatar" className="hidden-file" type="file" accept="image/*" onChange={uploadAvatar} />
        </div>
        <h1>{profile.name || "حسابك"}</h1>
        <div className="profile-only-rank"><div><Trophy size={22} /><span>ترتيبك على المنصة</span></div><strong>#24</strong></div>
      </section>
    </main>
  );
}