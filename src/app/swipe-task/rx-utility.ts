import { fromEvent, timer, empty } from "rxjs";
import { map, tap, merge, concatMap, first, takeUntil, elementAt, catchError, filter } from "rxjs/operators";

/*********
* RxJS utility
**********/
export const util = (() => {
    /* Using RxJS for creating new aggregated events for complex user interactions,
     * like vertical / horizontal swipes, short clicks and hold than drag events 
     * on a single DOM item based on the basic mouse and touch events.
     */
    function getDragObservables(domItem) {
        const preventDefault = event => {
            if (event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA") event.preventDefault();
        }
        const mouseEventToCoordinate = mouseEvent => {
            preventDefault(mouseEvent);
            return { x: mouseEvent.clientX, y: mouseEvent.clientY };
        };
        const touchEventToCoordinate = touchEvent => {
            preventDefault(touchEvent);
            return { x: touchEvent.changedTouches[0].clientX, y: touchEvent.changedTouches[0].clientY };
        };

        let mouseDowns = fromEvent(domItem, "mousedown").pipe(map(mouseEventToCoordinate), tap(() => console.log('mouse down')));
        let mouseMoves = fromEvent(window, "mousemove").pipe(map(mouseEventToCoordinate), tap(() => console.log('mouse move')));
        let mouseUps = fromEvent(window, "mouseup").pipe(map(mouseEventToCoordinate), tap(() => console.log('mouse up')));

        let touchStarts = fromEvent(domItem, "touchstart").pipe(map(touchEventToCoordinate), tap(() => console.log('touch start')));
        let touchMoves = fromEvent(domItem, "touchmove").pipe(map(touchEventToCoordinate), tap(() => console.log('touch move')));
        let touchEnds = fromEvent(window, "touchend").pipe(map(touchEventToCoordinate), tap(() => console.log('touch end')));
        let touchCancels = fromEvent(window, "touchcancel").pipe(map(touchEventToCoordinate), tap(() => console.log('touch cancel')));

        let _starts = mouseDowns.pipe(merge(touchStarts));
        let _moves = mouseMoves.pipe(merge(touchMoves));
        let _ends = mouseUps.pipe(merge(touchEnds), merge(touchCancels));

        const HOLDING_PERIOD = 600; // milliseconds

        // Clicks: Take the start-end pairs only if no more than 3 move events happen in between, and the end event is within the holding period
        let clicks = _starts.pipe(concatMap((dragStartEvent) =>
            _ends.pipe(first(),
                takeUntil(_moves.pipe(elementAt(3))),
                takeUntil(timer(HOLDING_PERIOD)),
                tap(() => console.log('click')),
                catchError(err => empty())
            )
        ));

        // Holds: Take those starts where no end event and no more than 3 move event occurs during the holding period
        let holds = _starts.pipe(concatMap(dragStartEvent =>
            timer(HOLDING_PERIOD).pipe(
                takeUntil(_moves.pipe(elementAt(3))),
                takeUntil(_ends),
                map(() => ({ x: dragStartEvent.x, y: dragStartEvent.y })),
                tap(() => console.log('hold')),
                catchError(err => empty())
            )
        ));

        // Move starts with direction: Pair the move start events with the 3rd subsequent move event,
        // but only if it happens during the holdign period and no end event happens in between
        let moveStartsWithDirection = _starts.pipe(concatMap(dragStartEvent =>
            _moves.pipe(
                takeUntil(_ends),
                takeUntil(timer(HOLDING_PERIOD)),
                elementAt(3),
                catchError(err => empty()),
                map(dragEvent => {
                    const intialDeltaX = dragEvent.x - dragStartEvent.x;
                    const initialDeltaY = dragEvent.y - dragStartEvent.y;
                    return { x: dragStartEvent.x, y: dragStartEvent.y, intialDeltaX, initialDeltaY };
                })
            )
        ));

        // Vertical move starts: Keep only those move start events where the 3rd subsequent move event is rather vertical than horizontal
        let verticalMoveStarts = moveStartsWithDirection.pipe(
            filter((dragStartEvent: any) => Math.abs(dragStartEvent.intialDeltaX) < Math.abs(dragStartEvent.initialDeltaY)), 
            tap(() => console.log('vertical move starts'))
        );

        // Horizontal move starts: Keep only those move start events where the 3rd subsequent move event is rather horizontal than vertical
        let horizontalMoveStarts = moveStartsWithDirection.pipe(
            filter((dragStartEvent: any) => Math.abs(dragStartEvent.intialDeltaX) >= Math.abs(dragStartEvent.initialDeltaY)),
            tap(() => console.log('horizontal move starts'))
        );

        // Take the moves until an end occurs
        const movesUntilEnds = dragStartEvent =>
            _moves.pipe(
                takeUntil(_ends),
                map(dragEvent => {
                const x = dragEvent.x - dragStartEvent.x;
                const y = dragEvent.y - dragStartEvent.y;
                return { x, y };
            }));

        let verticalMoves = verticalMoveStarts.pipe( concatMap(movesUntilEnds), tap(() => console.log('vertical move')) );
        let horizontalMoves = horizontalMoveStarts.pipe( concatMap(movesUntilEnds), tap(() => console.log('horizontal move')) );
        let dragMoves = holds.pipe( concatMap(movesUntilEnds), tap(() => console.log('dragging')) );

        const lastMovesAtEnds = dragStartEvent =>
            _ends.pipe(
                first(),
                map(dragEndEvent => {
                console.log(dragStartEvent, dragEndEvent);
                const x = dragEndEvent.x - dragStartEvent.x;
                const y = dragEndEvent.y - dragStartEvent.y;
                return { x, y };
            }) );

        let ends = _starts.pipe( concatMap(lastMovesAtEnds) );
        let verticalMoveEnds = verticalMoveStarts.pipe( concatMap(lastMovesAtEnds), tap(() => console.log('vertical move end')) );
        let horizontalMoveEnds = horizontalMoveStarts.pipe( concatMap(lastMovesAtEnds), tap(() => console.log('horizontal move end')) );
        let dragMoveEnds = holds.pipe( concatMap(lastMovesAtEnds), tap(() => console.log('dragging end')) );

        return {
            clicks, holds,
            verticalMoveStarts, horizontalMoveStarts,
            verticalMoves, horizontalMoves,
            verticalMoveEnds, horizontalMoveEnds,
            dragMoves, dragMoveEnds
        };
    }

    return { getDragObservables };
})();