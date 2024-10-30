import { Component } from '@angular/core';
import { CandleGridComponent } from './candle-grid-component/candle-grid.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CandleGridComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'fluent-trade-test';
}
