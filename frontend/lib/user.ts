import type { User } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

export async function getUserById(id: string | number): Promise<{ success: true; user: User }> {
  const res = await fetch(`${API_BASE_URL}/user/${id}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to fetch user");
  }

  return data;
}

export async function uploadAvatar(
  id: string | number,
  file: File
): Promise<{ success: true; user: User }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_BASE_URL}/user/${id}/avatar`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to upload avatar");
  }

  return data;
}