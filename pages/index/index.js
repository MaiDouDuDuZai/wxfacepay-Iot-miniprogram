const app = getApp();

Page({
  data: {
    timer: {
      sleep: { id: 0, count: 0 }
    },
    isSleep: false, //休眠模式，隐藏按钮
    adsType: 'image',
    systemInfo: {},
    swiperData: {},
    swiperCurrent: 0,
    duration: 800,
    interval: 5000,
    indicatorDots: false,
    qrcode: '',
    mode:'',
    video: {
      src: '',
    },
    merchant: {},
    keyEventHandler: {
      66: function(r){ //刷脸键
        wx.navigateTo({ url: app.Data.config.mode.url })
      }
    },
    isWebsocketOnline: false,
    voiceQueueLength: 0,
  },
  onLoad(query) {
    app.page.onLoad(this);
    if(!app.page.checkLogin()) return;
    this.setData({
      navHeight: app.Data.navHeight,
      navTop: app.Data.navTop,
      merchant: app.Data.merchant,
    })
    //接受另一端屏幕上的小程序发来的消息
    if (app.Data.dev) {
      // setTimeout(() => {
      //   let res = { senderAppid: 'xxx', content: JSON.stringify({ type: 'cash', data: { amount: '0.02' } }) };
      //   console.log("onRemoteMessage", res)
      //   res.content = JSON.parse(res.content);
      //   if (res.content.type == 'cash') {
      //     return wx.navigateTo({ url: '/pages/cash/cash?style=simple&amount=' + res.content.data.amount });
      //   }
      // }, 1000);
    } else {
      wxfaceapp.onRemoteMessage(function (res) {
        console.log("onRemoteMessage [index]", res)
        res.content = JSON.parse(res.content);
        if (res.content.type == 'navigate'){
          !/pages\/index\/index/.test(res.content.data.url) && wx.navigateTo({ url: res.content.data.url });
          return;
        }
        if (res.content.type == 'cash') {
          return wx.navigateTo({url: '/pages/cash/cash?style=simple&amount=' + res.content.data.amount});
        }
        if(res.content.type == 'login'){
          app.util.retrieveStorage();
          app.initMerchant();
          wx.showToast({title: '已登录'});
          return;
        }
        if(res.content.type == 'logout'){
          app.util.retrieveStorage();
          wx.showToast({title: '已退出登录', icon: 'none'});
          return;
        }
      })
    }
    this.videoContext = wx.createVideoContext('myVideo');
    if (query.referer == 'login') {
      wx.closeSocket();
    }
  },
  onShow() {
    app.page.onShow(this);
    this.setData({ mode: app.Data.config.mode });
  },
  onReady() {
    app.page.onReady(this);
    this.initAds(() => {
      let ads = app.Data.ads.index;
      if (ads.type == 'video') {
        this.setData({
          adsType: ads.type,
          'video.src': ads.video
        })
      } else {
        this.setData({
          adsType: ads.type,
          swiperData: ads.swiperData,
          interval: ads.interval
        });
      }
    })
    this.prompt = this.selectComponent("#prompt");
  },
  onHide() {
    app.page.onHide(this);
  },
  onUnload() {
    app.page.onUnload(this);
  },
  /**
   * 初始化海报
   */
  initAds(complete = () => { }) {
    let app = getApp();
    app.request({
      url: app.api.slider,
      method: 'POST',
      data: {},
      dataType: 'json',
      success: (res) => {
        if (res.status == '0') {
          return wx.showToast({ title: res.message, icon: 'none' });
        }
        let indexAds = {};
        if (res.contents.type == 'video') {
          indexAds = {
            type: 'video',
            video: res.contents.video
          }
        } else {
          indexAds = {
            type: 'image',
            swiperData: res.contents.item,
            interval: res.contents.time * 1000
          };
        }
        app.Data.ads = {
          index: indexAds,
          message: 'https://' + app.Data.config.API_URL + '/uploads/test/cash_result.jpg?t=' + new Date().getTime()
        };
        complete(res);
      }
    });
  },
  gotoCash(){
    wx.navigateTo({url: '/pages/cash/cash?style=keyboard'})
  },
  gotoGoods(){
    wx.navigateTo({url: '/pages/cash/goods/goods'})
  },
  gotoScan(){
    wx.navigateTo({url: '/pages/cash/scan/scan'})
  },
  gotoSetting(){
    this.data.timer = this.data.timer === undefined ? {} : this.data.timer;
    this.data.timer.settingButton = this.data.timer.settingButton ? this.data.timer.settingButton : { id: 0, count: 0 };
    clearTimeout(this.data.timer.settingButton.id);
    this.data.timer.settingButton.count++;
    if (this.data.timer.settingButton.count >= 5) {
      this.data.timer.settingButton.count = 0;
      this.prompt.showPrompt();
      return;
    }
    this.data.timer.settingButton.id = setTimeout(() => {
      this.data.timer.settingButton.count = 0;
    }, 10000);
  },
  confirmPrompt: function (e) {
    let promptValue = e.detail.value;
    if (promptValue == '') {
      return wx.showToast({ icon: 'none', title: '你还未输入'});
    }
    else {
      app.setting.check(promptValue, res => {
        this.prompt.hidePrompt();
        wx.navigateTo({ url: '/pages/setting/setting' });
      });
    }
  },
  logout() {
    this.data.timer = this.data.timer === undefined ? {} : this.data.timer;
    this.data.timer.logout = this.data.timer.logout ? this.data.timer.logout : { id: 0, count: 0 };
    clearTimeout(this.data.timer.logout.id);
    this.data.timer.logout.count++;
    if (this.data.timer.logout.count >= 5) {
      this.data.timer.logout.count = 0;
      app.Data.person = {};
      wx.removeStorageSync('person');
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.data.timer.logout.id = setTimeout(() => {
      this.data.timer.logout.count = 0;
    }, 10000);
  },
  joinMember(){
    app.native.faceVerify(function(userInfo) {
      app.request({
        url: app.api.weixin_card_open,
        method: 'POST',
        dataType: 'json',
        data: {
          code: userInfo.code,
          iv: userInfo.iv,
          encryptedData: userInfo.encryptedData,
        },
        success: (res) => {
          if (res.status == 0) {
            wx.showToast({ icon: 'none', title: res.message });
            return console.log('开卡失败', res);
          }
          console.log('开卡成功', res);
          wx.navigateTo({ url: '/pages/member/card/card?mini_openid=' + res.contents.mini_openid });
        }
      })
    })
  }
});
