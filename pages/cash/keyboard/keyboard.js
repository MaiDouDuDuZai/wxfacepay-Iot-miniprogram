let app = getApp();

Page({
  data: {
    totalAmount: 0,
    paying: false, //支付中状态，支付按钮加载中状态
    style: 'keyboard', //keyboard带键盘 simple不带键盘
  },
  onLoad(query) {
    app.page.onLoad(this);
    app.page.checkLogin();
    app.order.clearStatus();
    this.data.totalAmount = (parseFloat(query.amount) || 0) + '';
    this.setData({ style: query.style || this.data.style });
    try{
      wxfaceapp.postMsg({
        targetAppid: app.Data.accountInfo.miniProgram.appId,
        content: { type: 'navigate', data: { url: '/pages/cash/cash?style=simple' } },
        success(res) {
          console.log('sendMsgResult success', { type: 'navigate', data: { url: '/pages/cash/cash?style=simple' } })
        },
        fail(res) {
          console.log('sendMsgResult failed', res)
        }
      })
    }catch(e){}
  },
  onShow() {
    app.page.onShow(this);
  },
  onReady() {
    app.page.onReady(this);
  },
  onHide() {
    app.page.onHide(this);
  },
  onUnload() {
    app.page.onUnload(this);
    wxfaceapp.postMsg({
      targetAppid: app.Data.accountInfo.miniProgram.appId,
      content: { type: 'navigate', data: { url: '/pages/index/index' } },
      success(res) {
        console.log('sendMsgResult success', { type: 'navigate', data: { url: '/pages/index/index' } })
      },
      fail(res) {
        console.log('sendMsgResult failed', res)
      }
    })
  },
  onOptionMenuClick() {
    app.page.onOptionMenuClick(this);
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
    wxfaceapp.postMsg({
      targetAppid: app.Data.accountInfo.miniProgram.appId,
      content: { type: 'cash', data: { amount: amount } },
      success(res) {
        console.log('sendMsgResult success', res)
      },
      fail(res) {
        console.log('sendMsgResult failed', res)
      }
    })
  },
  check_amount(tapNum, amount) {
    let _amount = amount;
    if (amount === '') {
      if (tapNum === '.') {
        return '0.';
      } else {
        return tapNum;
      }
    }
    if (amount === '0') {
      if (tapNum !== '.') {
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
  }
});