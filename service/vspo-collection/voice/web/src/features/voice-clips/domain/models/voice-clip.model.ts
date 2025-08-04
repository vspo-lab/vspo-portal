export interface VoiceClip {
  id: number;
  title: string;
  memberId: string;
  categories: string[];
  views: number;
  likes: number;
  duration: string;
  audioUrl: string; // 音声ファイルのURL
  sourceUrl: string;
  clipUrl: string | null;
  timestamp: string;
  uploaderComment: string;
  uploadedAt: Date;
  tags: string[];
}

export interface Member {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface ClipRequest {
  title: string;
  sourceUrl: string;
  clipUrl?: string;
  xUrl?: string;
  comment?: string;
}

export interface SearchResult {
  exact: VoiceClip[];
  related: VoiceClip[];
  recommended: VoiceClip[];
}
