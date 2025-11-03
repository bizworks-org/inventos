"use client";

import React from 'react';
import { Button } from '../../ui/button';

interface Props {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  pwdCurrent: string;
  setPwdCurrent: (v: string) => void;
  pwdNew: string;
  setPwdNew: (v: string) => void;
  pwdNew2: string;
  setPwdNew2: (v: string) => void;
  profileMsg: string | null;
  saveProfile: () => Promise<void> | void;
}

export default function ProfileTab({ name, setName, email, setEmail, pwdCurrent, setPwdCurrent, pwdNew, setPwdNew, pwdNew2, setPwdNew2, profileMsg, saveProfile }: Props) {
  return (
    <>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-[#1a1d2e] mb-3">Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Full Name</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Email</label>
              <input
                type="email"
                disabled
                className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)] text-[#6b7280]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-[#94a3b8] mt-1">Email is managed by an administrator.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#1a1d2e] mb-3">Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Current Password</label>
              <input type="password" className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" value={pwdCurrent} onChange={(e) => setPwdCurrent(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1d2e] mb-2">New Password</label>
              <input type="password" className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1d2e] mb-2">Confirm New Password</label>
              <input type="password" className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]" value={pwdNew2} onChange={(e) => setPwdNew2(e.target.value)} />
            </div>
          </div>
        </div>

        {profileMsg && (
          <p className={`text-sm ${profileMsg.startsWith('OK') ? 'text-green-600' : 'text-red-600'}`}>{profileMsg}</p>
        )}

        <div className="flex justify-end">
          <Button type="button" onClick={saveProfile} className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30">Save Profile</Button>
        </div>
      </div>
    </>
  );
}
