//非会员不得入内
let app = getApp();

Page({
  data: {
    mini_openid: '',
    card_no: '',
    amount: 0,
    credit: 0,
    balance: 0,
    showCharge: false,
    paying: false,
    afford: true, //余额是否足够
    is_charge: false, //是否开启储值功能
    avatar: '',
    keyEventHandler: {
      67: function() { wx.navigateBack() }
    },
  },
  onLoad(query) {
    app.page.onLoad(this);
    this.data.amount = query.amount;
    app.native.faceVerify(
      userinfo => {
        this.setData({
          avatar: userinfo.userInfo.avatarUrl
        })
        this.getMemberInfo(userinfo);
      },
      err => {
        wx.navigateBack()
      }
    );
  },
  onShow() {
    app.page.onShow(this);
  },
  getMemberInfo(userinfo) {
    //查询会员信息
    wx.showLoading({title: '查询会员信息'});
    let data = userinfo ? {
      code: userinfo.code,
      iv: userinfo.iv,
      encryptedData: userinfo.encryptedData,
    } : { mini_openid: this.data.mini_openid };
    app.request({
      url: app.api.weixin_card_userinfo,
      method: 'POST',
      dataType: 'json',
      data: data,
      success: res => {
        if (res.status == 0) {
          return wx.showToast({ title: res.message, icon: 'none' });
        }
        this.setData({
          amount: this.data.amount,
          mini_openid: res.contents.mini_openid,
          card_no: res.contents.card_no,
          credit: res.contents.credit,
          balance: res.contents.balance,
          afford: Number(res.contents.balance) >= Number(this.data.amount),
          is_charge: app.Data.card.weixin.is_charge,
        })
      }
    })
  },
  onChargeSuccess() {
    this.getMemberInfo();
  },
  showCharge() {
    this.selectComponent('#chargeComponent').show();
  },
  //会员支付
  confirm(e) {
    if (this.data.paying) return;
    let biz_type = 'normal', trade_type = 'card';
    this.setData({ paying: true });
    app.order.posConfirm({
      biz_type,
      card_no: this.data.card_no,
      trade_type,
      totalAmount: this.data.amount,
      onerror: () => {
        this.setData({ paying: false })
      },
      onGetCode: (code) => {
        this.setData({ paying: false })
      },
      oncancel: () => {
        this.setData({ paying: false })
      }
    });
  },
});
