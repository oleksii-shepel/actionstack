import { Component } from '@angular/core';
import { HeroService } from '../hero.service'; // Assuming this path

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent {
  messages: string[] = [];

  constructor(private heroService: HeroService) {}

  ngOnInit() {
    // Subscribe to HeroService log stream (if available)
    this.heroService.log$.subscribe(message => {
      this.messages.push(message);
    });
  }
}
