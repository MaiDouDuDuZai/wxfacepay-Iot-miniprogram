let app = getApp();
Page({
  data: {
    active_mode: '',
    items: [
      { name: '独立收银', value: '1', url: '/pages/cash/cash' },
      { name: '自助下单', value: '2', url: '/pages/cash/goods/goods', viewMode: 1 },
      { name: '自助结账', value: '3', url: '/pages/cash/scan/scan'},
    ],
  },
  onLoad: function (options) {
  },
  onReady: function () {
  },
  onShow: function () {
    const active_mode = app.Data.config.mode;
    this.data.items.map((v) => {
      v.checked = v.value == active_mode.value ? true : false;
      if (active_mode.value == 2) v.viewMode = active_mode.viewMode || 1;
      return v;
    });
    this.setData({
      active_mode: active_mode,
      items: [...this.data.items]
    });
  },
  onHide: function () {
  },
  onUnload: function () {
  },
  modeChange(e) {
    const newmode = this.data.items.find(v => v.value == e.currentTarget.dataset.mode);
    app.Data.config.mode = newmode;
    wx.setStorageSync('config', app.Data.config);
    this.setData({ active_mode: newmode });
  },
  viewModeChange(e) {
    console.log(e.target.dataset)
    let viewMode = e.currentTarget.dataset.viewmode;
    app.Data.config.mode.viewMode = viewMode;
    wx.setStorageSync('config', app.Data.config);
    this.setData({ 'items[1].viewMode': viewMode })
  },
})