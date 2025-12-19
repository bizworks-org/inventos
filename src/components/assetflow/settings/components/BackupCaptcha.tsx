"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface BackupCaptchaProps {
  open: boolean;
  onVerified: (verified: boolean) => void;
  onClose: () => void;
  backupName?: string;
}

export function BackupCaptcha({
  open,
  onVerified,
  onClose,
  backupName = "backup",
}: Readonly<BackupCaptchaProps>) {
  const [captchaCode, setCaptchaCode] = useState("");
  const [userInput, setUserInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");

  // Generate simple math CAPTCHA
  useEffect(() => {
    if (open) {
      generateCaptcha();
      setUserInput("");
      setError("");
      setAttempts(0);
    }
  }, [open]);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 50) + 1;
    const num2 = Math.floor(Math.random() * 50) + 1;
    setCaptchaCode(`${num1}+${num2}`);
  };

  const handleVerify = () => {
    try {
      const [num1Str, num2Str] = captchaCode.split("+");
      const num1 = parseInt(num1Str, 10);
      const num2 = parseInt(num2Str, 10);
      const expected = num1 + num2;
      const actual = parseInt(userInput, 10);

      if (isNaN(actual) || actual !== expected) {
        setError("Incorrect answer. Please try again.");
        setAttempts((a) => a + 1);

        if (attempts >= 2) {
          setError("Too many failed attempts. Please close and try again.");
          return;
        }

        generateCaptcha();
        setUserInput("");
        return;
      }

      onVerified(true);
      onClose();
    } catch (e) {
      setError("Invalid input. Please enter a number.");
    }
  };

  const handleClose = () => {
    onVerified(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Restore Backup - Security Verification</DialogTitle>
          <DialogDescription>
            Complete the CAPTCHA verification to proceed with restoring{" "}
            <strong>{backupName}</strong>. This is a security measure to prevent
            accidental or unauthorized restores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Solve the math problem:
            </label>
            <div className="flex items-center gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {captchaCode} = ?
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="captcha-input" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Your answer:
            </label>
            <Input
              id="captcha-input"
              type="number"
              placeholder="Enter the answer"
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              autoFocus
              disabled={attempts >= 3}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {attempts > 0 && attempts < 3 && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Attempts remaining: {3 - attempts}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-200 dark:border-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={!userInput.trim() || attempts >= 3}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
