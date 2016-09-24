module.exports = function kendoResponse(data, count) {
  var res = this.res;

  res.status(200);

  return res.json({
    data: data,
    count: count
  });
};
