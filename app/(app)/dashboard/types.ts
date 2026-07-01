export type MemoryAttachment = {
  storage_path: string;
  signedUrl: string;
  mime_type: string;
  caption: string | null;
};

export type MemoryItem = {
  id: string;
  title: string | null;
  text_content: string | null;
  /** Improved-or-raw transcript for audio memories (preview on the card). */
  transcript: string | null;
  audio_path: string | null;
  audioUrl: string | null;
  audio_duration_seconds: number | null;
  status: string;
  is_favorite: boolean;
  created_at: string;
  memory_date: string | null;
  question: string | null;
  authorId: string | null;
  authorName: string | null;
  /** Author (senior) gender for the {masc|fem} tokens in `question`. */
  authorGender: "male" | "female" | null;
  attachments: MemoryAttachment[];
};

export type SeniorOption = { id: string; displayName: string };
