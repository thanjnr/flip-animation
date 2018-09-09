import { Component, OnInit, Inject, AfterViewInit, NgZone, ViewChild, ElementRef, ViewChildren } from '@angular/core';
import { interval, Scheduler, fromEvent } from 'rxjs';
import { animationFrame } from 'rxjs/internal/scheduler/animationFrame';
import { withLatestFrom, scan, map, startWith, filter, switchMap, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { CardState } from './card-state';

@Component({
  selector: 'app-swipeable-cards',
  templateUrl: './swipeable-cards.component.html',
  styleUrls: ['./swipeable-cards.component.css']
})
export class SwipeableCardsComponent implements OnInit, AfterViewInit {
  @ViewChild('justmove') card: ElementRef;
  @ViewChildren('card') cards;
  VIEWBOX_SIZE = { W: 600, H: 600 };
  animationFrame$ = interval(0, animationFrame);
  currentState: CardState;

  constructor(private zone: NgZone,
    @Inject('Flipping') public Flipping: any,
    @Inject('Hammer') public Hammer: any,
    @Inject('RxCSS') public RxCSS: any) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    const cardNative = this.card.nativeElement;

    const location$ = this.handleDrag(cardNative);

    location$.subscribe((cardState: CardState) => {
      this.zone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          // console.log('moving...');
          this.moveTo(cardState, cardNative);
        })
      });
    },
      null,
      (e) => { console.log(e); });
    new Cards();
  }

  /**
   * Generate the drag handler for a DOM element
   */
  handleDrag(element) {
    // Create a new Hammer Manager
    const hammerPan = new this.Hammer(element, {
      direction: this.Hammer.DIRECTION_ALL
    });

    hammerPan.get("pan").set({ direction: this.Hammer.DIRECTION_ALL });

    // Convert hammer events to an observable
    const pan$ = fromEvent(hammerPan, "panstart panmove panend");
    // alternatively you can use fromEventPattern:
    // const pan$ = Rx.Observable.fromEventPattern(h =>
    //   hammerPan.on('panstart panmove panend', h),
    // );

    const drag$ = this.drag({
      element: element,
      pan$
    });

    // Smooth the drag location using lerp
    return drag$;
  }

  // For a more detailed explanation see: http://varun.ca/drag-with-rxjs/
  // Create an observable stream to handle drag gesture

  drag({ element, pan$ }) {
    const panStart$ = pan$.pipe(filter((e: any) => e.type === "panstart"));
    const panMove$ = pan$.pipe(filter((e: any) => e.type === "panmove"));
    const panEnd$ = pan$.pipe(filter((e: any) => e.type === "panend"),
      map((e) => {
        console.log('ending...');
        this.onEnd(e, element);
        return e;
      }));

    return panStart$.pipe(switchMap((e) => {
      // Get the starting point on panstart
      const cardState = this.getStartInfo(element, e);
      this.zone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          element.style.willChange = 'transform';
        })
      });

      // Create observable to handle pan-move 
      // and stop on pan-end
      const move$ = panMove$.pipe(
        map((e: any) => {
          // console.log(e.srcEvent.pageX);
          cardState.currentX = e.srcEvent.pageX || e.srcEvent.touches[0].pageX;
          cardState.screenX = cardState.currentX - cardState.startX;
          this.currentState = cardState;
          return cardState;
        }),
        takeUntil(panEnd$)
      );

      return move$;
    }));
  };

  onEnd(evt, element) {console.log(evt);
    this.currentState.targetX = 0;
    let screenX = this.currentState.currentX - this.currentState.startX;
    const threshold = this.currentState.targetBCR.width * 0.35;
    if (Math.abs(screenX) > threshold) {
      this.currentState.targetX = (screenX > 0) ?
        this.currentState.targetBCR.width :
        -this.currentState.targetBCR.width;
    }
    console.log(this.currentState);
    console.log(Math.abs(this.currentState.screenX));
    this.currentState.screenX += (this.currentState.targetX - this.currentState.screenX) / 4;
    
    this.moveTo(this.currentState, element);
  }
  /**
   * Utils
   */
  getStartInfo(element, event) {
    return {
      startX: event.srcEvent.pageX || event.srcEvent.touches[0].pageX,
      currentX: event.srcEvent.pageX || event.srcEvent.touches[0].pageX,
      draggingCard: true,
      target: element,
      targetBCR: element.getBoundingClientRect(),
      screenX: 0
    } as CardState;
  }

  moveTo(cardState: CardState, element) {
    const normalizedDragDistance =
      (Math.abs(cardState.screenX) / cardState.targetBCR.width);
    const opacity = 1 - Math.pow(normalizedDragDistance, 3);
    element.style.transform = `translateX(${cardState.screenX}px)`;
    element.style.opacity = opacity;

    const isNearlyAtStart = (Math.abs(cardState.screenX) < 0.1);
    const isNearlyInvisible = (opacity < 0.01);

    // If the card is nearly gone.
    if (isNearlyInvisible) {
      console.log('removing element');

      // Bail if there's no target or it's not attached to a parent anymore.
      if (!element || !element.parentNode)
        return;

      element.parentNode.removeChild(element);

      const targetIndex = 0; // this.cards.indexOf(element);
      this.cards._results.splice(targetIndex, 1);

      // Slide all the other cards.
      // this.animateOtherCardsIntoPosition(targetIndex);

    } else if (isNearlyAtStart) {
      this.resetTarget(element);
    }
  }

  resetTarget(element) {
    if (!element)
      return;

    element.style.willChange = 'initial';
    element.style.transform = 'none';
    element = null;
  }

}

export class Cards {
  cards;
  targetBCR = null;
  target = null;
  startX = 0;
  currentX = 0;
  screenX = 0;
  targetX = 0;
  draggingCard = false;

  constructor() {
    this.cards = Array.from(document.querySelectorAll('.card'));

    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.update = this.update.bind(this);
    this.targetBCR = null;
    this.target = null;
    this.startX = 0;
    this.currentX = 0;
    this.screenX = 0;
    this.targetX = 0;
    this.draggingCard = false;

    this.addEventListeners();

    requestAnimationFrame(this.update);
  }

  addEventListeners() {
    document.addEventListener('touchstart', this.onStart);
    document.addEventListener('touchmove', this.onMove);
    document.addEventListener('touchend', this.onEnd);

    document.addEventListener('mousedown', this.onStart);
    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseup', this.onEnd);
  }

  onStart(evt) {
    if (this.target)
      return;

    if (!evt.target.classList.contains('card'))
      return;

    this.target = evt.target;
    this.targetBCR = this.target.getBoundingClientRect();

    this.startX = evt.pageX || evt.touches[0].pageX;
    this.currentX = this.startX;

    this.draggingCard = true;
    this.target.style.willChange = 'transform';

    evt.preventDefault();
  }

  onMove(evt) {
    if (!this.target)
      return;

    this.currentX = evt.pageX || evt.touches[0].pageX;
  }

  onEnd(evt) {
    if (!this.target)
      return;

     this.targetX = 0;
     let screenX = this.currentX - this.startX;
     const threshold = this.targetBCR.width * 0.35;
     if (Math.abs(screenX) > threshold) {
       this.targetX = (screenX > 0) ?
         this.targetBCR.width :
         -this.targetBCR.width;
     }
 
     this.draggingCard = false;
  }

  update() {

    requestAnimationFrame(this.update);

    if (!this.target)
      return;

    if (this.draggingCard) {
      this.screenX = this.currentX - this.startX;
    } else {
      this.screenX += (this.targetX - this.screenX) / 4;
    }

    const normalizedDragDistance =
      (Math.abs(this.screenX) / this.targetBCR.width);
    const opacity = 1 - Math.pow(normalizedDragDistance, 3);

    this.target.style.transform = `translateX(${this.screenX}px)`;
    this.target.style.opacity = opacity;

    // User has finished dragging.
    if (this.draggingCard)
      return;

    const isNearlyAtStart = (Math.abs(this.screenX) < 0.1);
    const isNearlyInvisible = (opacity < 0.01);

    // If the card is nearly gone.
    if (isNearlyInvisible) {

      // Bail if there's no target or it's not attached to a parent anymore.
      if (!this.target || !this.target.parentNode)
        return;

      this.target.parentNode.removeChild(this.target);

      const targetIndex = this.cards.indexOf(this.target);
      this.cards.splice(targetIndex, 1);

      // Slide all the other cards.
      this.animateOtherCardsIntoPosition(targetIndex);

    } else if (isNearlyAtStart) {
      this.resetTarget();
    }
  }

  animateOtherCardsIntoPosition(startIndex) {
    // If removed card was the last one, there is nothing to animate.
    // Remove the target.
    if (startIndex === this.cards.length) {
      this.resetTarget();
      return;
    }

    const onAnimationComplete = evt => {
      const card = evt.target;
      card.removeEventListener('transitionend', onAnimationComplete);
      card.style.transition = '';
      card.style.transform = '';

      this.resetTarget();
    };

    // Set up all the card animations.
    for (let i = startIndex; i < this.cards.length; i++) {
      const card = this.cards[i];

      // Move the card down then slide it up.
      card.style.transform = `translateY(${this.targetBCR.height + 20}px)`;
      card.addEventListener('transitionend', onAnimationComplete);
    }

    // Now init them.
    requestAnimationFrame(_ => {
      for (let i = startIndex; i < this.cards.length; i++) {
        const card = this.cards[i];

        // Move the card down then slide it up, with delay according to "distance"
        card.style.transition = `transform 150ms cubic-bezier(0,0,0.31,1) ${i * 50}ms`;
        card.style.transform = '';
      }
    });
  }

  resetTarget() {
    if (!this.target)
      return;

    this.target.style.willChange = 'initial';
    this.target.style.transform = 'none';
    this.target = null;
  }

}
