import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import { ProxyAgent } from "proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
dotenv.config();
class Proxies {
  private proxies = "proxies/proxies.txt";
  private banned_proxies = "proxies/banned.txt";
  idx = 0;
  private apiKey = process.env.PROXY_API_KEY || "";
  private proxyType = process.env.PROXY_TYPE || "http";
  bProxyList: string[];
  proxieList: string[];
  private usaProxies: boolean;

  // ProxyScrape v4 "datacenter_shared" authenticated pool (~3500 IPs). These
  // per-proxy user:pass datacenter proxies authenticate off-whitelist and get
  // past Cloudflare on api.warframe.market, unlike the unauthenticated shared
  // IPs from the local pool / v2 endpoint (which Cloudflare 403s). Same pool the
  // sibling trustpilot project uses. Creds come from env (this repo is public,
  // so nothing is baked in) - if unset, we fall back to the legacy sources.
  private psToken = process.env.PROXYSCRAPE_API_TOKEN || "";
  private psSubs = (process.env.PROXYSCRAPE_SUBS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  private psTtlMs = parseInt(process.env.PROXYSCRAPE_DC_TTL_MS || "600000", 10);
  private psRefreshTimer: NodeJS.Timeout | null = null;
  // v4 credential_format=1 line: ip:port:user:pass
  private static readonly PS_LINE_RE =
    /^((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5}):([^:\s]+):(\S+)$/;

  constructor(usaProxies = false) {
    this.usaProxies = usaProxies;
    const directoryPath = "proxies";
    if (!fs.existsSync(directoryPath)) {
      // If the directory doesn't exist, create it
      fs.mkdirSync(directoryPath);
      console.log(`Directory "${directoryPath}" created.`);
    } else {
      console.log(`Directory "${directoryPath}" already exists.`);
    }
    if (!this.proxyType) {
      this.proxyType = "https";
    }
    if (usaProxies) {
      this.proxies = "proxies/usa_proxies.txt";
      this.banned_proxies = "proxies/usa_banned.txt";
    }
    // Populate the proxy list for both regions - previously this only ran
    // for the non-USA branch, leaving usa_proxies.txt permanently empty
    // whenever PROXY_TYPE_REGION=usa.
    this.setProxies().then(() => this.readProxyFile());
    this.readProxyFile();
    try {
      this.idx = parseInt(fs.readFileSync("proxies/idx.txt", "utf-8")) || 0;
      if (isNaN(this.idx)) {
        this.idx = 0;
      }
    } catch (e) {}
    // Datacenter proxies rotate, so refresh the pool periodically for the
    // long-running sync processes. Only when the ProxyScrape source is
    // configured; unref so this timer never keeps a one-shot script alive.
    this.startProxyRefresh();
  }

  /** Whether the ProxyScrape v4 datacenter pool is configured via env. */
  private isProxyScrapeConfigured(): boolean {
    return !!this.psToken && this.psSubs.length > 0;
  }

  /**
   * Periodically re-fetches the ProxyScrape pool (TTL) so long-running sync
   * processes don't drift onto expired proxies. No-op when not configured.
   */
  private startProxyRefresh(): void {
    if (!this.isProxyScrapeConfigured() || this.psRefreshTimer) return;
    this.psRefreshTimer = setInterval(() => {
      this.setProxies()
        .then(() => this.readProxyFile())
        .catch((e) => console.warn("Proxy refresh failed:", e?.message || e));
    }, this.psTtlMs);
    // Don't hold the event loop open for one-shot scripts (sync_rivens, etc.)
    if (this.psRefreshTimer.unref) this.psRefreshTimer.unref();
  }
  getProxyAgent(proxy?: string): ProxyAgent | SocksProxyAgent {
    if (!proxy) proxy = this.getProxy();
    console.log("proxy", proxy);
    if (this.proxyType === "socks5") {
      console.log("SocksProxyAgent");
      return new SocksProxyAgent(proxy);
    } else {
      return new ProxyAgent(proxy as any);
    }
  }
  getProxy() {
    if (process.env.PROXY_LESS === "true") return null;
    if (!this.proxieList[this.idx]) {
      this.idx = 0;
    }
    const res = this.proxieList[this.idx];
    // Save idx in a file to retrieve later
    fs.writeFileSync("proxies/idx.txt", this.idx.toString());
    this.idx++;
    return res;
  }
  banProxy(proxy: string) {
    this.proxieList = this.proxieList.filter((el, idx) => {
      return el !== proxy;
    });
    if (!this.proxieList.length) {
      this.cleanBadProxies();
      this.readProxyFile();
    } else {
      this.saveBadProxy(proxy);
    }
  }
  saveBadProxy(proxy: string) {
    fs.appendFileSync(this.banned_proxies, proxy + "\n");
  }
  cleanBadProxies() {
    fs.writeFileSync(this.banned_proxies, "");
  }
  async setProxies(): Promise<void> {
    // Primary source: ProxyScrape v4 datacenter_shared authenticated pool.
    // These get past Cloudflare on api.warframe.market; the legacy sources
    // below (v2 IP-auth list / local unauthenticated pool) do not.
    if (await this.setProxiesFromProxyScrape()) return;

    if (this.apiKey) {
      console.log("Api Key", this.apiKey);
      // country=US narrows the datacenter_shared list to US-tagged proxies
      // when PROXY_TYPE_REGION=usa - previously this source ignored region
      // entirely, so usa_proxies.txt filled with proxies from any country.
      // ProxyScrape ignores unrecognized query params, so this is safe even
      // if the account tier doesn't support geo-filtering.
      const countryParam = this.usaProxies ? "&country=US" : "";
      const endpoint = `https://api.proxyscrape.com/v2/account/datacenter_shared/proxy-list?auth=${this.apiKey}&protocol=http${countryParam}`;
      console.log("endpoint", endpoint);
      const proxies = await axios
        .get(endpoint)
        .then((res) => {
          return res.data;
        })
        .catch((e) => {
          return "";
        });
      if (proxies) {
        this.proxieList = proxies
          .split("\n")
          .map(function (proxy) {
            if (proxy) return "http://" + proxy.trim();
            return "";
          })
          .filter((el) => {
            return el !== "";
          });
        fs.writeFileSync(this.proxies, this.proxieList.join("\n"));
        console.log("Total Proxies", this.proxieList.length);
      }
      return;
    }

    // No PROXY_API_KEY configured - fall back to the local proxyapp pool
    // (sibling service on this host) so requests don't go out on the
    // server's own IP, which Cloudflare blocks for api.warframe.market.
    await this.setProxiesFromLocalPool();
  }

  /**
   * Populates the proxy list from the ProxyScrape v4 "datacenter_shared" pool
   * (~3500 authenticated IPs across the configured subscriptions). Each proxy
   * is emitted as a fully-authenticated `http://user:pass@ip:port` URL so it
   * works off-whitelist. Returns true if proxies were loaded.
   *
   * Endpoint/shape mirrors the sibling trustpilot project's
   * ProxyScrapeDatacenterService (v4 credential_format=1: ip:port:user:pass).
   */
  async setProxiesFromProxyScrape(): Promise<boolean> {
    if (!this.isProxyScrapeConfigured()) return false;

    const seen = new Set<string>();
    const list: string[] = [];

    for (const sub of this.psSubs) {
      const data = await axios
        .get<string>(
          `https://api.proxyscrape.com/v4/account/${sub}/datacenter_shared/proxy-list`,
          {
            headers: { "api-token": this.psToken },
            params: {
              type: "getproxies",
              protocol: "http",
              format: "credentials",
              credential_format: 1,
              // Narrows to US-tagged datacenter proxies in USA mode; ProxyScrape
              // ignores unrecognized params so this is safe on plans without
              // geo-filtering too. Previously always requested every country.
              ...(this.usaProxies ? { country: "US" } : {}),
            },
            responseType: "text",
            timeout: 20000,
          }
        )
        .then((res) => res.data)
        .catch((e) => {
          console.warn(`ProxyScrape sub ${sub} fetch failed:`, e?.message || e);
          return null;
        });

      if (!data) continue;

      for (const line of String(data).split("\n")) {
        const m = Proxies.PS_LINE_RE.exec(line.trim());
        if (!m) continue;
        const key = `${m[1]}:${m[2]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        // ip:port:user:pass -> http://user:pass@ip:port
        list.push(`http://${m[3]}:${m[4]}@${m[1]}:${m[2]}`);
      }
    }

    if (!list.length) {
      console.warn(
        "ProxyScrape returned no proxies (check PROXYSCRAPE_API_TOKEN / PROXYSCRAPE_SUBS)"
      );
      return false;
    }

    // Shuffle so parallel consumers don't all start on the same head-of-list IP.
    list.sort(() => Math.random() - 0.5);
    this.proxieList = list;
    fs.writeFileSync(this.proxies, list.join("\n"));
    console.log("Total Proxies (ProxyScrape v4 datacenter)", list.length);
    return true;
  }

  /**
   * Populates the proxy list from a locally-hosted proxy pool service
   * (see PROXY_SOURCE_URL) when no proxyscrape API key is configured.
   */
  async setProxiesFromLocalPool(): Promise<void> {
    const sourceUrl = process.env.PROXY_SOURCE_URL || "http://localhost:3030/proxy_list";
    const entries = await axios
      .get(sourceUrl)
      .then((res) => res.data)
      .catch(() => null);

    if (!Array.isArray(entries) || entries.length === 0) {
      console.log("No proxies available from local pool:", sourceUrl);
      return;
    }

    const usable = entries.filter((entry: any) => entry && entry.proxy && entry.status !== false);

    // Prefer US-tagged proxies when running in USA mode, but the local pool
    // isn't guaranteed to have any - fall back to the full pool rather than
    // ending up with zero proxies.
    const usEntries = usable.filter((entry: any) => entry.country === "US");
    const selected = this.usaProxies && usEntries.length > 0 ? usEntries : usable;

    this.proxieList = selected.map((entry: any) => "http://" + entry.proxy.trim());

    fs.writeFileSync(this.proxies, this.proxieList.join("\n"));
    console.log("Total Proxies (local pool)", this.proxieList.length);
  }
  readProxyFile() {
    if(!fs.existsSync(this.proxies)) {
      fs.writeFileSync(this.proxies, "");
    }
    const proxyTxt = fs.readFileSync(this.proxies, "utf-8");
    let proxies: string[] = [];
    if(proxyTxt.length > 0) {
      proxies = proxyTxt.split("\n").map((el) => {
        el = el.trim();
        if (!el.includes("//")) {
          el = this.proxyType + "://" + el;
        }
        return el;
      });
    }
    if(!fs.existsSync(this.banned_proxies)) {
      fs.writeFileSync(this.banned_proxies, "");
    }
    const bProxiesTxt = fs.readFileSync(this.banned_proxies, "utf-8");
    if (bProxiesTxt) {
      this.bProxyList = bProxiesTxt.split("\n").map((el) => {
        el = el.trim();
        if (!el.includes("//")) {
          el = this.proxyType + "://" + el;
        }
        return el;
      });
      proxies = proxies.filter((el) => {
        return !this.bProxyList.includes(el);
      });
    }
    this.proxieList = proxies
      .map(function (el) {
        if (!el) return "";
        return el.trim();
      })
      .filter((el) => {
        return el !== "";
      });
  }
  test() {
    console.log("Test");
  }
}

const proxies = new Proxies(process.env.PROXY_TYPE_REGION === "usa");
export default proxies;
