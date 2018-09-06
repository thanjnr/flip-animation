import { Component, Inject, OnInit, ViewChild, ViewChildren, AfterViewInit } from '@angular/core';
import { Scheduler, interval, fromEventPattern, merge } from 'rxjs';
import { map, startWith, scan, share } from 'rxjs/operators';
import { AppState } from '../app-state';

@Component({
  selector: 'app-swipeable-pages',
  templateUrl: './swipeable-pages.component.html',
  styleUrls: ['./swipeable-pages.component.scss']
})
export class SwipeablePagesComponent implements OnInit, AfterViewInit {
  title = 'flip-animation';
  @ViewChild('app') app;
  @ViewChild('uiNav') nav;
  @ViewChildren('uiNavItem') navItems;

  colors = {
    0: ['#2F6692', '#231133'],
    1: ['#9A45DB', '#4D88DB'],
    2: ['#FB2474', '#934CDB'],
    3: ['#FB9C2C', '#FD2472'],
    4: ['#D8D6CD', '#FD9722'],
  };

  machine = {
    START: {
      panup: 'NAV1',
      pandown: 'START',
    },
    NAV1: {
      panup: 'NAV2',
      pandown: 'START',
    },
    NAV2: {
      pandown: 'NAV1',
      panup: 'NAV2',
    }
  };

  constructor(@Inject('Flipping') public Flipping: any,
    @Inject('Hammer') public Hammer: any,
    @Inject('RxCSS') public RxCSS: any) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.setupApp();
  }

  private setupApp() {
    console.log(this.nav);
    console.log(this.app);
    console.log(this.navItems);
    let nativeApp = this.app.nativeElement;
    let nativeNav = this.nav.nativeElement;
    let nativeNavItems = this.navItems._results.map((item) => item.nativeElement);

    const appRect = nativeApp.getBoundingClientRect();

    const log = console.log.bind(console);
    const mapValues = (obj, iteratee) => {
      const res = {};
      Object.keys(obj).forEach(key => res[key] = iteratee(obj[key], key, obj));

      return res;
    }

    this.RxCSS.set(nativeApp, {
      colors: this.colors,
    });

    const hNav = new this.Hammer(nativeNav, {
      direction: this.Hammer.DIRECTION_ALL,
    });

    hNav.get('pan')
      .set({ direction: this.Hammer.DIRECTION_ALL });

    const panMapping = map((event: any) => ({
      key: +event.target.getAttribute('data-key'),
      type: event.type,
      deltaX: event.deltaX,
      deltaY: event.deltaY
    }))

    const pan$ = panMapping(fromEventPattern(h => hNav.on('panstart panup pandown panleft panright panend', h)));

    const initialState = {
      appState: 'START',
      panning: false,
      x: 0,
      dx: 0,
      n: undefined,
    };

    const af$ = interval(0, Scheduler['animationframe']);

    const Flipper = new this.Flipping({
      onFlip: ({ key, delta, node }) => this.RxCSS.set(node, { delta })
    });

    const flipMapping = map((flip: any) => ({ type: 'flip', deltas: flip }));
    const flip$ = flipMapping(fromEventPattern(h => Flipper.on('flip', h)));

    const action$ = merge(pan$);

    const setNthItemClass = (n) => {
      const navItem = nativeNavItems[n - 1];
      const prevNavItem = nativeNavItems[n - 2];

      const currActive = document.querySelector('.ui-nav-item.active');
      const currPrevActive = document.querySelector('.ui-nav-item.prev-active');
      if (currActive === navItem) return;

      currActive && currActive.classList.remove('active');
      currPrevActive && currPrevActive.classList.remove('prev-active');

      navItem.classList.add('active');
      prevNavItem && prevNavItem.classList.add('prev-active');
    };

    const state$ = action$.pipe(
      startWith(initialState),
      scan((state: AppState, action) => this.determineState(state, action)),
      share()
    );

    state$.subscribe((state: AppState) => {
      const end = state.type === 'panend';

      if (end) {
        nativeNavItems.forEach(item => this.RxCSS.set(item, { delta: { top: 0, left: 0 } }));
      }

      nativeNav.style
        .setProperty('--nav-panning', +state.panning);

      if (state.changed) {
        Flipper.read();
        if (state.pending) {
          nativeApp.setAttribute('data-pending', 'true');
        } else {
          nativeApp.removeAttribute('data-pending');
        }
        nativeApp.setAttribute('data-state', state.appState);
        nativeApp.setAttribute('data-prev-state', state.prevState);

        Flipper.flip();
      }

      if (!state.pending) {
        nativeApp.removeAttribute('data-pending');
      }

      if (state.n) setNthItemClass(state.n);

      const px = state.dx / appRect.width;
      this.RxCSS.set(document.body, {
        gradient: this.colors[state.n || 0],
        pending: state.pending,
        'not-pending': !state.pending,
        panning: state.panning,
        'not-panning': !state.panning,
        n: state.n,
        x: `-${(state.n - 1) * 100}%`,
        dx: state.dx,
        dy: state.dy,
        px,
        'px-abs': Math.abs(state.dx / appRect.width),
        py: !state.prevState ? 0 : state.dy / {
          START: { NAV1: 75 },
          NAV1: { START: -75, NAV2: 75 },
          NAV2: { NAV1: -75 }
        }[state.prevState][state.appState],
      });
    });
  }

  determineState(state: AppState, action: any) {
    const clamp = (min, max) => val => Math.min(Math.max(min, val), max);
    let panning = {
      'panstart': true,
      'panend': false,
    }[action.type];
    if (panning === undefined) panning = state.panning;

    if (action.type === 'panstart' && state.appState === 'START') {
      return {
        ...state,
        n: action.key,
        direction: 'y',
      }
    }
    
    if (!state.pending && (action.type === 'panup' || action.type === 'pandown') && state.direction !== 'x') {
      return {
        ...state,
        prevState: state.appState,
        appState: this.machine[state.appState][action.type],
        direction: 'y',
        pending: true,
        panning: true,
        changed: true,
      }
    }

    if (state.pending && (action.type === 'panup' || action.type === 'pandown')) {
      let dy = state.dy;
      if (state.appState === 'NAV1' && state.prevState === 'START') {
        dy = clamp(-75, 0)(action.deltaY);
      } else if (state.appState === 'NAV1' && state.prevState === 'NAV2') {
        dy = clamp(0, 75)(action.deltaY);
      } else if (state.appState === 'NAV2') {
        dy = clamp(-75, 100)(action.deltaY);
      } else if (state.appState === 'START') {
        dy = clamp(0, 75)(action.deltaY);
      }

      return {
        ...state,
        dy,
      };
    }

    let n = state.n;
    if (action.type === 'panend') {
      if (state.appState === 'START') {
        n = undefined;
      } else if (state.dx > 100) {
        n = n - 1;
      } else if (state.dx < -100) {
        n = n + 1;
      }

      return {
        ...state,
        n: clamp(1, 4)(n),
        dx: 0,
        dy: 0,
        type: action.type,
        pending: false,
        panning: false,
        changed: false,
        direction: undefined,
      } as AppState
    }

    const direction = action.type === 'panend'
      ? undefined
      : state.direction
      || {
        panleft: 'x',
        panright: 'x',
        panup: 'y',
        pandown: 'y',
        panend: undefined,
      }[action.type];

    return {
      ...state,
      n,
      direction,
      panning,
      type: action.type,
      x: action.type === 'panend'
        ? 0
        : state.x,
      dx: (action.type === 'panend' || direction === 'y')
        ? 0
        : action.deltaX || state.dx,
      dy: (action.type === 'panend' || direction === 'x')
        ? 0
        : action.deltaY || state.dy,
    }
  }
}
