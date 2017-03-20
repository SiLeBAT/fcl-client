import {FclAppPage} from './app.po';

describe('fcl App', () => {
  it('home button text should be "FoodChain-Lab"', () => {
    FclAppPage.navigateTo();
    expect(FclAppPage.getHomeButtonText()).toEqual('FoodChain-Lab');
  });
});
