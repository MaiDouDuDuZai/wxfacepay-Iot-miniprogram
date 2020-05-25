let app = getApp();

Page({
  data: {
    totalAmount: 0,
    biz_type: '', //支付类型 normal|charge
    trade_type: '', // face_code|bar_code|card
    paying: false, //支付中状态，支付按钮加载中状态
    dev: app.Data.dev,
    style: 'keyboard', //keyboard带键盘 simple不带键盘
    keyEventHandler: {
      66: function(r){
        this.confirm({ target: { dataset: { biz_type: 'normal', trade_type: 'face_code' } } });
      },
      67: function(r){
        wx.navigateBack();
      },
    },
  },
  onLoad(query) {
    app.page.onLoad(this);
    app.page.checkLogin();
    //完整重置金额、购物车(简单收银)
    if (!query.showGoods) {
      app.Data.order = {
        ...app.Data.order,
        totalAmount: 0,
        total_price: 0,
        pay_price: 0,
        goods: [],
      };
      app.order.clearStatus();
    }
    this.data.totalAmount = (parseFloat(query.amount) || 0) + '';
    this.setData({ style: query.style || this.data.style, totalAmount: this.data.totalAmount })
  },
  onShow() {
    app.page.onShow(this);
    //接受另一端屏幕上的小程序发来的消息
    if (app.Data.dev) {
      // setTimeout(() => {
      //   let res = { senderAppid: 'xxx', content: JSON.stringify({ type: 'cash', data: { amount: '0.07' } }) };
      //   console.log("onRemoteMessage", res)
      //   res.content = JSON.parse(res.content);
      //   res.content.type == 'cash' && this.update_amount(res.content.data.amount);
      // }, 1000);
    } else {
      wxfaceapp.onRemoteMessage((res) => {
        console.log("onRemoteMessage [cash]", res)
        res.content = JSON.parse(res.content);
        if ( res.content.type == 'cash' ){
          return this.update_amount(res.content.data.amount);
        }
        if ( res.content.type == 'navigate' ){
          !/pages\/cash\/cash/.test(res.content.data.url) && wx.redirectTo({ url: res.content.data.url });
          return;
        }
        if (res.content.type == 'logout') {
          app.util.retrieveStorage();
          wx.navigateBack();
          return;
        }
      })
    }
  },
  onReady() {
    app.page.onReady(this);
  },
  onHide() {
    app.page.onHide(this);
  },
  onUnload() {
    app.page.onUnload(this);
  },
  onOptionMenuClick() {
    app.page.onOptionMenuClick(this);
  },
  //确认付款
  confirm(e){
    if(this.data.paying) return;
    let biz_type = e.target.dataset.biz_type || 'normal', trade_type = e.target.dataset.trade_type;
    if (parseFloat(this.data.totalAmount) < 0.01) {
      return wx.showToast({ icon: 'none', title: '金额错误' });
    }
    this.setData({ paying: true, biz_type, trade_type });
    app.order.posConfirm({
      biz_type,
      trade_type,
      totalAmount: this.data.totalAmount, 
      onGetCode: (code)=>{
        this.setData({ paying: false })
      },
      onerror: ()=>{
        this.setData({ paying: false});
        app.order.clearStatus();
      },
      oncancel: ()=>{
        app.order.clearStatus();
        wx.navigateBack();
      },
      onCashierClose: ()=>{
      },
    });
  },
  onTotalAmountChange(e) {
    let tapNum = e.target.dataset.value + '',
      totalAmount = this.data.totalAmount;
    totalAmount = this.check_amount(tapNum, totalAmount);
    if (!totalAmount) return false;
    this.update_amount(totalAmount)
  },
  onDel(e) {
    let totalAmount = this.data.totalAmount;
    if (!totalAmount) return false;
    totalAmount = totalAmount.substr(0, totalAmount.length - 1);
    this.update_amount(totalAmount)
  },
  update_amount(amount = '') {
    this.setData({ totalAmount: amount })
  },
  check_amount(tapNum, amount) {
    amount = amount || '0';
    let _amount = amount;
    if (amount === '') {
      if (tapNum === '.') {
        return '0.';
      } else {
        return tapNum;
      }
    }
    if (amount === '0') {
      if (tapNum !== '.'){
        _amount = '';
      };
    }
    amount = amount.split('.');
    if (amount.length >= 2) {
      if (tapNum === '.') return false;
      if (amount[1].length >= 2) return false;
    } else {
      if (amount[0].length >= 5) return false;
    }
    return _amount + tapNum;
  },
  cancelPay(){
    this.setData({ paying: false });
    app.order.clearStatus();
  },
  memberPay(){
    if (parseFloat(this.data.totalAmount) < 0.01) {
      return wx.showToast({ icon: 'none', title: '金额错误' });
    }
    wx.navigateTo({url: '/pages/member/cash/cash?amount=' + this.data.totalAmount})
  }
});