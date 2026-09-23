import { beforeEach, describe, expect, it } from 'vitest';
import { canGoBackInApp, markReplace, recordLocation, resetTrail } from './navHistory';

describe('navHistory', () => {
  beforeEach(() => resetTrail());

  it('has nowhere to go back to on the landing page', () => {
    recordLocation('/he/catalog/podium');
    expect(canGoBackInApp()).toBe(false);
  });

  it('can go back after an in-app navigation', () => {
    recordLocation('/he');
    recordLocation('/he/catalog/podium');
    expect(canGoBackInApp()).toBe(true);
  });

  it('never offers an in-app back past the landing page (would leave the site)', () => {
    recordLocation('/he/catalog/podium'); // landed here from a search result
    recordLocation('/he/catalog/podium?sub=smart');
    expect(canGoBackInApp()).toBe(true);
    recordLocation('/he/catalog/podium'); // went back
    expect(canGoBackInApp()).toBe(false);
  });

  it('an "up one level" step replaces the entry, so repeated Back keeps climbing', () => {
    recordLocation('/he/catalog/podium?sub=smart'); // landed directly
    markReplace();
    recordLocation('/he/catalog/podium'); // Back → up to the category
    expect(canGoBackInApp()).toBe(false); // next Back climbs again, never bounces
  });

  it('ignores repeated records of the same URL', () => {
    recordLocation('/he');
    recordLocation('/he');
    expect(canGoBackInApp()).toBe(false);
  });
});
