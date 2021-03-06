const request = require('superagent');

const get = (url, callback) => {
  request
    .get(url)
    .end((err, res) => {
      if (err) {
        console.error('Err in util/restHander ', err);
      }
      callback(err, res);
    });
};

const post = (url, data, callback) => {
  request
    .post(url)
    .send(data)
    .end((err, res) => {
      if (err) {
        console.error('Err in util/restHander ', err);
      }
      callback(err, res);
    });
};

const put = (url, data, callback) => {
  request
    .put(url)
    .send(data)
    .end((err, res) => {
      if (err) {
        console.error('Err in util/restHander ', err);
      }
      callback(err, res);
    });
};

const del = (url, data, callback) => {
  request
    .del(url)
    .send(data)
    .end((err, res) => {
      if (err) {
        console.error('Err in util/restHander ', err);
      }
      callback(err, res);
    });
};

export default {
  get: get,
  post: post,
  put: put,
  del: del
};
