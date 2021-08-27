import Mongoose from "mongoose";
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
    const connString = "mongodb://localhost:27017/cryptobot";

    Mongoose.connect(connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });
  }

  public start(): void {
    console.log('₵ryptoBOT has started. ' + new Date().toString());
  }
}
("");
