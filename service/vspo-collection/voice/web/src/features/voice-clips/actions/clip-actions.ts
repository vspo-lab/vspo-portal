"use server";

import type { ClipRequest } from "../domain/models/voice-clip.model";

export async function likeClipAction(clipId: number, userId?: string) {
  // In production, this would update the database
  console.log("Liking clip:", clipId, "for user:", userId);

  // Simulate success
  return { success: true };
}

export async function favoriteClipAction(clipId: number, userId?: string) {
  // In production, this would update the database
  console.log("Favoriting clip:", clipId, "for user:", userId);

  // Simulate success
  return { success: true };
}

export async function submitClipRequestAction(request: ClipRequest) {
  // In production, this would save to database and notify moderators
  console.log("Submitting clip request:", request);

  // Validate request
  if (!request.title || !request.sourceUrl) {
    return {
      success: false,
      error: "タイトルと元配信URLは必須です",
    };
  }

  // Simulate saving to database
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    message: "リクエストを受け付けました。確認後、サイトに追加されます。",
  };
}

export async function incrementViewCountAction(clipId: number) {
  // In production, this would update the database
  console.log("Incrementing view count for clip:", clipId);

  // Simulate success
  return { success: true };
}
