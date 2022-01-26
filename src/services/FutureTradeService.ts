import Binance from "node-binance-api";
import Order from "../schemas/Order";
export class FutureTradeService {
  private initialAmountUSDT = 2;
  private running = false;
  private users = [
    // {
    //   name: "Adriel",
    //   maxROIGain: 2,
    //   maxROILoss: -5,
    //   reducePercentage: 1,
    //   clientApi: new Binance().options({
    //     APIKEY:
    //       "gkrHT41fWQbBEhbbd3N6xPtVcJWXPUjppaG7NXPvkSjl68BqM8YOcszR5SndQs1q",
    //     APISECRET:
    //       "NZGcjjmJLA1jMtPe4may9VHRCMIBvDfuJ8rssXaqDnVPvmerxKfpTyLqTX08pK3s",
    //   }),
    // },
    // {
    //   name: "Juliana",
    //   maxROIGain: 2,
    //   maxROILoss: -5,
    //   reducePercentage: 1,
    //   clientApi: new Binance().options({
    //     APIKEY:
    //       "q5oz7Dta5FMZlwkZxbum08xFX5s2oa4qAwWydLDWW3FJnCQ5DOO4XnGqdmH106kP",
    //     APISECRET:
    //       "9p4jFrl8K6hbAc5PEecQSUmB6OOb7Uu04vDZpb6Eh3m84L92oswnPvDl59VGGjOx",
    //   }),
    // },
    {
      name: "Thiago",
      maxROIGain: 2,
      maxROILoss: -5,
      reducePercentage: 1,
      clientApi: new Binance().options({
        APIKEY:
          "nMXYE7T3mMaAylQvKHjQDR0606r8sYYew9qvPqCTS4QzoRbx3rEqBZmo9MorVyNz",
        APISECRET:
          "WPIUb88Zy3Jge46jlUGsl8oUaB1WEP5zUZe4udD5rSXA0obsAu7tfOUqTCuxRw2q",
      }),
    },
    // {
    //   name: "Bruna",
    //   maxROIGain: 2,
    //   maxROILoss: -5,
    //   reducePercentage: 1,
    //   clientApi: new Binance().options({
    //     APIKEY:
    //       "ZwC1ny9cRKZXvazqD4MXxtCshQ0ulppOsrcoGEBQ0lACQPgNhAWJdxHHDwxD8XiP",
    //     APISECRET:
    //       "NYXIxtaGBOVX8gQfJvpJH1ATMSVI3SHDCWPBzqljPe4VCzg87Xug63WrSgDc1nnJ",
    //   }),
    // },
    // {
    //   name: "Juliana2",
    //   maxROIGain: 2,
    //   maxROILoss: -5,
    //   reducePercentage: 1,
    //   clientApi: new Binance().options({
    //     APIKEY:
    //       "rHSKrv2MQKNft91dLLwHMcQR7sn731kaEyqZKUvNx1uF4ktsgvSuacVQe9cq8999",
    //     APISECRET:
    //       "tkdH70W1OUNkEb74rebJ0sHuJbTbqur5zeOhPefsKOv7bjHvINGBuBzWd9MIROpA",
    //   }),
    // },
    // {
    //   name: "Alessandra",
    //   maxROIGain: 2,
    //   maxROILoss: -5,
    //   reducePercentage: 1,
    //   clientApi: new Binance().options({
    //     APIKEY:
    //       "DiM9jbp8GeyFdxnT5S557IIiYJuMvaQh4mIOhmXINJjE8pfwmkgqDPCSxTRPvOCD",
    //     APISECRET:
    //       "DoBuJH6CAym77tcfEJIr07CXTlge3PUyaphENPUuYIyWjqhSIADP7s1jz5MicwiC",
    //   }),
    // },
    // {
    //   name: "Simone",
    //   maxROIGain: 2,
    //   maxROILoss: -5,
    //   reducePercentage: 1,
    //   clientApi: new Binance().options({
    //     APIKEY:
    //       "Q3GzAsOqBSa6PakO1h1TjifTfdsB4xpnxmEFL0Mn4ogUuMkCtQLre1nz02t5M9aA",
    //     APISECRET:
    //       "xbs1ZxooZIPOjwRf77o3w7CQfut2AlpVsX9sCTZwRh6PAMnvWVaLTInZSV01TruH",
    //   }),
    // },
    // {
    //   name: "Edlaine",
    //   maxROIGain: 2,
    //   maxROILoss: -5,
    //   reducePercentage: 1,
    //   clientApi: new Binance().options({
    //     APIKEY:
    //       "kaCgWizO2p332srnLjfGDF3fat89tFaMuH16ELf4wL80MokNfbw4ArJJXN1dgVMb",
    //     APISECRET:
    //       "ZwWVSDEsMAvUPtciTZU4Atuf7shJllxWajgpcT4FbpwphlBewqhRu3n9hTDYy9eb",
    //   }),
    // },
  ];

  delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  private async closeOrder(
    symbol: string,
    amount: any,
    sign: any,
    clientApi: any
  ) {
    try {
      if (sign !== -1) {
        const order = await clientApi.futuresMarketSell(symbol, amount, {
          reduceOnly: true,
        });

        await clientApi.futuresCancelAll(symbol);
        console.log(order);
      } else {
        const order = await clientApi.futuresMarketBuy(symbol, amount, {
          reduceOnly: true,
        });
        await clientApi.futuresCancelAll(symbol);
        console.log(order);
      }
    } catch (err) {
      console.log(err);
    }
  }

  private async traillingStop(
    symbol: string,
    cliente: string,
    inputROI: number,
    reducePercentage: number,
    positionAmnt: string,
    clientApi: any
  ) {
    try {
      //Cancela todas as ordens abertas para esse simbolo
      await clientApi.futuresCancelAll(symbol);
      //Obter a ordem do cliente aberta para esse simbolo.
      const order = await Order.findOne({ cliente, symbol, status: "open" });
      //Caso ainda não existe nenhuma ordem o o status aberta, é criado uma no banco de dados.
     
      if (!order) {
        await Order.create({
          cliente,
          symbol,
          ROI: inputROI,
          maxROIReached: inputROI,
          status: "open",
        });
      } else {
        //Caso já exista, continue o codigo
        const { maxROIReached } = order; console.log(maxROIReached, inputROI)
        const differenceROI = maxROIReached - inputROI;
        //Comparar se o ROI salvo na operação é maior que o atual
        if (inputROI > maxROIReached) {
          if (inputROI > 1) {
            await Order.findOneAndUpdate(
              { cliente, symbol, status: 'open' },
              {
                $set: {
                  maxROIReached: inputROI,
                },
              }
            );
          }
        }

        if (differenceROI >= reducePercentage) {
          await this.closeOrder(
            symbol,
            Math.abs(Number(positionAmnt)),
            Math.sign(Number(positionAmnt)),
            clientApi
          );

          await Order.findOneAndUpdate(
            { cliente, symbol, maxROIReached, status: 'open' },
            {
              $set: {
                ROI: inputROI,
                status: "closed",
              },
            }
          );
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  public async startOrderMonitor(): Promise<any> {
    if(this.running) return;
    this.running = true;
    for (var i = 0; i < this.users.length; i++) {
      const user = this.users[i];
      await this.delay(500);
      try {
        const { maxROIGain, maxROILoss, clientApi, reducePercentage } = user;
        const position_data = await clientApi.futuresPositionRisk(),
          markets = Object.keys(position_data);
        const fullAcount = await clientApi.futuresAccount();
        console.log(`[${user.name}] Em execução...`);
        for (let market of markets) {
          let obj = position_data[market],
            size = Number(obj.positionAmt);
          if (size == 0) continue;
          let { symbol, unRealizedProfit } = obj;
          let positionBalance = fullAcount?.positions?.find(
            (balance: any) => balance.symbol === symbol
          );

          let finalAmountUsdt =
            this.initialAmountUSDT + Number(unRealizedProfit);
          let diference = Number(finalAmountUsdt) - this.initialAmountUSDT;
          console.log(diference, finalAmountUsdt);
          let ROE =
            (Number(diference) / Number(positionBalance.initialMargin)) * 100;
          // console.log(positionBalance);

          // console.log(positionBalance);

          await this.traillingStop(
            symbol,
            user.name,
            ROE,
            reducePercentage,
            positionBalance.positionAmt,
            clientApi
          );
          // if (ROE >= maxROIGain) {
          //   //1 Cancelar todas as ordens abertas para essa moeda
          //   //2 Calcular e abrir ordem TP/SL
          //   console.info("MAX GAIN", ROE, unRealizedProfit, user.name);
          //   await this.closeOrder(
          //     symbol,
          //     Math.abs(Number(positionBalance.positionAmt)),
          //     Math.sign(Number(positionBalance.positionAmt)),
          //     clientApi
          //   );
          // }

          if (ROE <= maxROILoss) {
            console.info("MAX LOSS", ROE, unRealizedProfit, user.name);
            await this.closeOrder(
              symbol,
              Math.abs(Number(positionBalance.positionAmt)),
              Math.sign(Number(positionBalance.positionAmt)),
              clientApi
            );
          }
          console.log(
            `[${
              user.name
            }] ${symbol} | ROI: ${unRealizedProfit} USDT | ${ROE.toFixed(2)}%`
          );
        }
      } catch (err) {
        console.log(err);
      }
    }

    this.running = false;
  }
}
