export interface Station {
  id: string;
  name: string;
  lines: string[];
  lat: number;
  lng: number;
}

export interface SearchResult {
  station: Station;
  avgMinutes: number;
  individualMinutes: number[];
  personNames?: string[];
}

export interface Place {
  name: string;
  vicinity: string;
  rating?: number;
  types: string[];
  photoRef?: string;
}
