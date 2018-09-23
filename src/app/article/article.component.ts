import {
  AfterViewInit,
  Component,
  EmbeddedViewRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
  Input
} from '@angular/core';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss']
})
export class ArticleComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() datakey: string;
  @ViewChild('article') portalActionsTmplRef;
  private disposeFn: () => void;
  private viewRef: EmbeddedViewRef<{}>;

  constructor(private viewContainerRef: ViewContainerRef) {}

  ngOnInit() {}

  ngAfterViewInit(): void {
    // render the view
    this.viewRef = this.viewContainerRef.createEmbeddedView(
      this.portalActionsTmplRef
    );
    this.viewRef.detectChanges();

    // grab the DOM element
    const outletElement = document.querySelector('#articles-container');

    // attach the view to the DOM element that matches our selector
    this.viewRef.rootNodes.forEach(rootNode =>
      outletElement.appendChild(rootNode)
    );

    // register a dispose fn we can call later
    // to remove the content from the DOM again
    this.disposeFn = () => {};
  }

  ngOnDestroy(): void {
    const index = this.viewContainerRef.indexOf(this.viewRef);
    if (index !== -1) {
      this.viewContainerRef.remove(index);
    }
  }
}
