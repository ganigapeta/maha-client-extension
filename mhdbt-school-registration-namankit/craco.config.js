module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.externals = {
        react: 'React',
        'react-dom': 'ReactDOM'
      };
      return webpackConfig;
    }
  }
};