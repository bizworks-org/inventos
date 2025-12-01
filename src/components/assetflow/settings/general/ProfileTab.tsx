"use client";

import React from "react";
// Save now happens via global Save button in header

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

export default function ProfileTab({
  name,
  setName,
  email,
  setEmail,
  pwdCurrent,
  setPwdCurrent,
  pwdNew,
  setPwdNew,
  pwdNew2,
  setPwdNew2,
  profileMsg,
  saveProfile,
}: Props) {
  return (
    <>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Full Name
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Email
              </label>
              <input
                type="email"
                disabled
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[#6b7280]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email is managed by an administrator.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Change Password
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Current Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                New Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                value={pwdNew2}
                onChange={(e) => setPwdNew2(e.target.value)}
              />
            </div>
          </div>
        </div>

        {profileMsg && (
          <p
            className={`text-sm ${
              profileMsg.startsWith("OK") ? "text-green-600" : "text-red-600"
            }`}
          >
            {profileMsg}
          </p>
        )}

        {/* Profile saved by global Save Changes button in header */}
      </div>
    </>
  );
}
