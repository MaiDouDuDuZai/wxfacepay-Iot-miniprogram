let app = getApp();

Page({
  data: {
    thumb: '/image/avatar.jpg',
    person: {},
    merchant: {},
    config: {},
    version: app.Data.version,
  },
  onLoad() {
    app.page.onLoad(this);
    app.page.checkLogin();
  },
  onShow() {
    app.page.onShow(this);
  },
  onReady() {
    app.page.onReady(this);
    this.setData({
      person: app.Data.person,
      merchant: app.Data.merchant,
      config: app.Data.config
    });
  },
  onHide() {
    app.page.onHide(this);
  },
  onUnload() {
    app.page.onUnload(this);
  },
  logout() {
    app.Data.person = {};
    wx.removeStorageSync('person');
    try{
      wxfaceapp.postMsg({
        targetAppid: app.Data.accountInfo.miniProgram.appId,
        content: { type: 'logout' },
        success(res) {
          console.log('sendMsgResult success', { type: 'logout' })
        },
        fail(res) {
          console.log('sendMsgResult failed', res)
        }
      });
    }catch(e){}
    wx.reLaunch({url: '/pages/login/login'});
  },
  clearCache(){
    wx.removeStorageSync('config');
    wx.showToast({ title: '成功', icon:'none' });
  },
  openModal() {
    this.setData({
      modalOpened: true,
    });
  },
  onModalClose() {
    this.setData({
      modalOpened: false,
    });
  },
  //刷脸登录
  testfacelogin(){
    wxfaceapp.isLoginOnFaceApp({
      success() {
        //成功，说明此时青蛙App具备登录态，可以进行小程序内登录
        console.log("[isAlreadyLogin] is login on face app, free to call [wx.login]")
        wxfaceapp.faceLogin({
          //开启重复登录
          enableMultiLogin: true,
          //登录成功后，自动路由至此页面
          // relaunchUrl: "pages/pay/pay",
          success(res) {
            console.log("[faceLogin] success")
            console.log(res.replyCode)
            console.log(res.reply)
          },
          fail(res) {
            console.log("[faceLogin] failed")
            console.log(res.replyCode)
            console.log(res.reply)
          }
        })
      },
      fail() {
        //失败，说明此时青蛙App不具备登录态，需要进行刷脸登录获取登录态，然后才可以进行小程序内登录
        console.log("[isAlreadyLogin] not login on face app, free to call [faceLogin]")
        wxfaceapp.faceLogin({
          //开启重复登录
          enableMultiLogin: true,
          //登录成功后，自动路由至此页面
          // relaunchUrl: "pages/pay/pay",
          success(res) {
            console.log("[faceLogin] success")
            console.log(res.replyCode)
            console.log(res.reply)
          },
          fail(res) {
            console.log("[faceLogin] failed")
            console.log(res.replyCode)
            console.log(res.reply)
          }
        })
      }
    })
  },
  //登录后获取unionid
  testunionid() {
    wx.login({
      success(res) {
        if (res.code) {
          //发起网络请求
          app.request({
            url: app.api.session,
            data: {
              code: res.code
            },
            success: (res) => {
              if (res.status == 0) {
                return console.log('获取openid失败', res);
              }
              console.log('获取openid成功', res);
            }
          })
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      }
    })
  },
  getUserInfo(){
    // 必须是在用户已经授权的情况下调用
    wx.getUserInfo({
      success: function (res) {
        console.log('getUserInfo success', res)
        wx.login({
          success(res) {
            app.request({
              url: app.api.userinfo,
              data: {
                code: res.code,
                iv: res.iv,
                encryptedData: res.encryptedData,
              },
              success: (res) => {
                if (res.status == 0) {
                  return console.log('解密userinfo失败', res);
                }
                console.log('解密userinfo成功', res);
              }
            })
          }
        })
      },
      fail: function(res){
        console.log('getUserInfo fail', res)
      }
    })
  }
});