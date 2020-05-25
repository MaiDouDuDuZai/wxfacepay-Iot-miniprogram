//刷脸支付
function facePay(option) {
  let app = getApp() || this;
  option = {
    success(faceCode){},
    fail(reply){},
    close(res){},
    ...option
  };
  if (app.Data.dev) {
    setTimeout(() => { option.success('135029304158692043') }, 3000);
    return;
  }
  wxfaceapp.facePay({
    requireFaceCode:true, //是否需要获取付款码返回给小程序
    success(res){
      console.log("success [launchFaceApp]", res)
      //刷脸成功Event 建议配合facePay的调用结果进行注册
      wxfaceapp.onFacePayPassEvent(function (res) {
        console.log("onFacePayPassEvent", res)
        if(res.replyCode != '0'){
          return option.fail(res.reply)
        }
        option.success(res.faceCode)
      })
      //刷脸失败Event 建议配合facePay的调用结果进行注册
      wxfaceapp.onFacePayFailedEvent(function (res) {
        console.log("onFacePayFailedEvent", res)
        option.fail(res.reply)
      })
      //查单成功Event
      wxfaceapp.onQueryPaymentSucEvent(function (res) {
        console.log("onQueryPaymentSucEvent", res)
        option.close(res.reply)
      })
      //查单失败Event
      wxfaceapp.onQueryPaymentFailedEvent(function (res) {
        console.log("onQueryPaymentFailedEvent", res)
        option.close(res.reply)
      })
    },
    fail(res){
      console.log("fail [launchFaceApp]", res)
      option.fail(res.reply)
    }
  })
}

//扫码支付
function codePay(option) {
  let app = getApp() || this;
  option = {
    success(code) { },
    fail(err) { },
    ...option
  };
  if (app.Data.dev) {
    setTimeout(() => { option.success('6911988009814') }, 2000);
    return;
  }
  //监听扫码器
  wxfaceapp.listenCodePayment({
    success(res) {
      wx.hideLoading();
      console.log('listenCodePayment success', res)
      //注册事件
      wxfaceapp.onCodePayEvent(function (res) {
        console.log("onCodePayEvent ret = ", res)
        option.success(res.code);
      })
    }
  })
}

function playAudio() {
  return false;
}

function faceVerify(cb_success, cb_fail) {
  let app = getApp();
  app.native.faceLogin({
    enableMultiLogin: true,
    success() {
      console.log("[faceLogin] success")
      wx.login({
        success(login_res) {
          if (login_res.code) {
            wx.getUserInfo({
              success: function (userInfo) {
                userInfo.code = login_res.code; 
                cb_success && cb_success(userInfo);
              },
              fail: function (res) {
                console.log('getUserInfo fail', res)
              }
            })
          } else {
            wx.showToast({ icon: 'none', title: '登录失败！' + res.errMsg })
            cb_fail && cb_fail(res.errMsg)
          }
        }
      })
    },
    fail(res) {
      wx.showToast({title: '[faceLogin] failed', icon:'none'})
      cb_fail && cb_fail('[faceLogin] failed')
    }
  })
}

function faceLogin(option) {
  let app = getApp();
  if (app.Data.dev) {
    return option.success({
      replyCode: '0',
      reply: 'already in login status, no need to face login'
    });
  }
  wxfaceapp.faceLogin(option);
}

//注册键盘监听
function registKeyBoard(){
  try {
    wxfaceapp.registKeyBoard({
      keyCodeList: [
        { keyCode: "61" }, //设置
        { keyCode: "66" }, //刷脸
        { keyCode: "67" }, //返回
        { keyCode: "70" }, //=
        { keyCode: "131" }, //f1
        { keyCode: "132" }, //f2
        { keyCode: "133" }, //f3
        { keyCode: "144" }, //0
        { keyCode: "145" }, //1
        { keyCode: "146" }, //2
        { keyCode: "147" }, //3
        { keyCode: "148" }, //4
        { keyCode: "149" }, //5
        { keyCode: "150" }, //6
        { keyCode: "151" }, //7
        { keyCode: "152" }, //8
        { keyCode: "153" }, //9
        { keyCode: "154" }, ///
        { keyCode: "155" }, //x
        { keyCode: "156" }, //-
        { keyCode: "157" }, //+
        { keyCode: "158" }, //.
      ],
      success(res) {
        console.log("success [registKeyBoard]")
        wxfaceapp.onKeyBoardEvent(function (r) {
          console.log("onKeyBoardEvent name = " + r.keyName + ' code = ' + r.keyCode)
          let currentPage = getApp().native.getCurrentPage();
          if (currentPage && currentPage.data.keyEventHandler) {
            currentPage.data.keyEventHandler[r.keyCode] && currentPage.data.keyEventHandler[r.keyCode].call(currentPage, r);
          }
        })
      }
    })
  } catch (e) { }
}

function getCurrentPage(){
  let pageStack = getCurrentPages();
  return pageStack && pageStack.length && pageStack[pageStack.length - 1];
}

module.exports = { facePay, faceLogin, codePay, playAudio, faceVerify, registKeyBoard, getCurrentPage};