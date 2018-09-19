import { Component, OnInit, Inject, AfterViewInit, NgZone, ViewChild, ElementRef } from '@angular/core';
import { interval, Scheduler, fromEvent } from 'rxjs';
import { animationFrame } from 'rxjs/internal/scheduler/animationFrame';
import { withLatestFrom, scan, map, startWith, filter, switchMap, takeUntil, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-rxjs-drag',
  templateUrl: './rxjs-drag.component.html',
  styleUrls: ['./rxjs-drag.component.css']
})
export class RxjsDragComponent implements OnInit, AfterViewInit {
  @ViewChild('justmove') circle: ElementRef;
  VIEWBOX_SIZE = { W: 600, H: 600 };
  animationFrame$ = interval(0, animationFrame);

  constructor(private zone: NgZone,
    @Inject('Flipping') public Flipping: any,
    @Inject('Hammer') public Hammer: any,
    @Inject('RxCSS') public RxCSS: any) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    // Dom nodes
    const moveEl = document.querySelector('#js-move');
    const location$ = this.handleDrag(moveEl).pipe(startWith([200, 300]));

    location$.pipe(
      map(([x, y]) => ({
        moveElLocation: [x, y] as [any, any]
      })),
      distinctUntilChanged((a, b) => a.moveElLocation[0] === b.moveElLocation[0] &&
      a.moveElLocation[1] === b.moveElLocation[1]
      )
    )
      .subscribe(({ moveElLocation }) => {
        this.zone.runOutsideAngular(() => {
          requestAnimationFrame(() => {
            console.log('moving...');
            this.moveTo(moveElLocation, moveEl);
          });
        });
      });
  }

  /**
   * Generate the drag handler for a DOM element
   */
  handleDrag(element) {
    // Create a new Hammer Manager
    const hammerPan = new this.Hammer(element, {
      direction: this.Hammer.DIRECTION_ALL
    });

    hammerPan.get('pan').set({ direction: this.Hammer.DIRECTION_ALL });

    // Convert hammer events to an observable
    const pan$ = fromEvent(hammerPan, 'panstart panmove panend');
    // alternatively you can use fromEventPattern:
    // const pan$ = Rx.Observable.fromEventPattern(h =>
    //   hammerPan.on('panstart panmove panend', h),
    // );

    const drag$ = this.drag({
      element: element,
      pan$,
      onStart: () => element.setAttribute('r', 12 * 2),
      onEnd: () => element.setAttribute('r', 12)
    });

    // Smooth the drag location using lerp
    return this.animationFrame$.pipe(
      withLatestFrom(drag$, (_, p) => p),
      scan(this.lerp(0.05)),
      map(p => [p.x, p.y])
    );
  }

  // For a more detailed explanation see: http://varun.ca/drag-with-rxjs/
  // Create an observable stream to handle drag gesture

  drag({ element, pan$, onStart, onEnd }) {
    const panStart$ = pan$.pipe(filter((e: any) => e.type === 'panstart'));
    const panMove$ = pan$.pipe(filter((e: any) => e.type === 'panmove'));
    const panEnd$ = pan$.pipe(filter((e: any) => e.type === 'panend'));

    return panStart$.pipe(switchMap(() => {
      // Get the starting point on panstart
      const { start, w, h } = this.getStartInfo(element);
      onStart();

      // Create observable to handle pan-move
      // and stop on pan-end
      const move$ = panMove$.pipe(
        map(this.scaleToCanvas({ start, w, h })),
        takeUntil(panEnd$)
      );

      // We can subscribe to move$ and
      // handle cleanup in the onComplete callback
      move$.subscribe(null, null, onEnd);

      return move$;
    }));
  }

  /**
   * Utils
   */
  getStartInfo(element) {
    const start = {
      x: +element.getAttribute('cx'),
      y: +element.getAttribute('cy')
    };
    const w = document.body.clientWidth;
    const h = document.body.clientHeight;
    return { start, w, h };
  }

  scaleToCanvas({ start: { x, y }, w, h }) {
    // Scale to account for SVG canvas with preserveAspectRatio="xMidYMid slice"
    const svgW = w > h ? this.VIEWBOX_SIZE.W : this.VIEWBOX_SIZE.W * w / h;
    const svgH = w > h ? this.VIEWBOX_SIZE.H * h / w : this.VIEWBOX_SIZE.H;

    return e => ({
      x: x + this.mapFromToRange(e.deltaX, 0, w, 0, svgW),
      y: y + this.mapFromToRange(e.deltaY, 0, h, 0, svgH)
    });
  }

  mapFromToRange(x, x1, x2, y1, y2) {
    return (x - x1) * ((y2 - y1) / (x2 - x1)) + y1;
  }

  /**
   * Lerp
   * based on @davidkpiano's RXCSS
   * https://github.com/davidkpiano/RxCSS/blob/7817e419c98b1564195479f8b5e9c5dffb989f84/src/lerp.js
   */
  lerp(rate) {
    return ({ x, y }, targetValue) => {
      const mapValue = (value, tValue) => {
        const delta = (tValue - value) * rate;
        return value + delta;
      };

      return {
        x: mapValue(x, targetValue.x),
        y: mapValue(y, targetValue.y)
      };
    };
  }

  moveTo([x, y], element) {
    // this.circle.nativeElement.setAttribute("cx", x);
    // this.circle.nativeElement.setAttribute("cy",y);
     element.setAttribute('cx', x);
    element.setAttribute('cy', y);
  }
}
