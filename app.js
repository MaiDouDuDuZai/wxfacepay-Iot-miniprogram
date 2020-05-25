var request = require('/utils/request'),
api = require('/utils/api'),
native = require('/utils/native'),
page = require('/utils/page'),
printer = require('/utils/printer'),
setting = require('/utils/setting'),
order = require('/utils/order'),
util = require('/utils/util'),
canIUse = require('/utils/canIUse');

//app.js
App({
  Data: {
    osInfo: {},
    version: '1.3.2',
    SN: "",
    person: {}, // 登录店员
    merchant: {
      merchant_id: '',
      merchant_name: '',
      hasMemberCard: false,
      card_charge: [], //会员充值方案
    },
    card: { //会员卡配置
      weixin: {
        is_card: false, //是否启用会员卡
        is_charge: false, //是否开启储值功能
        card_id: '',
        card_color: '',
        card_bg_url: '',
        card_logo_url: '',
        card_show_name: '',
        card_activateurl: { long: '', short: '' }, //会员卡领卡投放链接
      }
    },
    config: {
      API_URL: "demo.tryyun.net",
      printMulti: 1, //打印联数
      mode: { name: '独立收银', value: '1', url: '/pages/cash/cash' }, //收银模式
    },
    order: {
      out_trade_no: '',
      totalAmount: '', //简单收银
      total_price: '', //订单收银
      pay_price: '', //订单收银
      goods: [], //订单收银
      charge_amount: '',
      trade_gate: '', //alipay|weixin
      barCode: '',
      card_no: '', //会员卡号，会员支付时需要
      biz_type: 'normal', // normal|charge
      trade_type: '', // face_code|bar_code|card
      pay_result: {}, // pay接口返回
      query_result: {}, // smile/query接口返回
      status: 0, //0 未支付, 1 支付中, 2 支付成功, 3 支付失败
      member: false, //订单会员
      errorMessage: '', //错误提示
    },
    cashier: { status: 0 },
    ads: {
      index: { interval: 5, swiperData: [] }, //首页海报
      message: '' //支付结果页
    },
    printer: [], // usb打印机
    canIUse: canIUse,
    dev: util.isDev,
    userInfo: null,
    launchOption: {},
    accountInfo: {},
    websocket: { //设备状态监测timer
      connect: 0,
      heartbeat: 0,
    },
    mock: false, //使用mock数据
    // voiceQueue: [], //支付到账语音队列，不为空时默认正在播放语音，通过 app.native.voiceQueuePlay 入队
    location: '', //定位，经纬度逗号分隔
  },
  onLaunch: function (option) {
    this.Data.launchOption = option;
    //小程序appId
    this.Data.accountInfo = wx.getAccountInfoSync();
    let cache_config = wx.getStorageSync('config');
    if (cache_config) {
      //同域名保持登录
      if (this.Data.config.API_URL == cache_config.API_URL) {
        console.log('已登陆')
        this.Data.person = wx.getStorageSync('person') || this.Data.person;
        this.Data.config.mode = cache_config.mode;
        this.initMerchant();
      }
    }
    //初始化SN
    this.checkEnv();
    this.init_websocket();
    // this.launchBackApp();
    native.registKeyBoard();
    //获取位置
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        console.log('定位成功');
        this.Data.location = [res.longitude, res.latitude].join(',');
      },
      fail: () => {
        console.log('定位失败');
      },
    })
  },
  onShow: function(){
    this.initNavbar();
  },
  request,
  api,
  native,
  page,
  printer,
  setting,
  order,
  util,
  //初始化SN
  checkEnv(){
    let app = getApp() || this;
    try{
      app.Data.dev = !wxfaceapp;
    }catch(err){
      app.Data.dev = true;
    }
    if (app.Data.dev) {
      app.Data.SN = 'SN';
      console.log('运行环境', '模拟器 ' + app.Data.SN)
    } else {
      wxfaceapp.checkWxFacePayOsInfo({
        success(res) {
          console.log("success [checkWxFacePayOsInfo]", res)
          app.Data.osInfo = res;
          app.Data.SN = res.osSerialNumber;
          console.log('运行环境', '真机 ' + app.Data.SN)
        },
        fail(res) {
          console.log("fail [checkWxFacePayOsInfo]")
          console.log(res.osErrorMsg)
          wx.showModal({ title: res.osErrorMsg, showCancel: false })
        }
      })
    }
  },
  initNavbar(){
    let app = getApp() || this;
    let menuButtonObject = wx.getMenuButtonBoundingClientRect();
    wx.getSystemInfo({
      success: res => {
        let statusBarHeight = res.statusBarHeight,
          navTop = menuButtonObject.top,//胶囊按钮与顶部的距离
          navHeight = statusBarHeight + menuButtonObject.height + (menuButtonObject.top - statusBarHeight) * 2;//导航高度
        app.Data.navHeight = navHeight;
        app.Data.navTop = navTop;
        app.Data.windowHeight = res.windowHeight;
      },
      fail(err) {
        console.log(err);
      }
    })
  },
  //初始化商户信息
  initMerchant(complete = '') {
    if (!complete) complete = () => { };
    let app = getApp() || this,
        person = app.Data.person,
        merchant = app.Data.merchant;
    merchant = {
      ...merchant,
      merchant_id: person.merchant_id || '',
      merchant_name: person.merchant_name || '',
      merchant_no: person.merchant_no || '',
    };
    if (person.card && person.card.weixin && Number(person.card.weixin.is_card)) {
      merchant = {
        ...merchant,
        hasMemberCard: true,
        card_charge: person.card_charge
      };
      app.Data.card.weixin = {
        ...app.Data.card.weixin,
        ...person.card.weixin
      };
    }
    app.Data.merchant = merchant;
    console.log('商户会员卡' + (app.Data.merchant.hasMemberCard ? '已' : '未') + '配置');
    return complete();
  },
  //设备在线监测
  init_websocket() {
    let app = getApp() || this;
    if(!/pages\/index\/index$/.test(app.Data.launchOption.path) && !app.Data.dev) return; //后屏小程序不发送心跳
    clearTimeout(app.Data.websocket.heartbeat);
    clearTimeout(app.Data.websocket.connect);
    wx.onSocketOpen(res => {
      console.log('WebSocket 连接已打开！');
      app.util.send_heartbeat();
      //显示首页图标
      let currentPage = app.native.getCurrentPage();
      if (currentPage.route == 'pages/index/index') {
        currentPage.setData({ isWebsocketOnline: true });
      }
    });
    wx.onSocketMessage(function (res) {
      res = JSON.parse(res.data);
      console.log('收到服务器内容');
      // if (res.command == 'speech') {
      //   app.native.voiceQueuePlay([{ api: 'speech', option: { text: res.contents.text } }, { api: 'voicePlay', option: { eventId: 'ONLYPRICE', number: res.contents.amount } }]);
      // }
      let currentPage = app.native.getCurrentPage();
      if (currentPage.route == 'pages/index/index') {
        currentPage.setData({ isWebsocketOnline: true });
      }
    })
    wx.onSocketError(function (res) {
      console.log('WebSocket 连接打开失败，请检查！(' + app.Data.config.API_URL + ')');
    });
    wx.onSocketClose(function (res) {
      console.log('WebSocket 已关闭！');
      app.Data.websocket.connect = setTimeout(()=>{
        wx.connectSocket({ url: 'wss://' + app.Data.config.API_URL + '/websocket' });    
      }, 5000);
      //隐藏首页图标
      let currentPage = app.native.getCurrentPage();
      if (currentPage.route == 'pages/index/index') {
        currentPage.setData({ isWebsocketOnline: false });
      }
    })
    wx.connectSocket({ url: 'wss://' + app.Data.config.API_URL + '/websocket' });
  },
  launchBackApp(){
    let app = getApp() || this;
    // 启动后屏小程序
    if (!app.Data.dev) {
      wx.showToast({ title: '启动后屏小程序', icon: 'none' })
      wxfaceapp.launchMp({
        appId: app.Data.accountInfo.miniProgram.appId,
        hostAppId: "wx17e1d981f8125f33",
        miniappType: 2,//小程序版本类型
        launchPage: "/pages/index_back/index_back",
        needLogin: 0,//是否需要登录态
        success(res) {
          console.log('launchMp suc', res)
          wx.showToast({ title: '启动后屏小程序成功', icon: 'none' })
        },
        fail(res) {
          console.log('launchMp failed reply', res)
          wx.showToast({ title: '启动后屏小程序失败', icon: 'none' })
        }
      })
    }
  }
})