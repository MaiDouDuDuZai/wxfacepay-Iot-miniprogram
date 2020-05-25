Page({
  data: {
    status: false,
    brightness: 1,
  },
  onLoad() {
    wx.getScreenBrightness({
      success: res => {
        this.setData({
          brightness: res.brightness
        })
      },
    })
  },
  sliderChange(e) {
    wx.setScreenBrightness({
      brightness: e.detail.value,
      success: (res) => {
        this.setData({
          brightness: e.detail.value,
        })
      }
    })
  },
  getBrightness() {
    wx.getScreenBrightness({
      success: res => {
        wx.alert({
          content: `当前屏幕亮度：${res.brightness}`
        });
      }
    })
  }
});