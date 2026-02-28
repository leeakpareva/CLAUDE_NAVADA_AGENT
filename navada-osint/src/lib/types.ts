export interface Brief {
  id: number;
  title: string;
  content: string;
  category: "geopolitical" | "cyber" | "economic" | "military" | "general";
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  title: string;
  link: string;
  source: string;
  published_at: string;
  category: string;
  snippet?: string;
}

export interface ServiceStatus {
  name: string;
  url: string;
  status: "online" | "offline" | "unknown";
  latencyMs: number | null;
}

export interface RSSFeedConfig {
  name: string;
  url: string;
  category: string;
}

export const OSINT_FEEDS: RSSFeedConfig[] = [
  { name: "Reuters World", url: "https://feeds.reuters.com/Reuters/worldNews", category: "geopolitical" },
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "geopolitical" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "geopolitical" },
  { name: "CSIS", url: "https://www.csis.org/analysis/feed", category: "geopolitical" },
  { name: "Defense One", url: "https://www.defenseone.com/rss/", category: "military" },
  { name: "The War Zone", url: "https://www.twz.com/feed", category: "military" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", category: "cyber" },
  { name: "Schneier on Security", url: "https://www.schneier.com/feed/atom/", category: "cyber" },
];

export const MONITORED_SERVICES = [
  { name: "NAVADA Global Monitor", url: "http://localhost:4001" },
  { name: "CLAWD Dashboard", url: "http://localhost:3000" },
  { name: "Excalidraw", url: "http://localhost:3001" },
  { name: "JupyterLab", url: "http://localhost:8888" },
  { name: "MLflow", url: "http://localhost:5000" },
  { name: "TensorBoard", url: "http://localhost:6006" },
];
