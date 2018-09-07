import { Component, OnInit, Inject } from '@angular/core';
import { interval, Scheduler, fromEvent } from 'rxjs';
import { animationFrame } from 'rxjs/internal/scheduler/animationFrame';
import { withLatestFrom, scan, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-rxjs-drag',
  templateUrl: './rxjs-drag.component.html',
  styleUrls: ['./rxjs-drag.component.css']
})
export class RxjsDragComponent implements OnInit {
  // Dom nodes
  moveEl = document.querySelector("#js-move");
  VIEWBOX_SIZE = { W: 600, H: 600 };
  animationFrame$ = interval(0, animationFrame);

  constructor(@Inject('Flipping') public Flipping: any,
    @Inject('Hammer') public Hammer: any,
    @Inject('RxCSS') public RxCSS: any) { }

  ngOnInit() {
    //  Make a DOM element move
    const location$ = this.handleDrag(this.moveEl).pipe(startWith([200, 300]));

    location$.pipe(
      map(([x, y]) => ({
        moveElLocation: [x, y] as [any, any]
      }))
    )
      .subscribe(({ moveElLocation }) => {
        this.moveTo(moveElLocation, this.moveEl);
      });
  }

  // For a more detailed explanation see: http://varun.ca/drag-with-rxjs/
  // Create an observable stream to handle drag gesture

  drag({ element, pan$, onStart, onEnd }) {
    const panStart$ = pan$.filter(e => e.type === "panstart");
    const panMove$ = pan$.filter(e => e.type === "panmove");
    const panEnd$ = pan$.filter(e => e.type === "panend");

    return panStart$.switchMap(() => {
      // Get the starting point on panstart
      const { start, w, h } = this.getStartInfo(element);
      onStart();

      // Create observable to handle pan-move 
      // and stop on pan-end
      const move$ = panMove$
        .map(this.scaleToCanvas({ start, w, h }))
        .takeUntil(panEnd$);

      // We can subscribe to move$ and 
      // handle cleanup in the onComplete callback
      move$.subscribe(null, null, onEnd);

      return move$;
    });
  };

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
      pan$,
      onStart: () => element.setAttribute("r", 12 * 2),
      onEnd: () => element.setAttribute("r", 12)
    });

    // Smooth the drag location using lerp
    return this.animationFrame$.pipe(
      withLatestFrom(drag$, (_, p) => p),
      scan(this.lerp(0.05)),
      map(p => [p.x, p.y])
    );
  }

  /**
   * Utils
   */
  getStartInfo(element) {
    const start = {
      x: +element.getAttribute("cx"),
      y: +element.getAttribute("cy")
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
    element.setAttribute("cx", x);
    element.setAttribute("cy", y);
  }
}
