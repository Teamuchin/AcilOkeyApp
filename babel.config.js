module.exports = function(api) {
    api.cache(true);
    return {
      presets: [
        'babel-preset-expo',
        // This preset handles Flow syntax that some dependencies might use
        '@babel/preset-flow',
      ],
    };
  };