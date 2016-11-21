
module.exports = function visionResponse(data, count, status, desc) {

  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  res.status(status);

  return res.json({
    data: data,
    count: count,
    status: status, 
    desc: desc
  });

};
