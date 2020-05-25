let app = getApp();

/**
 * 页面加载时实时查询打印机列表,并缓存
 */
Page({
  data: {
    printMulti: 1,
    printer: [], //{id,name,statusReason}
    modalOpened4: true
  },
  onLoad() {
    !app.Data.dev && wx.showLoading({content: '查询打印机'}) && wx.ix.queryPrinter({
      success: (r) => {
        wx.hideLoading();
        let printer = r.usb;
        if(printer.length == 0){
          wx.showToast({title: '无打印机', icon:'none'});
        }
        this.setData({ printer: printer });
        app.Data.printer = printer;
        wx.setStorageSync('printer', printer);
      },
      fail: (r) => {
        wx.hideLoading();
        wx.showToast({title: r.errorMessage || '查询打印机失败', icon:'none'});
      }
    });
  },
  onUnload(){},
  onPrintMultiChange(v){
    app.Data.config.printMulti = v;
    wx.setStorageSync('config', app.Data.config);
  },
  printTest(){
    app.printer.printTest();
  },
  //添加打印机(待定)
  addPrinter(){
    wx.ix.startMonitorPrinter({
      'success':(r)=>{ console.log('监听打印机状态') }, 
      'fail':()=>{}
    });
    !this.Data.dev && wx.ix.printerStatus({success: (r) => {},fail: (r) => {}}).catch(err=>{
      wx.showToast({ title: err.errorMessage, icon:'none' });
    }); // 去掉这行无法在启动时获取到打印机
    wx.ix.onMonitorPrinter({
      'success':(r)=>{
        this.Data.printer = r.usb;
        let tips = '';
        if(r.usb.length){
          for(let i = 0, len = r.usb.length; i < len; i++){
            tips += r.usb[i].name + ' ' + r.usb[i].statusReason + (i == len - 1 ? '' : '\n');
          }
        }else{
          tips = '打印机未连接';
        }
        wx.showToast({title: tips, icon:'none'})
      }, 
      'fail':()=>{}
    });
    // wx.ix.offMonitorPrinter();
  }
});