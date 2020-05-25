/**
 * 全局计时器格式
 * timer: {
 *   optMenu: { id: 0, count: 0 },
 *   btn: { id: 0, count: 0 },
 *   query: { id: 0, count: 0 }
 * },
 */
var obj = {
  onLoad(page) {
    console.log('--------pageOnLoad----------', page && page.route);
  },
  onShow(page) {
    console.log('--------pageOnShow----------', page && page.route);
  },
  onReady(page) {
    console.log('--------pageOnReady---------', page && page.route);
  },
  onHide(page) {
    console.log('--------pageOnHide----------', page && page.route);
    if (page.data.timer) {
      for (let i in page.data.timer) {
        clearTimeout(page.data.timer[i].id);
        page.data.timer[i].count = 0;
      }
    }
    // wx.ix.offKeyEventChange();
  },
  onUnload(page) {
    console.log('--------pageOnUnload--------', page && page.route);
    if (page.data.timer) {
      for (let i in page.data.timer) {
        clearTimeout(page.data.timer[i].id);
        page.data.timer[i].count = 0;
      }
    }
    // wx.ix.offKeyEventChange();
  },
  checkLogin() {
    let app = getApp() || this;
    console.log('[checkLogin] person_id:', app.Data.person.person_id)
    if (Object.keys(app.Data.person).length == 0) {
      wx.redirectTo({ url: '/pages/login/login' });
      return false;
    }
    return true;
  },
}

module.exports = obj;