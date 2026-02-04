import mongoose from "mongoose";
import { mongoConfig } from "./config";
const Schema = mongoose.Schema;

export class MongooseServer {
  private static att = 0;
  private static instances: Array<MongooseServer> = [];
  private static db: any = {};
  private static connectionAllowed = false;
  private Model;
  private max_att = 3;
  private timeout = 200;

  private constructor(document, schema) {
    this.Model = mongoose.model(document, schema);
  }

  public static getInstance(document: string, schema) {
    const m = MongooseServer;
    if (!m.instances[document]) {
      m.instances[document] = new MongooseServer(document, schema);
    }
    return m.instances[document];
  }

  private connectionError = {
    error: "Connection Error",
  };

  async aggregate(aggQuery, att = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getModel()
        .aggregate(aggQuery)
        .exec((error: Error, res: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.aggregate(aggQuery, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          if (res && res.length) {
            return resolve(res);
          } else {
            return resolve([]);
          }
        });
    });
  }

  findEntry(entry: any, att = 0) {
    if (!MongooseServer.connectionAllowed) {
      return this.connectionError;
    }
    const options = {};
    return new Promise((resolve, reject) => {
      this.Model.findOne(entry, options)
        .lean()
        .exec((error: Error, doc: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.findEntry(entry, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public async allEntriesSort(param: any, sort: any, att = 0) {
    const r = await this.Model.find(param).sort(sort).lean();
    return r;
  }

  /**
   * Ensure an index exists on the underlying collection.
   * This helps prevent large in-memory sorts when querying/sorting large collections.
   *
   * @param indexSpec - index specification object like { priceUpdate: 1 }
   * @param options - optional index options
   */
  public async ensureIndex(indexSpec: any, options: any = {}): Promise<void> {
    try {
      // Use the raw collection to create the index
      await this.Model.collection.createIndex(indexSpec, options);
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to create index', indexSpec, error);
      return Promise.reject(error);
    }
  }

  public allEntries(param: any, att = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      this.Model.find(param, (error: Error, result: any) => {
        if (error) {
          if (att < this.max_att) {
            return setTimeout(() => {
              att++;
              return resolve(this.allEntries(param, att));
            }, this.timeout);
          } else {
            console.error(error);
            return reject(error);
          }
        }
        return resolve(result);
      });
    });
  }

  public async dropCollection(): Promise<void> {
    await this.Model.collection.drop();
  }

  public allEntriesExclusion(param: any, exclusion: any, att = 0) {
    return new Promise((resolve, reject) => {
      this.Model.find(param, exclusion, (error, result) => {
        if (error) {
          if (att < this.max_att) {
            return setTimeout(() => {
              att++;
              return resolve(this.allEntriesExclusion(param, exclusion, att));
            }, this.timeout);
          } else {
            console.error(error);
            return reject(error);
          }
        }
        return resolve(result);
      });
    });
  }

  public countEntries(param?, att = 0) {
    if (!param) param = {};
    return new Promise((resolve, reject) => {
      this.Model.countDocuments(param, (error, result) => {
        if (error) {
          if (att < this.max_att) {
            return setTimeout(() => {
              att++;
              return resolve(this.countEntries(param, att));
            }, this.timeout);
          } else {
            console.error(error);
            return reject(error);
          }
        }
        return resolve(result);
      });
    });
  }

  public saveEntries(entries: Array<any>, att = 0) {
    return new Promise((resolve, reject) => {
      this.Model.insertMany(entries, (error: Error, docs: any) => {
        if (error) {
          if (att < this.max_att) {
            return setTimeout(() => {
              att++;
              return resolve(this.saveEntries(entries, att));
            }, this.timeout);
          } else {
            console.error(error);
            return reject(error);
          }
        }
        return resolve(true);
      });
    });
  }

  public saveEntry(entry: any, att = 0) {
    return new Promise((resolve, reject) => {
      this.Model.create(entry, (error: Error, doc: any) => {
        if (error) {
          if (att < this.max_att) {
            return setTimeout(() => {
              att++;
              return resolve(this.saveEntry(entry, att));
            }, this.timeout);
          } else {
            console.error(error);
            return reject(error);
          }
        }
        resolve(doc);
      });
    });
  }

  public findHistoryEntry(entry: any, att = 0) {
    return new Promise((resolve, reject) => {
      this.Model.find(entry, (error: Error, doc: any, res: any) => {
        if (error) {
          if (att < this.max_att) {
            return setTimeout(() => {
              att++;
              return resolve(this.findHistoryEntry(entry, att));
            }, this.timeout);
          } else {
            console.error(error);
            return reject(error);
          }
        }
        resolve(doc);
      });
    });
  }

  public addToSet(entry, items, att = 0) {
    const options = {
      upsert: true,
      useFindAndModify: false,
      setDefaultsOnInsert: true,
    };
    return new Promise((resolve, reject) => {
      this.Model.updateOne(entry, items, options)
        .lean()
        .exec((error, doc) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.addToSet(entry, items, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public getAnUpdateEntryAlt(entryGet: any, entry: any, att = 0) {
    const query = entryGet;
    const update = entry;
    const options = {
      upsert: true,
      useFindAndModify: false,
      setDefaultsOnInsert: true,
    };
    return new Promise((resolve, reject) => {
      this.Model.findOneAndUpdate(query, update, options)
        .lean()
        .exec((error: Error, doc: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.getAnUpdateEntryAlt(entryGet, entry, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public getAnUpdateEntry(entryGet: any, entryE: any, att = 0) {
    const entry = { ...entryE };
    const query = entryGet;
    const keys = Object.keys(query);
    keys.forEach((key) => {
      delete entry[key];
    });
    const update = entry;
    const options = {
      upsert: true,
      useFindAndModify: false,
      setDefaultsOnInsert: true,
    };
    return new Promise((resolve, reject) => {
      this.Model.findOneAndUpdate(query, update, options)
        .lean()
        .exec((error: Error, doc: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.getAnUpdateEntry(entryGet, entryE, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public pushEntry(entry: any, toPush: any, att = 0) {
    const pushMongo = { $push: toPush };
    return new Promise((resolve, reject) => {
      const options = {
        upsert: true,
        useFindAndModify: false,
        setDefaultsOnInsert: true,
        new: true,
      };
      this.Model.findOneAndUpdate(entry, pushMongo, options)
        .lean()
        .exec((error: Error, doc: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.pushEntry(entry, toPush, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public deleteEntry(entry, att = 0) {
    return new Promise((resolve, reject) => {
      this.Model.deleteOne(entry)
        .lean()
        .exec((error: Error, doc: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.deleteEntry(entry, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public deleteMany(args = {}, att = 0) {
    return new Promise((resolve, reject) => {
      this.Model.deleteMany(args)
        .lean()
        .exec((error: Error, doc: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.deleteMany(args, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public deleteAll(att = 0) {
    return new Promise((resolve, reject) => {
      this.Model.deleteMany({})
        .lean()
        .exec((error: Error, doc: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.deleteAll(att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public getModel() {
    return this.Model;
  }

  public updateMany(entryGet, entry, att = 0) {
    const options = {};
    return new Promise((resolve, reject) => {
      this.Model.updateMany(entryGet, entry, options)
        .lean()
        .exec((error: Error, doc: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.updateMany(entryGet, entry, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public updateOneAlt(entryGet, entry, att = 0) {
    const options = {};
    return new Promise((resolve, reject) => {
      this.Model.updateOne(entryGet, entry, options)
        .lean()
        .exec((error: Error, doc: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.updateOneAlt(entryGet, entry, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public updateOne(entryGet, entryUpdate, att = 0) {
    const entry = { ...entryUpdate };
    Object.keys(entryGet).forEach((key) => {
      delete entry[key];
    });
    const options = {
      upsert: true,
      useFindAndModify: false,
      setDefaultsOnInsert: true,
    };
    return new Promise((resolve, reject) => {
      this.Model.updateOne(entryGet, entry, options)
        .lean()
        .exec((error: Error, doc: any) => {
          if (error) {
            if (att < this.max_att) {
              return setTimeout(() => {
                att++;
                return resolve(this.updateOne(entryGet, entryUpdate, att));
              }, this.timeout);
            } else {
              console.error(error);
              return reject(error);
            }
          }
          return resolve(doc);
        });
    });
  }

  public static connectWithRetry = (): any => {
    mongoose.set("strictQuery", false);
    const mongoUri = process.env.MONGODB_URI || `mongodb://localhost:27017/${mongoConfig.database}`;
    mongoose
      .connect(mongoUri, {})
      .catch(() => {});
  };

  public static dealConnection = (): void => {
    // If the connection throws an error
    mongoose.connection.on("error", (err) => {
      console.log("Error Connection", err);
      return;
    });

    // When the connection is disconnected
    mongoose.connection.on("disconnected", () => {
      console.log("Disconnected");
      return;
    });
  };

  public static first = true;
  public static retry = true;

  public static closeConnection(): void {
    MongooseServer.retry = false;
    mongoose.connection.close();
  }

  public static startConnectionPromise(): Promise<any> {
    return new Promise((cb) => {
      const s = MongooseServer;
      s.connectWithRetry();
      s.db = mongoose.connection;
      MongooseServer.dealConnection();
      s.db.once("open", () => {
        console.log("Connection to mongoose database started", s.first);
        s.connectionAllowed = true;
        if (s.first) {
          s.first = false;
          return cb(true);
        }
      });
    });
  }

  public static startConnection(cb: Function): void {
    const s = MongooseServer;
    s.connectWithRetry();
    s.db = mongoose.connection;
    MongooseServer.dealConnection();
    s.db.once("open", () => {
      console.log("Connection to mongoose database started", s.first);
      s.connectionAllowed = true;
      if (s.first) {
        s.first = false;
        return cb(true);
      }
    });
  }
}

export { mongoose, Schema };

