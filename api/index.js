const db = require('../server/db');

let ready = null;
module.exports = async (req, res) => {
  if (!ready) {
    ready = db.init().then(() => require('../server/app'));
  }
  const app = await ready;
  return app(req, res);
};
