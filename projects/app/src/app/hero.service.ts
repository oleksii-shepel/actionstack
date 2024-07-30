import { Injectable } from '@angular/core';

import { Observable, from, tap } from 'rxjs';

import { Store } from '@actioncrew/actionstack';
import { Hero } from './hero';
import { HEROES } from './mock-heroes';

@Injectable({ providedIn: 'root' })
export class HeroService {
  timeout = 200;
  private logSubject = new Subject<string>();
  log$ = this.logSubject.asObservable();

  getHeroes(): Observable<Hero[]> {
    return of(this.heroes).pipe(
      tap(() => this.logSubject.next('HeroService: fetched heroes'))
    );
  }
  constructor(private store: Store) { }

  getHeroes(): Observable<Hero[]> {
    return from(new Promise<Hero[]>((resolve) => {
      setTimeout(() => {
        resolve(HEROES);
      }, this.timeout);
    })).pipe(
      tap(() => this.logSubject.next('HeroService: fetched heroes')))
    );
  }

  getHero(id: number): Observable<Hero> {
    return from(new Promise<Hero>((resolve) => {
      setTimeout(() => {
        const hero = HEROES.find(h => h.id === id)!;
        resolve(hero);
      }, this.timeout);
    })).pipe(
      tap(() => this.logSubject.next(`HeroService: fetched hero id=${id}`)))
    );
  }
}
