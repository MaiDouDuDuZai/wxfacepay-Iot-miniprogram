let app = getApp();

Page({
  data: {
  },
  onLoad: function (options) {
    app.page.onLoad(this);
    app.page.checkLogin();
  },
  onReady: function () {
    this.prompt = this.selectComponent("#prompt");
  },
  onShow: function () {

  },
  onHide: function () {

  },
  onUnload: function () {

  },
  showPrompt(){
    this.prompt.showPrompt();
  },
  gotoCash(){
    wx.navigateTo({ url: '/pages/cash/keyboard/keyboard' })
  },
  confirmPrompt: function (e) {
    let promptValue = e.detail.value;
    if (promptValue == '') {
      return wx.showToast({ icon: 'none', title: '你还未输入' });
    } else {
      app.setting.check(promptValue, res => {
        this.prompt.hidePrompt();
        wx.navigateTo({ url: '/pages/setting/setting' });
      });
    }
  }
})