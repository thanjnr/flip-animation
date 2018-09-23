import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StoreModule } from '@ngrx/store';

import { AppComponent } from './app.component';
import { SwipeableCardsComponent } from './swipeable-cards/swipeable-cards.component';
import { SwipeablePagesComponent } from './swipeable-pages/swipeable-pages.component';
import { RxjsDragComponent } from './rxjs-drag/rxjs-drag.component';
import { SwipeTaskComponent } from './swipe-task/swipe-task.component';
import { itemReducer, colorReducer, editReducer } from './swipe-task/swipe-task-store';
import { TaskListComponent } from './swipe-task/task-list.component';
import { TaskItemComponent } from './swipe-task/task-item';
import { TaskInputComponent } from './swipe-task/task-input';
import { SwipeablePagesConsumerComponent } from './swipeable-pages-consumer/swipeable-pages-consumer.component';
import { MoviesComponent } from './movies/movies.component';
import { ArticleComponent } from './article/article.component';

export const appRoutes: Routes = [
  { path: 'swipe-card', component: SwipeableCardsComponent },
  { path: 'swipe-page', component: SwipeablePagesComponent },
  { path: 'swipe-page-consumer', component: SwipeablePagesConsumerComponent },
  { path: 'drag-rx', component: RxjsDragComponent },
  { path: 'swipe-rx', component: SwipeTaskComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    SwipeableCardsComponent,
    SwipeablePagesComponent,
    RxjsDragComponent,
    SwipeTaskComponent,
    TaskListComponent,
    TaskItemComponent,
    TaskInputComponent,
    SwipeablePagesConsumerComponent,
    MoviesComponent,
    ArticleComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(
      appRoutes,
      // { enableTracing: true } // <-- debugging purposes only
    ),
    StoreModule.forRoot({
      items: itemReducer,
      colors: colorReducer,
      currentEdit: editReducer
  }),
  ],
  providers: [
    { provide: 'Flipping', useValue: window['Flipping'] },
    { provide: 'RxCSS', useValue: window['RxCSS'] },
    { provide: 'Hammer', useValue: window['Hammer'] }
],
  bootstrap: [AppComponent]
})
export class AppModule { }
