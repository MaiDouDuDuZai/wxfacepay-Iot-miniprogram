//设置页面鉴权并跳转
function check(password, cb = '') {
  let app = getApp() || this;
  if (!cb) {
    cb = res => {
      res && wx.navigateTo({ url: '/pages/setting/setting' });
    }
  }
  if (!password) {
    return;
  }
  wx.showLoading();
  app.request({
    url: app.api.check,
    method: 'POST',
    data: {
      password: password,
    },
    success: (res) => {
      wx.hideLoading();
      if (!res.status || res.status == 0) {
        wx.showToast({ icon: 'none', title: res.message });
        return;
      }
      cb(true);
    }
  });
}

module.exports = { check };