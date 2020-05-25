let app = getApp();

Page({
  data: {
    cart:[], //浅拷贝goods
    total_price: 0,
    total_num: 0,
    trade_type: '', // face_code|bar_code|card
    paying: false, //支付中状态，支付按钮加载中状态
  },
  onLoad: function (options) {
    app.page.onLoad(this);
    app.page.checkLogin();
    //完整重置金额、购物车(订单收银)
    app.Data.order = {
      ...app.Data.order,
      totalAmount: 0,
      total_price: 0,
      pay_price: 0,
      goods: [],
    };
    app.order.clearStatus();
  },
  onShow: function () {
    app.page.onShow(this);
    app.native.codePay({
      success: code => {
        app.request({
          method: 'post',
          url: app.api.goods_detail,
          data: { goods_id: code },
          success: res => {
            if (res.status == 0) {
              return wx.showToast({ title: res.message, icon: 'none' })
            }
            this.addCart(res.contents.data);
          }
        });
      }
    });
  },
  onReady: function () {
    app.page.onReady(this);
  },
  onHide: function () {
    app.page.onHide(this);
  },
  onUnload: function () {
    app.page.onUnload(this);
  },
  is_in_cart(goods_id){
    let goods = this.data.cart.filter(v => v.goods_id == goods_id);
    return goods.length ? goods[0] : false;
  },
  addCart(e){ //e可能是事件对象或接口返回的商品详情
    let target = {}, goods_id = '', is_in_cart = false;
    if(e.target){
      goods_id = e.target.dataset.goods_id;
    }else{
      goods_id = e.goods_id;
    }
    is_in_cart = this.is_in_cart(goods_id);
    if (is_in_cart){
      target = is_in_cart;
    }else{
      this.data.cart.push(e);
      target = this.is_in_cart(goods_id);
    }
    target.cart_num = target.cart_num ? target.cart_num + 1 : 1;
    this.setData({
      cart: this.data.cart,
      total_num: this.data.total_num + 1,
      total_price: this.data.total_price + target.price * 100
    })
  },
  minusCart(e){
    let goods_id = e.target.dataset.goods_id;
    let target = this.data.cart.filter(v => v.goods_id == goods_id)[0];
    target.cart_num = target.cart_num - 1;
    this.setData({
      cart: this.data.cart.filter(v => v.cart_num > 0),
      total_num: this.data.total_num - 1,
      total_price: this.data.total_price - target.price * 100
    });
  },
  onSubmit(){
    if( parseFloat( this.data.total_price ) == 0 ){
      return wx.showToast({ icon: 'none', title: '金额错误' })
    }
    let goods = [];
    this.data.cartPanel.cart.forEach(v => {
      let good = { goods_id: v.goods_id, goods_name: v.goods_name, num: v.cart_num, price: v.price };
      if (v.attr) {
        good.attr = v.attr.split('/');
      }
      goods.push(good);
    });
    app.Data.order.goods = goods;
    this.setData({ showPayOption: true });
  },
  cancelSubmit(){
    this.setData({ 
      showPayOption: false,
      paying: false 
    });
    app.order.clearStatus();
  },
  confirm(e) {
    if (this.data.paying) return;
    let biz_type = e.target.dataset.biz_type || 'normal', 
      trade_type = e.target.dataset.trade_type;
    this.setData({ paying: true, biz_type, trade_type });
    app.order.posConfirm({
      trade_type,
      total_price: this.data.total_price / 100,
      pay_price: this.data.total_price / 100,
      onGetCode: (code) => {
        this.setData({ paying: false })
      },
      onerror: () => {
        this.setData({ paying: false });
        app.order.clearStatus();
      },
      oncancel: () => {
        app.order.clearStatus();
        wx.navigateBack();
      }
    });
  },
  memberPay() {
    wx.navigateTo({ url: '/pages/member/cash/cash?amount=' + this.data.total_price / 100 })
  }
})