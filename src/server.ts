import Mongoose from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MonitorJob } from "../src/jobs/MonitorJob";
import { TradeJob } from "../src/jobs/TradeJob";
export default class CryptoBotServer {
  constructor() {
    this.setupDatabase();
    this.startJobs();
  }

  private startJobs(): void {
    console.log('Starting jobs..');
    new MonitorJob();
    new TradeJob();
  }

  private async setupDatabase() {
    // const mongod = await MongoMemoryServer.create();
    // const connString = mongod.getUri();
    const connString = "mongodb://localhost:27017/cryptobot";

    Mongoose.connect(connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  public start(): void {
    console.log('₵ryptoBOT has started. ' + new Date().toString());
  }
}
("");
