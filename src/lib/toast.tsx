"use client";

import type { ReactNode } from "react";
import { toast as toastify } from "react-toastify";

function content(title: string, message?: string): ReactNode {
  if (!message) return title;
  return (
    <div className="text-left">
      <div className="font-medium">{title}</div>
      <div className="mt-0.5 text-xs opacity-90">{message}</div>
    </div>
  );
}

export function notifySuccess(title: string, message?: string) {
  toastify.success(content(title, message));
}

export function notifyError(title: string, message?: string) {
  toastify.error(content(title, message));
}

export function notifyInfo(title: string, message?: string) {
  toastify.info(content(title, message));
}
