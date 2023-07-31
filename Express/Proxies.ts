import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
const cfg = dotenv.config();
class Proxies {
  private proxies = "proxies/proxies.txt";
  private banned_proxies = "proxies/banned.txt";
  private idx = 0;
  private apiKey = process.env.apiKey || "cxgkz5524huimg0qmnfs";
  private proxyType = process.env.proxyType || "http";
  bProxyList: string[];
  proxieList: string[];
  constructor() {
    if (!this.proxyType) {
      this.proxyType = "http";
    }
    this.readProxyFile();
    this.setProxies();
  }
  getProxy() {
    if (!this.proxieList[this.idx]) {
      this.idx = 0;
    }
    const res = this.proxieList[this.idx];
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

const proxies = new Proxies();
export default proxies;
