/**
 * 清除订单状态
 */
function clearStatus() {
  let app = getApp() || this;
  app.Data.order = {
    ...app.Data.order,
    biz_type: 'normal',
    // totalAmount: '', //简单收银
    // total_price: '', //订单收银
    // pay_price: '', //订单收银
    // goods: [], //订单收银
    out_trade_no: '',
    barCode: '',
    trade_type: '',
    card_no: '',
    pay_result: {},
    query_result: {},
    time_create: '',
    status: 0,
    member: false,
    printed: false,
    errorMessage: '',
  };
};

/**
 * 确认金额/收款，使用await会报错
 * @param totalAmount
 * @param onerror
 * @param onGetCode
 * @param oncancel
 * @param beforePay
 * @param afterPay
 */
function posConfirm(option) {
  let app = getApp() || this;
  if (app.Data.order.status == 1) {
    return wx.showToast({ icon:'none', title: '支付中，不可重复发起收款' });
  }
  option = {
    biz_type: 'normal',
    card_no: '',
    trade_type: '',
    totalAmount: 0,
    total_price: 0,
    pay_price: 0,
    showMessagePage: true, //是否跳转结果页，如果置否，可在afterPay回调内自定义查询
    beforePay: () => { },
    afterPay: () => { },
    onGetCode: () => {},
    onerror: () => { },
    oncancel: () => { },
    ...option
  };
  let { biz_type, card_no, trade_type, totalAmount, total_price, pay_price } = option;
  option.beforePay();
  app.order.clearStatus();
  app.Data.order = {
    ...app.Data.order,
    biz_type,
    card_no,
    trade_type,
    totalAmount,
    total_price, 
    pay_price,
    out_trade_no: '',
    barCode: '',
    pay_result: {},
    query_result: {},
    time_create: Date.parse(new Date()) / 1000,
    status: 1,
    member: false,
    printed: false,
  };
  if( parseFloat(totalAmount) < 0.01 && parseFloat(pay_price) < 0.01 ) {
    wx.showToast({ icon: 'none', title: '金额错误' })
    return option.onerror();
  }
  if (app.Data.order.trade_type == 'card' && !card_no) {
    wx.showToast({ icon: 'none', title: '缺少参数[card_no]' })
    app.Data.order.status = 0;
    return option.onerror();
  }
  //获取订单号
  app.order.getOutTradeNo({
    success: res=>{
      if (res.status == 0) {
        wx.showToast({icon:'none', title: res.message });
        return option.onerror();
      }
      app.Data.order.out_trade_no = res.contents.out_trade_no;
      //刷脸|扫码支付|充值
      if (trade_type != 'card') {
        //获取付款凭证
        _getPayCode({
          success: function(code) {
            option.onGetCode(code);
            app.Data.order.barCode = code;
            app.Data.order.trade_gate = app.order.tradeGate(code);
            //支付
            app.order.pay({
              success: res => {
                option.afterPay();
                //支付接口返回失败，不用查询
                if (res.status == 0) {
                  return app.Data.cashier.status == 1 ? false : wx.redirectTo({ url: '/pages/message/message?act=msg' });
                }
                //查询
                if (option.showMessagePage) {
                  //刷脸不展示结果页(非充值)
                  if (app.Data.order.trade_type == 'face_code') {
                    app.order.query({
                      success: () => {
                        if (app.Data.order.status == 2) return wx.redirectTo({ url: '/pages/index/index' });
                        if (app.Data.cashier.status == 0) return wx.redirectTo({ url: '/pages/message/message?act=msg' });
                      },
                      fail: () => {
                        if (app.Data.cashier.status == 0) wx.redirectTo({ url: '/pages/message/message?act=msg' });
                      }
                    });
                    return;
                  }
                  return wx.redirectTo({ url: '/pages/message/message?act=query&type=waiting&title=查询中' });
                }
              },
              fail: err => {
                return option.onerror();
              }
            });
          },
          fail: function (err) { option.onerror() },
          close: function(res) {
            //收银台关闭回调(仅刷脸)
            app.Data.cashier.status = 0;
            option.onCashierClose();
            //收银台在查询完成后关闭
            if (app.Data.order.status == 3) return wx.redirectTo({ url: '/pages/message/message?act=msg' });
          }
        });
      }else{
        app.order.pay({
          success: res => {
            option.afterPay();
            //查询
            if (option.showMessagePage) {
              wx.redirectTo({ url: '/pages/message/message?act=query&type=waiting&title=查询中' });
            }
          },
          fail: err => {
            return option.onerror();
          }
        });
      }
    },
    fail: err=>{
      return option.onerror();
    }
  });
}

//刷脸扫码获取付款码
function _getPayCode(option) {
  let app = getApp() || this;
  switch (app.Data.order.trade_type) {
    case 'face_code':
      app.native.facePay(option);
      break;
    case 'bar_code':
      app.native.codePay(option);
      break;
  }
}

/**
 * 支付订单
 */
function pay(option) {
  let app = getApp() || this;
  let order = app.Data.order;
  let url = '', data = '';
  if (order.goods.length && order.biz_type != 'charge'){
    url = app.api.pay_order;
    data = {
      out_trade_no: order.out_trade_no,
      trade_type: order.trade_type,
      biz_type: order.biz_type || 'normal',
      auth_code: order.barCode || '',
      card_no: order.card_no,
      total_price: order.total_price || order.totalAmount,
      pay_price: order.pay_price || order.totalAmount,
      goods: order.goods,
    };
  }else{
    url = app.api.pay;
    data = {
      out_trade_no: order.out_trade_no,
      total_amount: order.totalAmount,
      auth_code: order.barCode || '',
      trade_type: order.trade_type,
      code_type: order.trade_type == 'face_code' ? 'F' : 'C',
      card_no: order.card_no,
      biz_type: order.biz_type || 'normal'
    };
  }
  option = {
    success(res){},
    fail(err){},
    ...option
  };
  app.request({
    url: url,
    method: 'POST',
    data: data,
    dataType: 'json',
    success: (res) => {
      app.Data.order.pay_result = res;
      app.Data.order.member = res.contents.card_info || res.card_info || false;
      if (res.status == 0) {
        app.Data.order.status = 3;
        app.Data.order.errorMessage = res.message;
      } else {
        if (res.message != 'query') {
          app.Data.order.status = 2;
        }
      }
      option.success(res);
    },
    fail: function (res) {
      app.Data.order.status = 3;
      app.Data.order.errorMessage = '请求支付失败';
      option.fail('请求支付失败')
    }
  });
}

/**
 * (废弃)退款订单,数据库保留
 * @param string out_trade_no
 * @param function success
 * @param function fail
 */
function refund(option = {}) {
  let app = getApp() || this;
  option = {
    ...{
      out_trade_no: '',
      success: () => { },
      fail: () => { }
    },
    ...option
  };
  wx.showLoading();
  app.request({
    url: app.api.refund,
    method: 'POST',
    data: {
      out_trade_no: option.out_trade_no,
    },
    dataType: 'json',
    success: function (res) {
      wx.hideLoading();
      option.success(res);
    },
    fail: function (res) {
      wx.hideLoading();
      option.fail(res);
    }
  });
}

/**
 * 获取订单号
 */
function getOutTradeNo(option) {
  let app = getApp() || this;
  let url = '', data = {};
  if ( app.Data.order.biz_type == 'charge'){
    url = app.api.get_out_trade_no_cash; //前缀P
  }else{
    if ( app.Data.order.goods && app.Data.order.goods.length ){
      url = app.api.get_out_trade_no_mall; //前缀D
    }else{
      url = app.api.get_out_trade_no_cash; //前缀P
    }
  }
  option = {
    success(res){},
    fail(err){},
    ...option
  };
  app.request({
    url: url,
    method: 'POST',
    data: data,
    dataType: 'json',
    success: (res) => {
      option.success(res)
    },
    fail: function (res) {
      option.fail();
    }
  })
}
/**
 * 查询订单
 * @param option {page,success,fail}
 */
function query(option) {
  option = {
    page: false,
    success: () => { },
    fail: err => { },
    _timer: { id:0, count:0 },
    ...option
  };
  const status_map = {
    'SUCCESS': '支付成功',
    'CLOSED': '交易关闭',
    'REFUND': '已退款',
    'NOTPAY': '未支付',
    'PAYERROR': '支付失败',
    'USERPAYING': '支付中',
  };
  let app = getApp() || this,
    order = app.Data.order,
    query_from_timestamp = new Date().valueOf(),
    query_to_timestamp = 0,
    query_inteval_milliseconds = 0; //校正请求延迟导致的轮询间隔误差

  app.request({
    url: app.api.query,
    method: 'POST', 
    data: {
      out_trade_no: order.out_trade_no,
      biz_type: order.biz_type,
      card_no: order.card_no || '',
    },
    dataType: 'json',
    success: (res) => {
      clearTimeout(option._timer.id);
      //没有正确返回json格式
      if (typeof res == 'string') {
        app.Data.order.status = 3;
        app.Data.order.errorMessage = '返回格式错误（String）';
        option.fail();
        return;
      }
      app.Data.order.query_result = res;
      app.Data.order.member = (res.contents && res.contents.card_info) || res.card_info || false;
      app.Data.order.charge_amount = res.contents.charge_amount;
      if (res.status == 0) {
        if (res.message == 'RETRY') {
          console.log('retry')
          if (option._timer.count < 6) {
            option._timer.count++;
            option._timer.count == 1 && option.page && option.page.setData({ subTitle: '重试中...' });
            query_to_timestamp = new Date().valueOf();
            query_inteval_milliseconds = 5000 - (query_to_timestamp - query_from_timestamp);
            option._timer.id = setTimeout(() => {
              query(option);
            }, query_inteval_milliseconds);
          } else {
            app.Data.order.query_result = { status: 0, message: '请与收银员确认支付结果' };
            query_success(), option.success();
          }
          return;
        }
        res.message = res.message == 'PAYERROR' ? '支付失败' : res.message;
        return query_success(), option.success();
      }
      switch (res.message) {
        case 'SUCCESS':
          query_success(), option.success();
          break;
        case 'USERPAYING':
          if (option._timer.count < 6) {
            option._timer.count++;
            option._timer.count == 1 && option.page && option.page.setData({ subTitle: '等待客户支付...' });
            query_to_timestamp = new Date().valueOf();
            query_inteval_milliseconds = 5000 - (query_to_timestamp - query_from_timestamp);
            option._timer.id = setTimeout(() => {
              query(option);
            }, query_inteval_milliseconds);
          } else {
            app.Data.order.query_result = { status: 0, message: '支付失败：操作超时' };
            query_success(), option.success();
          }
          break;
        default:
          app.Data.order.query_result = { status: 0, message: '订单状态未知' };
          query_success(), option.success();
          break;
      }
    },
    fail: (err) => {
      clearTimeout(option._timer.id);
      app.Data.order.query_result = { status: 0, message: '请和收银员确认支付结果' };
      query_fail(), option.fail();
    }
  });
}

//查询成功
function query_success() {
  let app = getApp() || this;
  if (app.Data.order.query_result.status == 0) return query_fail();
  app.printer.printReceipt();
  app.Data.order.status = 2;
  console.log('会员信息', app.Data.order.member)
}

//查询失败
function query_fail() {
  let app = getApp() || this;
  app.Data.order.status = 3;
  app.Data.order.errorMessage = app.Data.order.query_result.message;
}

//支付通道
function tradeGate(auth_code) {
  let trade_gate = '';
  auth_code = auth_code + '';
  if (auth_code.length == 18) {
    if (/^(10|11|12|13|14|15)/.test(auth_code)) {
      trade_gate = "weixin";
    }
  }
  if (auth_code.length >= 16 && auth_code.length <= 24) {
    if (/^(25|26|27|28|29|30)/.test(auth_code)) {
      trade_gate = "alipay";
    }
  }
  return trade_gate;
};

function test(){
  console.log('this', this)
}

module.exports = { posConfirm, pay, refund, getOutTradeNo, query, tradeGate, clearStatus, _getPayCode, test };