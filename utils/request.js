module.exports = function(option) {
  let app = getApp() || this;
  option.data = option.data || {};
  option.data = {
    version: app.Data.version || '',
    person_id: app.Data.person.person_id || '',
    person_token: app.Data.person.person_token || '',
    SN: app.Data.SN || app.Data.person.per_phone || '',
    ...option.data
  };
  if (!/^http/.test(option.url)) {
    option.url = 'https://' + app.Data.config.API_URL + (app.Data.mock ? '/mock' : '') + option.url;
  }
  console.log(option.method || 'GET', option.url, option.data)
  wx.request({
    url: option.url,
    headers: option.headers || { 'content-type': 'application/json' },
    method: option.method || 'GET',
    data: option.data,
    timeout: option.timeout || 30000,
    dataType: option.dataType || 'json',
    success: function (res) {
      wx.hideLoading();
      if(res.statusCode != 200){
        wx.showToast({ icon:'none', title: '服务器错误！' + res.data.message, showCancel: false })
        app.order.clearStatus();
        option.fail && option.fail(res);
      }else{
        option.success && option.success(res.data);
      }
    },
    fail: function (err) {
      wx.hideLoading();
      wx.showToast({ icon:'none', title: '服务器错误！', showCancel: false })
      app.order.clearStatus();
      option.fail && option.fail(err);
    },
    complete: function (res) {
      console.log('response', res.data);
      option.complete && option.complete(res);
    }
  })
}