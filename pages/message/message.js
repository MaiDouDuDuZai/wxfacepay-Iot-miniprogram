let app = getApp();

Page({
  data: {
    type: '',
    title: '', 
    subTitle: '',
    messageButton: {
      mainButton: {
        buttonText: "",
        disabled: true
      }
    },
    timer: {
      btn: { id: 0, count: 0 }, //按钮
    },
    ads: '',
    member: false, //会员信息
    mchHasMemberCard: false,
    order: { status: 1, trade_type: '' },
    act: '',
  },
  onLoad: function(query) {
    if(app.Data.dev){
      query = { act: 'query', type: 'waiting' };
      app.Data.order.status = 1;
      app.Data.order.totalAmount = '0';
      app.Data.order.pay_price = 5555.99;
      app.Data.order.out_trade_no = 'T2019121915225070156';
      app.Data.merchant.hasMemberCard = true;
    }
    app.page.onLoad(this);
    this.setData({
      mchHasMemberCard: app.Data.merchant.hasMemberCard ,
      ads: app.Data.ads.message,
      'order.trade_type': app.Data.order.trade_type,
    });
    this.data.act = query.act || 'msg';
    switch(this.data.act){
      case 'query': //查询-结果展示
        if (app.Data.order.status == 2) {
          return this.success();
        }
        if (app.Data.order.status == 3) {
          return this.fail();
        }
        this.query();
      break;
      case 'msg': //结果展示
        app.Data.order.status == 3 ? this.fail() : this.success();
      break;
    }
  },
  onShow(){
    app.page.onShow(this);
  },
  onUnload(){
    app.page.onUnload(this);
  },
  //支付倒计时，返回倒计时
  countdown( count = 0 ){
    clearTimeout(this.data.timer.btn.id);
    if( count ) this.data.timer.btn.count = count;
    if( this.data.timer.btn.count <= 0 ){
      return app.Data.order.status == 1 ? false : this.goBack();
    }
    this.renderBtn();
    this.data.timer.btn.id = setTimeout(()=>{ this.countdown() }, 1000);
  },
  renderBtn(){
    this.setData({
      'messageButton.mainButton.buttonText': this.data.timer.btn.count-- + 's',
    });
  },
  onTapMain() {
    if (!this.data.messageButton.mainButton.disabled) {
      this.goBack();
    }
  },
  goBack() {
    wx.reLaunch({ url: '/pages/index/index' });
  },
  query(){
    this.setData({ 
      type: 'waiting', 
      title: '查询中', 
      'messageButton.mainButton.buttonText': '' 
    });
    app.order.query({
      page: this,
      success: () => {
        app.Data.order.status == 2 ? this.success() : this.fail();
      },
      fail: () => {
        this.fail(-1);
      }
    });
    this.countdown(30);
  },
  //支付成功
  success(){
    let title = '支付成功';
    if( app.Data.order.biz_type == 'charge' ){
      title = '会员充值成功';
    }
    if( app.Data.order.trade_type == 'card' ){
      title = '余额支付成功';
    }
    clearTimeout(this.data.timer.btn.id);
    //刷脸收银台未结束时关闭页面
    // if(app.Data.order.trade_type == 'face_code' && app.Data.cashier.status == 1){
    //   return wx.navigateBack();
    // }
    this.setData({
      type: 'success',
      title: title,
      subTitle: '您已成功支付￥' + (parseFloat(app.Data.order.totalAmount) || parseFloat(app.Data.order.pay_price) ) + '元',
      member: {
        ...app.Data.order.member,
        card_no: app.Data.order.member && app.Data.order.member.card_no && app.Data.order.member.card_no.replace(/^(\d{3}).*(\d{4})$/, '$1****$2'),
      },
      'order.status': 2,
      'messageButton.mainButton.disabled': false,
    });
    app.printer.printReceipt();
    app.native.playAudio();
    this.countdown(10);
  },
  /**
   * 支付失败
   * @param {string} type 失败类型 0支付失败,-1系统错误
   */
  fail( type = 0 ){
    clearTimeout(this.data.timer.btn.id);
    //刷脸收银台未结束时关闭页面
    // if(app.Data.order.trade_type == 'face_code' && app.Data.cashier.status == 1){
    //   return wx.navigateBack();
    // }
    this.setData({
      type: 'warn',
      title: type == 0 ? '支付失败' : '系统错误',
      subTitle: app.Data.order.errorMessage,
      member: false,
      'order.status': 3,
      'messageButton.mainButton.disabled': false,
    })
    app.native.playAudio();
    this.countdown(10);
  }
}); 
