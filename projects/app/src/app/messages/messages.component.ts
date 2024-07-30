import { Component } from '@angular/core';
import { HeroService } from '../hero.service'; // Assuming this path
import { Observable, startWith, scan, switchMap } from 'rxjs';
@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent {
  messages$: Observable<string []>;
  clearSubject$ = new Subject<void>();
  constructor(private heroService: HeroService) {}

  ngOnInit() {
    this.messages$ = this.clearSubject$.pipe(
      startWith(null),
      switchMap(() => this.heroService.log$.pipe(
        scan((acc, message) => [...acc, message], [] as string[]),
      ))
    );
  }
  clearMessages() {
    this.clearSubject$.next();
  }
}
