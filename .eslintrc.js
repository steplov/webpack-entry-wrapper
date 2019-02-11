module.exports = {
  extends: 'airbnb-base',
  rules: {
    'no-underscore-dangle': 0,
    'comma-dangle': [2, 'never']
  },
  env: {
    node: true,
    jest: true
  }
};
