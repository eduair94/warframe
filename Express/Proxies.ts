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
    if (this.apiKey) {
      console.log("Api Key", this.apiKey);
      const endpoint = `https://api.proxyscrape.com/v2/account/datacenter_shared/proxy-list?auth=${this.apiKey}&protocol=http`;
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
