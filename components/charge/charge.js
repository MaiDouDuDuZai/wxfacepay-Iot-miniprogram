let app = getApp();

Component({
  data: {
    card_charge: [],
    paying: false,
    charge_id: 0,
    show: false,
  },
  properties: {
    card_no: {
      type: String,
      value: ''
    },
  },
  lifetimes: {
    attached() {
      this.setData({
        card_charge: app.Data.merchant.card_charge
      });
    },
    detached() {},
  },
  methods: {
    show(){
      this.setData({ show: true });
    },
    hide(){
      this.setData({ show: false });
      this.clearStatus();
    },
    clearStatus(){
      this.setData({
        paying: false,
        charge_id: 0,
      })
    },
    onChargeSuccess(){
      this.hide();
      this.triggerEvent('chargeSuccess', {})
    },
    success(){
      this.clearStatus();
      wx.showToast({ title: '会员充值成功', icon:'success'});
      this.onChargeSuccess();
    },
    fail(type = 0){
      this.clearStatus();
      let title = type == 0 ? '支付失败' : '服务器错误';
      wx.showToast({ title: app.Data.order.errorMessage || title, icon: 'none'});
      app.native.playAudio();
    },
    //确认付款
    confirm(e){
      console.log(e)
      if(this.data.paying) return;
      let biz_type = 'charge', 
        trade_type = app.Data.dev ? 'bar_code' : 'face_code',
        pay_amount = e.target.dataset.pay_amount,
        send_amount = e.target.dataset.send_amount,
        card_no = this.properties.card_no;
      this.setData({
        paying: true, 
        charge_id: e.target.dataset.id,
        biz_type,
        trade_type,
      });
      let _this = this;
      app.order.posConfirm({
        biz_type,
        card_no: this.properties.card_no,
        trade_type,
        totalAmount: pay_amount,
        showMessagePage: false,
        afterPay: ()=>{
          //当前订单状态
          if(app.Data.order.status == 3){
            return _this.fail();
          }
          //调用接口查询订单状态
          app.order.query({
            success: () => {
              app.Data.order.status == 2 ? _this.success() : _this.fail();
            },
            fail: () => {
              _this.fail(-1);
            }
          });
        },
        onerror: ()=>{
          this.clearStatus();
        },
        oncancel: ()=>{
          this.clearStatus();
        }
      });
    },
  },
});
