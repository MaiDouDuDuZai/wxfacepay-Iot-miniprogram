import drawQrcode from '../../../utils/weapp.qrcode.esm.js';
let app = getApp();

Page({
  data: {
    code: '',
    iv: '',
    encryptedData: '',
    mini_openid: '',
    unionid: '',
    card_no: '', //会员卡号
    card_logo: '',
    card_title: '',
    card_sub_title: '',
    card_color: '#2C9F67',
    card_bg: '',
    card_bg: '',
    is_charge: false, //是否开启储值功能
    credit: '0.00',
    balance: '0.00',
    userCardCode: '', //微信业务卡号
    showCardActiveQrcode: false,
    qrcode_weixin: '',
  },

  /**
   * 生命周期函数--监听页面加载
   * options 可选 mini_openid 或 code + iv + encryptedData
   */
  onLoad: function (options) {
    app.page.onLoad(this);
    this.data.code = options.code || '';
    this.data.iv = options.iv || '';
    this.data.encryptedData = options.encryptedData || '';
    this.data.mini_openid = options.mini_openid || '';
    this.setData({
      is_charge: app.Data.card.weixin.is_charge,
    });
    this.getMemberInfo();
    app.order.clearStatus();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    app.page.onReady(this);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    app.page.onShow(this);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    app.page.onHide(this);
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    app.page.onUnload(this);
  },

  onChargeSuccess() {
    this.getMemberInfo();
  },
  getMemberInfo() {
    //查询会员信息
    wx.showLoading({ title: '查询会员信息' });
    app.request({
      url: app.api.weixin_card_userinfo,
      method: 'POST',
      dataType: 'json',
      data: {
        mini_openid: this.data.mini_openid,
        code: this.data.code,
        iv: this.data.iv,
        encryptedData: this.data.encryptedData,
      },
      success: (res) => {
        if (res.status == 0) {
          return wx.showToast({ icon: 'none', title: res.message });
        }
        this.setData({
          card_no: res.contents.card_no,
          unionid: res.contents.unionid,
          credit: res.contents.credit,
          balance: res.contents.balance,
          userCardCode: res.contents.UserCardCode,
          card_logo: app.Data.card.weixin.card_logo_url,
          card_title: app.Data.card.weixin.card_show_name,
          card_bg: app.Data.card.weixin.card_bg_url,
          card_color: app.Data.card.weixin.card_color,
        })
      }
    })
  },
  showCharge() {
    this.selectComponent('#chargeComponent').show();
  },
  showCardActiveQrcode() {
    wx.showLoading({title: '加载中'})
    app.request({
      url: app.api.card_activateurl,
      method: 'POST',
      data: { 
        card_id: app.Data.card.weixin.card_id,
        out_string: JSON.stringify({
          unionid: this.data.unionid, 
          mini_openid: this.data.mini_openid,
        })
      },
      dataType: 'json',
      success: (res) => {
        if(res.status == 0){
          return wx.showToast({ title: res.message, icon:'none' })
        }
        if (res && res.status == 1 && res.contents && res.contents.apply_card_url) {
          let shorturl = decodeURIComponent(res.contents.apply_card_url);
          app.Data.card.weixin.card_activateurl.short = shorturl;
          this.setData({ showCardActiveQrcode: true })
          this.genQrcode();
        }
      }
    });
  },
  hideCardActiveQrcode() {
    this.setData({ showCardActiveQrcode: false })
  },
  genQrcode() {
    drawQrcode({
      width: 200,
      height: 200,
      canvasId: 'myQrcode',
      text: app.Data.card.weixin.card_activateurl.short,
    })
  }
})