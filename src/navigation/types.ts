export type RootTabParamList = {
    Search: undefined; // 'Search' screen takes no parameters
    MyGames: undefined; // 'MyGames' screen takes no parameters
    Messages: undefined; // 'Messages' screen takes no parameters
    // If a screen took parameters, it would look like:
    // GameDetails: { gameId: string; };
  };
  declare global {
    namespace ReactNavigation {
      interface RootParamList extends RootTabParamList {}
    }
  }
  