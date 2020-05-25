function initPrinter(complete = '') {
  console.log('初始化打印机')
  let app = getApp() || this;
  if (app.Data.dev) {
    wx.showToast({ content: '模拟器中打印机不可用' });
    return complete();
  }
  app.Data.printer = wx.getStorageSync('printer').data || [];
  if (app.Data.printer.length) {
    wx.hideToast();
    wx.showToast({ content: '已设置打印机：' + app.Data.printer.length });
    printTest(); //疑似蜻蜓Bug,机器重启后首次打印无效,暂时用打印测试页的方式解决
    complete && complete();
  } else {
    console.log('未获取到打印机，尝试查询');
    wx.ix.queryPrinter({
      success: (r) => {
        let printer = r.usb;
        if (printer.length) {
          this.Data.printer = printer;
          wx.hideToast();
          wx.showToast({ content: '已连接打印机：' + this.Data.printer.length });
          printTest(); //疑似蜻蜓Bug,机器重启后首次打印无效,暂时用打印测试页的方式解决
        } else {
          wx.hideToast();
          wx.showToast({ content: '未连接打印机' });
        }
        complete && complete();
      }
    });
  }
}

//打印测试
function printTest(multi = 0) {
  let app = getApp() || this;
  let amount = '123456.78',
    trade_gate = '测试',
    padlen = 0;

  multi = multi || app.Data.config.printMulti;
  padlen = 32 - 4 - (trade_gate.length * 2);
  trade_gate = '交易类型'.padEnd(padlen, ' ') + trade_gate;
  padlen = 32 - 5 - amount.length - 2;
  let amount1 = '订单总金额'.padEnd(padlen, ' ') + amount + '元';
  padlen = 32 - 4 - amount.length - 2;
  let amount2 = '商户实收'.padEnd(padlen, ' ') + amount + '元';
  let cmds = [
    { 'cmd': 'addSetFontForHRICharacter', 'args': ['FONTA'] },
    { 'cmd': 'addSelectCharacterFont', 'args': ['FONTA'] },
    { 'cmd': 'addSelectJustification', 'args': ['CENTER'] },
    { 'cmd': 'addSelectPrintModes', 'args': ['FONTA', 'OFF', 'ON', 'ON', 'OFF'] },
    { 'cmd': 'addText', 'args': ['打印测试'] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addSelectPrintModes', 'args': ['FONTA', 'OFF', 'OFF', 'OFF', 'OFF'] },
    { 'cmd': 'addText', 'args': ['--------------------------------'] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': [trade_gate] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': [amount1] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': [amount2] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': ['--------------------------------'] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addSelectJustification', 'args': ['LEFT'] },
    { 'cmd': 'addText', 'args': ['商户订单号: '] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addCODE128General', 'args': ['20190812125119359698', '400', '100'] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': ['日期时间:    ' + app.util.dateFormatter()] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': ['--------------------------------'] },
    { 'cmd': 'addPrintAndFeedLines', 'args': [2] }
  ];
  for (let i = 1; i < multi; i++) {
    cmds = [...cmds, ...cmds];
  }
  for (let p of app.Data.printer) {
    wx.ix.printer({
      target: p.id,
      cmds: cmds,
      success: (r) => { },
      fail: (r) => {
        console.warn(r.errorMessage)
      }
    }).catch(err => {
      //catch隐藏报错
    });
  }
}

//打印小票 一个中文字符占用两个长度，数字符号空格占用一个长度
function printReceipt(complete = res => { }) {
  let app = getApp() || this;
  if (app.Data.order.printed) return; //防重打
  app.Data.order.printed = true;
  let amount = app.Data.order.totalAmount,
    trade_gate = { alipay: '支付宝', weixin: '微信' }[app.Data.order.trade_gate] || '其它',
    padlen = 0;

  let multi = app.Data.config.printMulti;
  padlen = 32 - 4 - (trade_gate.length * 2);
  trade_gate = '交易类型'.padEnd(padlen, ' ') + trade_gate;
  padlen = 32 - 5 - amount.length - 2;
  let amount1 = '订单总金额'.padEnd(padlen, ' ') + amount + '元';
  padlen = 32 - 4 - amount.length - 2;
  let amount2 = '商户实收'.padEnd(padlen, ' ') + amount + '元';
  let cmds = [
    { 'cmd': 'addSetFontForHRICharacter', 'args': ['FONTA'] },
    { 'cmd': 'addSelectCharacterFont', 'args': ['FONTA'] },
    { 'cmd': 'addSelectJustification', 'args': ['CENTER'] },
    { 'cmd': 'addSelectPrintModes', 'args': ['FONTA', 'OFF', 'ON', 'ON', 'OFF'] },
    { 'cmd': 'addText', 'args': [app.Data.person.merchant_name] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addSelectPrintModes', 'args': ['FONTA', 'OFF', 'OFF', 'OFF', 'OFF'] },
    { 'cmd': 'addText', 'args': ['--------------------------------'] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': [trade_gate] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': [amount1] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': [amount2] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': ['--------------------------------'] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addSelectJustification', 'args': ['LEFT'] },
    { 'cmd': 'addText', 'args': ['商户订单号: '] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addCODE128General', 'args': [app.Data.order.out_trade_no, '400', '100'] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': ['日期时间:    ' + app.util.timestampFormatter(app.Data.order.time_create, 'Y-M-D h:m:s')] },
    { 'cmd': 'addPrintAndLineFeed', 'args': [] },
    { 'cmd': 'addText', 'args': ['--------------------------------'] },
    { 'cmd': 'addPrintAndFeedLines', 'args': [2] }
  ];
  for (let i = 1; i < multi; i++) {
    cmds = [...cmds, ...cmds];
  }
  if (!app.Data.printer.length) {
    complete();
    return false;
  }
  for (let p of app.Data.printer) {
    wx.ix.printer({
      target: p.id,
      cmds: cmds,
      success: (r) => {
        complete(r);
      },
      fail: (r) => {
        console.warn(r.errorMessage)
        complete(r);
      }
    }).catch(err => {
      //catch隐藏报错
    });;
  }
  console.log('打印小票')
}

module.exports = { initPrinter, printTest, printReceipt };