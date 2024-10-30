import { Component, OnInit } from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { first, groupBy, lastValueFrom, map } from 'rxjs';
import { NgxCsvParserModule, NgxCsvParser } from 'ngx-csv-parser';
import { MarketData } from '../../models/api/marketData.model';
import moment from 'moment';
import lodash from 'lodash';
import { CandleGridItem } from './models/candle-grid-item.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'candle-grid',
  standalone: true,
  imports: [MatTableModule, NgxCsvParserModule, CommonModule],
  providers: [HttpClient],
  templateUrl: './candle-grid.component.html',
  styleUrl: './candle-grid.component.scss'
})
export class CandleGridComponent implements OnInit {
  title = 'fluent-trade-test';

  candles : CandleGridItem [] = [];
  loading : boolean = true;
  displayedColumns: string[] = ['open', 'close', 'low', 'high', 'volume', 'date'];


  private readonly MARKET_DATA_FILE_NAME = 'MarketData.csv';
  private readonly DELIMITER = ',';

  constructor(private httpClient: HttpClient,
              private ngxCsvParser: NgxCsvParser)
  {

  }

  async ngOnInit()
  {
    this.httpClient.get(this.MARKET_DATA_FILE_NAME, {responseType: 'text'})
                   .pipe(
                      map(this.parseCsvStringToArray),
                      map(this.removeHeadersFromArray),
                      map(this.mapToMarketData),
                      map(this.filterCorruptedData),
                      map(this.groupByMinutes),
                      map(this.mapToCandles)
                   )
                   .subscribe(
                    candleData =>
                      {
                        this.candles = candleData
                        this.loading = false;
                      }
                   )
  }

  parseCsvStringToArray = (csvString: string) => this.ngxCsvParser.csvStringToArray(csvString,
                                                                                    this.DELIMITER)

  removeHeadersFromArray = (marketData: any[][]) =>  {
      (marketData as any []).shift();
      return marketData;
    }

  mapToMarketData = (marketData: any[]) => marketData.map(md =>
    {
      let date = moment(md[0], 'dd/mm/yyyy hh:mm:ss.SSS').toDate()
      return {
        initialArr: md,
        unixTimeStamp: date.getTime(),
        unixMinutesTimeStamp: (Math.floor(date.getTime() / 1000 / 60)),
        quantity: new Number(md[1]),
        price: new Number(md[2])
      } as MarketData;
    })

  filterCorruptedData = (marketData: MarketData[]) => marketData.filter(md =>
    !isNaN(md.unixMinutesTimeStamp) &&
    !isNaN(md.price) &&
    !isNaN(md.quantity))

  groupByMinutes = (marketData: MarketData[]) => lodash.groupBy(marketData, (md : MarketData) => md.unixMinutesTimeStamp)

  mapToCandles = (grouppedMarketData: any) => {
    return Object.keys(grouppedMarketData).map(
      key => {
        let candleData = grouppedMarketData[key];

        let sortedByTimeAsc = candleData.sort((prev: MarketData, curr: MarketData) => prev.unixTimeStamp - curr.unixTimeStamp)

        let openPrice = sortedByTimeAsc[0].price;
        let closePrice = sortedByTimeAsc[sortedByTimeAsc.length - 1].price;

        let sortedByPrice = candleData.sort((prev: MarketData, curr: MarketData) => prev.price - curr.price)

        let lowPrice = sortedByPrice[0].price;
        let highPrice = sortedByPrice[sortedByPrice.length - 1].price;

        let sumVolume = lodash.sumBy(candleData, 'quantity')

        let date = moment(candleData[0].unixTimeStamp).format('DD/MM/YYYY hh:mm:00');

        let backgroundColor = closePrice > openPrice ? 'green' : 'red';

        return {
          open: openPrice,
          close: closePrice,
          low: lowPrice,
          high: highPrice,
          sumVolume: sumVolume,
          date: date,
          backgroundColor: backgroundColor,
        } as CandleGridItem;
      }
    )
  }
}
