// lib/videoPrefetchManager.ts

import * as FileSystem from "expo-file-system";
import { File, Paths } from "expo-file-system";
import { Image } from "react-native";

export interface VideoItem {
  id: number;
  media_url?: string;
  thumbnail_url?: string;
}

// ✅ HLS and MP4 detection
const HLS_RE = /\.m3u8(\?|$)/i;
const MP4_RE = /\.mp4(\?|$)/i;
const isHls = (u?: string) => !!u && HLS_RE.test(u);
const isMp4 = (u?: string) => !!u && MP4_RE.test(u);

// ✅ Stable key generation (by ID, not scrolling index)
function stableKey(v: VideoItem): string {
  return v.id != null ? String(v.id) : (v.media_url ?? "");
}

function fileName(v: VideoItem): string {
  const key = stableKey(v);
  const ext = isMp4(v.media_url) ? ".mp4" : "";
  return `reel_${key}${ext}`;
}

// ✅ HLS warm-up: fetch manifest + first few segments
async function warmHls(m3u8Url: string, segCount = 3): Promise<void> {
  try {
    const res = await fetch(m3u8Url, { method: "GET" });
    const text = await res.text();
    const base = m3u8Url.split("?")[0].replace(/\/[^/]*$/, "/");
    const segs = [...text.matchAll(/^[^#].*\.(m4s|ts)(?:\?.*)?$/gim)]
      .map((m) => m[0].trim())
      .slice(0, segCount);
    await Promise.all(
      segs.map((s) =>
        fetch(s.startsWith("http") ? s : base + s).catch(() => {})
      )
    );
    console.log(`🔥 Warmed HLS: ${m3u8Url.substring(0, 60)}...`);
  } catch (err) {
    console.warn("HLS warm failed:", err);
  }
}

// ✅ MP4 range warm-up: fetch first 600KB to prime cache
async function warmBytes(url: string, bytes = 600_000): Promise<void> {
  try {
    await fetch(url, {
      method: "GET",
      headers: { Range: `bytes=0-${bytes - 1}` },
    });
    console.log(`🔥 Warmed MP4 (${bytes} bytes): ${url.substring(0, 60)}...`);
  } catch (err) {
    console.warn("MP4 warm failed:", err);
  }
}

export class VideoPrefetchManager {
  // ✅ Use stable keys (video ID) instead of scrolling indices
  private cachedKeys = new Set<string>(); // Fully downloaded files
  private warmedKeys = new Set<string>(); // HLS or MP4 range-warmed
  private loadedKeys = new Set<string>(); // Videos that played at least once
  private activeDownloads = new Set<string>(); // Currently downloading
  private localFileUris = new Map<string, string>(); // key -> local file path

  private readonly CACHE_WINDOW = 4; // Next 4 videos
  private readonly MAX_PARALLEL = 1; // 1 download at a time (safe)

  // ✅ Download full file for immediate next video (MP4 only)
  private async downloadFile(item: VideoItem): Promise<string | undefined> {
    const key = stableKey(item);
    const url = item.media_url;
    if (!url) return undefined;

    try {
      // Use Paths.cache (expo-file-system v54+)
      const cacheDir = Paths.cache?.uri;
      if (!cacheDir) throw new Error("No cache directory");

      const dest = `${cacheDir}${fileName(item)}`;

      // Check if file already exists
      try {
        const file = new File(dest);
        if (file.exists) {
          console.log(`📦 File already cached: ${dest}`);
          return dest;
        }
      } catch {
        // Fallback to getInfoAsync if File API fails
        const info = await FileSystem.getInfoAsync(dest);
        if (info.exists) {
          console.log(`📦 File already cached: ${dest}`);
          return dest;
        }
      }

      // Download file
      console.log(
        `📥 Downloading full file for key ${key}: ${url.substring(0, 60)}...`
      );
      const result = await FileSystem.downloadAsync(url, dest);

      // Prefetch thumbnail
      if (item.thumbnail_url) {
        Image.prefetch(item.thumbnail_url).catch(() => {});
      }

      return result.uri;
    } catch (error) {
      console.error(`❌ Download failed for key ${key}:`, error);
      throw error;
    }
  }

  // ✅ Smart prefetch: full download for next, warm-up for 2-4 ahead
  public async prefetch(
    currentIndex: number,
    videos: VideoItem[]
  ): Promise<void> {
    const total = videos.length;
    if (total === 0 || currentIndex < 0 || currentIndex >= total) return;

    // ✅ Eviction: keep only videos in window (by stable key)
    const keysToKeep = new Set<string>();
    const windowEnd = Math.min(total - 1, currentIndex + this.CACHE_WINDOW);
    for (let i = currentIndex; i <= windowEnd; i++) {
      keysToKeep.add(stableKey(videos[i]));
    }

    // Evict cached files outside window
    for (const key of this.cachedKeys) {
      if (!keysToKeep.has(key)) {
        const uri = this.localFileUris.get(key);
        if (uri) {
          try {
            const file = new File(uri);
            if (file.exists) {
              await file.delete();
              console.log(`🗑️ Evicted cached file: ${key}`);
            }
          } catch {
            // Ignore deletion errors
          }
          this.localFileUris.delete(key);
        }
        this.cachedKeys.delete(key);
      }
    }

    // Clear warmed keys outside window
    for (const key of this.warmedKeys) {
      if (!keysToKeep.has(key)) {
        this.warmedKeys.delete(key);
      }
    }

    // ✅ Prefetch order: immediate next first, then 2-4 ahead
    const order: number[] = [];
    const nextIndex = currentIndex + 1;
    if (nextIndex < total) order.push(nextIndex);
    for (let i = nextIndex + 1; i <= windowEnd; i++) {
      if (i < total) order.push(i);
    }

    for (const i of order) {
      const item = videos[i];
      const url = item?.media_url;
      if (!url) continue;

      const key = stableKey(item);

      // Skip if already cached or downloading
      if (this.cachedKeys.has(key) || this.activeDownloads.has(key)) continue;

      // ✅ HLS: warm manifest + segments, don't download
      if (isHls(url)) {
        if (!this.warmedKeys.has(key)) {
          await warmHls(url, 3);
          this.warmedKeys.add(key);
        }
        continue;
      }

      // ✅ MP4: full download for immediate next, range warm for others
      if (isMp4(url)) {
        if (i === nextIndex) {
          // Full download for immediate next
          if (this.activeDownloads.size < this.MAX_PARALLEL) {
            this.activeDownloads.add(key);
            try {
              const localUri = await this.downloadFile(item);
              if (localUri) {
                this.localFileUris.set(key, localUri);
                this.cachedKeys.add(key);
                console.log(`✅ Cached next video (key: ${key})`);
              }
            } catch (err) {
              console.error(`Failed to cache next video (key: ${key}):`, err);
            } finally {
              this.activeDownloads.delete(key);
            }
          }
        } else {
          // Range warm-up for videos 2-4 ahead
          if (!this.warmedKeys.has(key)) {
            await warmBytes(url, 600_000); // 600KB
            this.warmedKeys.add(key);
          }
        }
      }
    }
  }

  // ✅ Check if video is ready for instant playback
  public isReady(item: VideoItem): boolean {
    const key = stableKey(item);
    return (
      this.cachedKeys.has(key) ||
      this.warmedKeys.has(key) ||
      this.loadedKeys.has(key)
    );
  }

  // ✅ Mark video as loaded (played at least once)
  public markAsLoaded(item: VideoItem): void {
    this.loadedKeys.add(stableKey(item));
  }

  // ✅ Get local file URI (only for MP4, never for HLS)
  public getLocalUri(item: VideoItem): string | undefined {
    const url = item.media_url;
    if (isHls(url)) return undefined; // Never return local path for HLS
    return this.localFileUris.get(stableKey(item));
  }

  // ✅ Check if cached (full file downloaded)
  public isCached(item: VideoItem): boolean {
    return this.cachedKeys.has(stableKey(item));
  }

  // ✅ Check if downloading
  public isDownloading(item: VideoItem): boolean {
    return this.activeDownloads.has(stableKey(item));
  }

  // ✅ Check if loaded before
  public isLoaded(item: VideoItem): boolean {
    return this.loadedKeys.has(stableKey(item));
  }

  // ✅ Get stats for debugging
  public getStats() {
    return {
      cached: this.cachedKeys.size,
      warmed: this.warmedKeys.size,
      loaded: this.loadedKeys.size,
      downloading: this.activeDownloads.size,
    };
  }

  // ✅ Cleanup all caches
  public async cleanup(): Promise<void> {
    console.log("🧹 VideoPrefetchManager: Starting cleanup...");

    // Delete all cached files
    const deletePromises: Promise<void>[] = [];
    for (const [, uri] of this.localFileUris) {
      deletePromises.push(
        (async () => {
          try {
            const file = new File(uri);
            if (file.exists) {
              await file.delete();
            }
          } catch {
            // Ignore errors
          }
        })()
      );
    }

    await Promise.all(deletePromises);

    // Clear all state
    this.cachedKeys.clear();
    this.warmedKeys.clear();
    this.loadedKeys.clear();
    this.activeDownloads.clear();
    this.localFileUris.clear();

    console.log("✅ VideoPrefetchManager: Cleanup complete");
  }
}
