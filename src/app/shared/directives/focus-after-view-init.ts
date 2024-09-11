import {Directive, ElementRef, AfterViewInit} from '@angular/core';

@Directive({
  selector: '[fclFocusAfterViewInit]',
})
export class FocusAfterViewInitDirective implements AfterViewInit {
  constructor(private hostElement: ElementRef) {}

  // lifecycle hooks start

  ngAfterViewInit(): void {
    setTimeout(() => this.hostElement.nativeElement.focus(), 0);
  }
  // lifecycle hooks end
}
