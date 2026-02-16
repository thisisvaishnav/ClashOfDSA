const getApiBase = () =>
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    : "";

export type PracticeSubmissionPayload = {
  id: string;
  questionId: number;
  code: string;
  language: string;
  status: string;
  runtimeMs: number | null;
  memoryMb: number | null;
  createdAt: string;
};

export async function fetchPracticeSubmissions(
  questionId: number,
): Promise<PracticeSubmissionPayload[]> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/api/submissions/practice?questionId=${questionId}`,
    { credentials: "include" },
  );
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error(await res.text());
  }
  const json = await res.json();
  return json.data ?? [];
}

export async function createPracticeSubmission(body: {
  questionId: number;
  code: string;
  language: string;
  status?: string;
  runtimeMs?: number;
  memoryMb?: number;
}): Promise<PracticeSubmissionPayload> {
  const base = getApiBase();
  const res = await fetch(`${base}/api/submissions/practice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      questionId: body.questionId,
      code: body.code,
      language: body.language,
      status: body.status ?? "Accepted",
      runtimeMs: body.runtimeMs,
      memoryMb: body.memoryMb,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to save submission");
  }
  const json = await res.json();
  return json.data;
}
