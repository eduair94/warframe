import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import { ProxyAgent } from "proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
const cfg = dotenv.config();
class Proxies {
  private proxies = "proxies/proxies.txt";
  private banned_proxies = "proxies/banned.txt";
  private idx = 0;
  private apiKey = process.env.apiKey || "l0dpqikj1eup8mmc7zy8";
  private proxyType = process.env.proxyType || "http";
  bProxyList: string[];
  proxieList: string[];
  constructor(usaProxies = false) {
    const directoryPath = "proxies";
    if (!fs.existsSync(directoryPath)) {
      // If the directory doesn't exist, create it
      fs.mkdirSync(directoryPath);
      console.log(`Directory "${directoryPath}" created.`);
    } else {
      console.log(`Directory "${directoryPath}" already exists.`);
    }
    this.setProxies();
    if (!this.proxyType) {
      this.proxyType = usaProxies ? "http" : "socks5";
    }
    if (usaProxies) {
      this.proxies = "proxies/usa_proxies.txt";
      this.banned_proxies = "proxies/usa_banned.txt";
    }
    this.readProxyFile();
    this.idx = parseInt(fs.readFileSync("proxies/idx.txt", "utf-8")) || 0;
    if (isNaN(this.idx)) {
      this.idx = 0;
    }
  }
  getProxyAgent(proxy?: string): ProxyAgent | SocksProxyAgent {
    if (!proxy) proxy = this.getProxy();
    console.log("proxy", proxy);
    if (this.proxyType === "socks5") {
      return new SocksProxyAgent(proxy);
    } else {
      return new ProxyAgent(proxy as any);
    }
  }
  getProxy() {
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
      const endpoint = `https://api.proxyscrape.com/v2/account/datacenter_shared/proxy-list?auth=${this.apiKey}&protocol=socks`;
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
            if (proxy) return "socks5://" + proxy.trim();
            return "";
          })
          .filter((el) => {
            return el !== "";
          });
        fs.writeFileSync(this.proxies, this.proxieList.join("\n"));
        console.log("Total Proxies", this.proxieList.length);
      }
    }
  }
  readProxyFile() {
    const proxyTxt = fs.readFileSync(this.proxies, "utf-8");
    let proxies = proxyTxt.split("\n").map((el) => {
      el = el.trim();
      if (!el.includes("//")) {
        el = this.proxyType + "://" + el;
      }
      return el;
    });
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

const proxies = new Proxies(process.env.proxy_type === "usa");
export default proxies;
