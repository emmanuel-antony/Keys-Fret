export interface TranslatedChord {
  time: number;
  raw_chord: string;
  easy_chord: string;
  guitar_tab: string;
  piano_keys: string;
}

export interface LeadNote {
  time: number;
  note: string;
}

export interface MusicIRResponse {
  status: string;
  message: string;
  dominant_key: string;
  audio_url: string;
  chords: TranslatedChord[];
  lead_notes: LeadNote[];
  tempo?: number;
}
