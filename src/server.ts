import Mongoose from "mongoose";
import { MonitorJob } from "./jobs/MonitorJob";

export default class CryptoBotServer {
  constructor() {
    this.setupDatabase();
    this.startJobs();
  }

  private startJobs(): void {
    console.log("Starting jobs..");
    new MonitorJob();
  }

  private async setupDatabase() {
    const connString = "mongodb+srv://admins:root0159@cluster0.zum0w.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

    Mongoose.connect(connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
  }

  public start(): void {
    console.log("₵ryptoLight BOT has started. " + new Date().toString());
    console.log(
      "Esse robô é programado para apenas monitorar, e fechar ordens lançadas por terceiros em sua conta"
    );
  }
}
("");
