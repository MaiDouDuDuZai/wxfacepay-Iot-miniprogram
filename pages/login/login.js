let app = getApp();

Page({
  data: {
    per_phone: '',
    API_URL: '', // view
    version: app.Data.version,
  },
  onLoad(query) {
    app.page.onLoad(this);
    //带参自动登录
    if (query.per_phone) {
      this.data.per_phone = query.per_phone;
      this.data.API_URL = app.Data.config.API_URL;
      this.onLogin();
    } else {
      this.setData({ API_URL: app.Data.config.API_URL })
    }
  },
  onReady() {
    app.page.onReady(this);
  },
  onShow() {
    app.page.onShow(this);
    wx.canIUse('wxfaceapp') && wxfaceapp.onRemoteMessage(function (res) {
      console.log("onRemoteMessage [login]", res)
      res.content = JSON.parse(res.content);
      if (res.content.type == 'login') {
        app.util.retrieveStorage();
        app.initMerchant();
        wx.redirectTo({ url: '/' + app.Data.launchOption.path });
        return;
      }
    })
  },
  onHide() {
    app.page.onHide(this);
  },
  onUnload() {
    app.page.onUnload(this);
  },
  onTitleClick() {},
  onInputApiurl(e) {
    this.data.API_URL = e.detail;
  },
  onInputPerphone(e) {
    this.data.per_phone = e.detail;
  },
  onLogin() {
    if(!this.data.per_phone){
      wx.showToast({ icon:'none', title: '店员手机必填' });
      return;
    }
    if(!this.data.API_URL){
      wx.showToast({ icon: 'none', title: '系统域名必填' });
      return;
    }
    app.Data.config.API_URL = this.data.API_URL;
    wx.showLoading();
    app.request({
      url: app.api.login,
      method: 'POST',
      data: {
        per_phone: this.data.per_phone,
      },
      dataType: 'json',
      success: (res) => {
        if (res.status == '0') {
          return wx.showToast({ icon: 'none', title: res.message });
        }
        wx.showToast({ icon:'success', title: "登录成功" });
        app.Data.person = res.contents;
        wx.setStorageSync('person', res.contents);
        wx.setStorageSync('config', app.Data.config);
        app.initMerchant( ()=>{
          try{
            wxfaceapp.postMsg({
              targetAppid: app.Data.accountInfo.miniProgram.appId,
              content: { type: 'login' },
              success(res) {
                console.log('sendMsgResult success', { type: 'login' } )
              },
              fail(res) {
                console.log('sendMsgResult failed', res)
              }
            });
          }catch(e){}
          wx.reLaunch({ url: (app.Data.dev ? '/pages/index/index' : '/' + app.Data.launchOption.path) + '?referer=login' })
        } );
      }
    });
  },
});
