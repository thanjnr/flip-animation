import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-swipeable-pages-consumer',
  templateUrl: './swipeable-pages-consumer.component.html',
  styleUrls: ['./swipeable-pages-consumer.component.css']
})
export class SwipeablePagesConsumerComponent implements OnInit {
  colors = {
    0: ['#992fc7', '#6b0f93'],
    1: ['#b963df', '#6b0f93'],
    2: ['#FB2474', '#934CDB'],
    3: ['#FB9C2C', '#FD2472'],
    4: ['#D8D6CD', '#FD9722'],
  };
  titles = ['Highlights', 'Science', 'Gaming', 'Movies'];

  constructor() { }

  ngOnInit() {
  }

}
