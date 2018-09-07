import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { SwipeableCardsComponent } from './swipeable-cards/swipeable-cards.component';
import { SwipeablePagesComponent } from './swipeable-pages/swipeable-pages.component';
import { RxjsDragComponent } from './rxjs-drag/rxjs-drag.component';

export const appRoutes: Routes = [
  { path: 'swipe-card', component: SwipeableCardsComponent },
  { path: 'swipe-page', component: SwipeablePagesComponent },
  { path: 'drag-rx', component: RxjsDragComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    SwipeableCardsComponent,
    SwipeablePagesComponent,
    RxjsDragComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    )
  ],
  providers: [
    { provide: 'Flipping', useValue: window['Flipping'] },
    { provide: 'RxCSS', useValue: window['RxCSS'] },
    { provide: 'Hammer', useValue: window['Hammer'] }
],
  bootstrap: [AppComponent]
})
export class AppModule { }
