import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    { provide: 'Flipping', useValue: window['Flipping'] },
    { provide: 'RxCSS', useValue: window['RxCSS'] },
    { provide: 'Hammer', useValue: window['Hammer'] }
],
  bootstrap: [AppComponent]
})
export class AppModule { }
