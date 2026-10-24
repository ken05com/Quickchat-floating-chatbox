/*
 * Lakbayon — background service worker
 * ------------------------------------------------------------------
 * Resolves video links into preview metadata (title, author, thumbnail).
 *
 * Why a service worker? A content script's fetch() is subject to the host
 * page's Content-Security-Policy (connect-src), so asking YouTube's oEmbed
 * API straight from the widget would be blocked on most sites. The service
 * worker runs on the extension origin instead, so its requests are not.
 */

const YOUTUBE_API = "https://www.youtube.com/oembed";
const VIMEO_API = "https://vimeo.com/api/oembed";

/* Matches YouTube (watch / youtu.be / shorts / embed / live), Vimeo,
   Instagram (reel / reels / p / tv) and direct video files.
   Kept deliberately small and dependency-free. */
function parseVideoUrl(raw) {
  const url = String(raw || "").trim();
  if (!url) return null;

  let m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (m) {
    return {
      provider: "YouTube",
      id: m[1],
      page: "https://www.youtube.com/watch?v=" + m[1],
      thumbnail: "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg"
    };
  }

  m = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d{6,})/);
  if (m) {
    return { provider: "Vimeo", id: m[1], page: "https://vimeo.com/" + m[1], thumbnail: null };
  }

  /* Instagram has no public oEmbed API (the legacy endpoint was retired), so
     metadata is scraped from the permalink's og: tags. Normalising /reel/ to
     /p/ gives the same tags without the reel redirect. */
  m = url.match(/(?:www\.|dd\.)?instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (m) {
    return {
      provider: "Instagram",
      id: m[1],
      page: "https://www.instagram.com/p/" + m[1] + "/",
      thumbnail: null
    };
  }

  m = url.match(/\.(mp4|webm|mov|m4v|ogv)(?:$|[?#\s])/i);
  if (m) {
    /* Direct file: the content script renders a frame grab in-page instead. */
    return { provider: "Direct", ext: m[1].toLowerCase(), page: url, thumbnail: null };
  }

  return null;
}

function decodeEntities(str) {
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/* Pulls one meta value out of a raw HTML string. Handles both attribute
   orders, since Instagram does not guarantee which comes first. */
function readMeta(html, prop) {
  const tagRe = new RegExp(
    "<meta[^>]+(?:property|name)\\s*=\\s*[\"']" + prop.replace(":", "\\:") + "[\"'][^>]*>",
    "i"
  );
  const tag = html.match(tagRe);
  if (!tag) return null;
  const content = tag[0].match(/content\s*=\s*[\"']([^\"']*)[\"']/i);
  return content ? decodeEntities(content[1]) : null;
}

/* Instagram: fetch the permalink and read its Open Graph tags. Public posts
   expose og:title and og:image; login-walled ones may not, in which case the
   caller falls back to a branded placeholder card. */
async function resolveInstagram(info) {
  const res = await fetch(info.page, {
    credentials: "omit",
    headers: { "Accept-Language": "en-US,en;q=0.9" }
  });
  if (!res.ok) throw new Error("HTTP " + res.status);

  const html = await res.text();
  const title = readMeta(html, "og:title");
  const image = readMeta(html, "og:image");

  return {
    provider: "Instagram",
    page: info.page,
    title: title || "Instagram reel",
    author: "",
    thumbnail: image || null
  };
}

async function fetchJson(url) {
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

async function resolve(rawUrl) {
  const info = parseVideoUrl(rawUrl);
  if (!info) return { ok: false, reason: "unsupported" };

  if (info.provider === "Direct") {
    return { ok: true, info: { provider: "Direct", page: info.page, title: "Video file" } };
  }

  if (info.provider === "Instagram") {
    try {
      return { ok: true, info: await resolveInstagram(info) };
    } catch (err) {
      /* Private, deleted or login-walled posts still get a usable card. */
      return {
        ok: true,
        partial: true,
        info: { provider: "Instagram", page: info.page, title: "Instagram reel", author: "", thumbnail: null }
      };
    }
  }

  const endpoint =
    info.provider === "YouTube" ? YOUTUBE_API + "?format=json&url=" : VIMEO_API + "?url=";

  try {
    const data = await fetchJson(endpoint + encodeURIComponent(info.page));
    return {
      ok: true,
      info: {
        provider: info.provider,
        page: info.page,
        title: data.title || info.page,
        author: data.author_name || data.owner_name || "",
        thumbnail: data.thumbnail_url || info.thumbnail || null
      }
    };
  } catch (err) {
    /* Private, deleted or region-blocked videos still deserve a preview —
       fall back to the deterministic YouTube thumbnail and the page URL. */
    return {
      ok: true,
      partial: true,
      info: {
        provider: info.provider,
        page: info.page,
        title: info.provider + " video",
        author: "",
        thumbnail: info.thumbnail || null
      }
    };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "lakbayon:resolve-video") return undefined;

  resolve(msg.url)
    .then(sendResponse)
    .catch(() => sendResponse({ ok: false, reason: "error" }));

  return true; // keep the message channel open for the async reply
});

/* Relays the keyboard shortcut to the active tab. Content scripts cannot
   listen for chrome.commands themselves — only the worker can. */
chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-companion") return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (tab && typeof tab.id === "number") {
      chrome.tabs.sendMessage(tab.id, { type: "lakbayon:toggle" }).catch(() => {
        /* No widget on this page (e.g. a chrome:// tab) — nothing to do. */
      });
    }
  });
});