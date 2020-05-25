let app = getApp();

Page({
  data: {
    activeKey: 0,
    toView: '',
    goods: [],
    cats: [],
    total_price: 0,
    total_num: 0,
    trade_type: '', // face_code|bar_code|card
    paying: false, //支付中状态，支付按钮加载中状态
    viewMode: '1', //视图模式：1分类、2列表
    cartPanel: {
      show: false,
      cart: [], //部分浅拷贝goods
    },
    skuPanel: {
      show: false,
      title: '测试',
      goods_id: 1,
      _list: [], //xx商品的Sku, group的源数据
      group: {}, //规格组
      cur_sku: { path: '', data: {} }, //当前匹配的Sku { attr: x/x/x, price, cart_num}
    }
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
    this.setData({ viewMode: app.Data.config.mode.viewMode });
    app.request({
      method: 'post',
      url: app.api.goods_cat,
      success: res => {
        if(res.status == 0){
          return wx.showToast({title: res.message, icon:'none'})
        }
        let cats = res.contents.list;
        app.request({
          method: 'post',
          url: app.api.goods,
          success: res => {
            if (res.status == 0) {
              return wx.showToast({ title: res.message, icon: 'none' })
            }
            let list = res.contents.list, goods = {};
            if(this.data.viewMode == '1'){
              this.data.goods = list;
              for(let good of list){
                if (!goods[good.cat_id]){
                  goods[good.cat_id] = [];
                }
                goods[good.cat_id].push(good);
              }
              for(let cat of cats){
                cat.goods = goods[cat.cat_id];
              }
              this.setData({ cats })
            }else{
              this.setData({ goods: list });
            }
          }
        })
      }
    })
  },
  onShow: function () {
    app.page.onShow(this);
    if (this.data.viewMode != app.Data.config.mode.viewMode) {
      wx.redirectTo({ url: '/pages/cash/goods/goods' });
    }
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
  onPullDownRefresh: function () {

  },
  onReachBottom: function () {

  },
  onChangeSidebar(event) {
    this.setData({ toView: 'cat_' + this.data.cats[event.detail].cat_id })
  },
  addCart(e){
    let goods_id = e.target.dataset.goods_id,
        attr = e.target.dataset.attr,
        cat_index = '',
        goods_index = '',
        item = this.data.goods.find(v => v.goods_id == goods_id),
        sku = this.find_in_cart(goods_id, attr); //含无规格商品
    //多规格商品首次加购一定是从面板加购
    if (!sku) {
      //组合goods和sku作为独立商品加购
      sku = {
        ...item,
        goods_name: item.goods_name + (Number(item.use_attr) ? '(' + this.data.skuPanel.cur_sku.path + ')' : ''),
        attr: Number(item.use_attr) ? this.data.skuPanel.cur_sku.path : false,
        price: Number(item.use_attr) ? this.data.skuPanel.cur_sku.data.price : item.price,
        cart_num: 0,
      };
      this.data.cartPanel.cart.push(sku);
    }
    item.cart_num = item.cart_num >= 0 ? item.cart_num + 1 : 1;
    sku.cart_num = sku.cart_num >= 0 ? sku.cart_num + 1 : 1;
    let is_in_cart = this.data.cartPanel.cart.filter(v => v.goods_id == goods_id).length;
    if(!is_in_cart){
      this.data.cartPanel.cart.push(item);
    }
    let data = {
      'cartPanel.cart': this.data.cartPanel.cart.filter(v => v.cart_num > 0),
      total_num: this.data.total_num + 1,
      total_price: Number(this.data.total_price) + Number(sku.price) * 100,
    };
    //找到索引goods_index
    if (this.data.viewMode == '1') {
      this.data.cats.forEach((cat, index) => {
        if (cat.cat_id == item.cat_id) {
          cat_index = index;
          cat.goods.forEach((good, i) => {
            if (good.goods_id == item.goods_id) goods_index = i;
          })
        }
      });
      data['cats[' + cat_index + '].goods[' + goods_index + '].cart_num'] = item.cart_num;
    }else{
      goods_index = this.data.goods.findIndex( v => v.goods_id == goods_id );
      data['goods[' + goods_index + '].cart_num'] = item.cart_num;
    }
    if (this.data.skuPanel.show) {
      data['skuPanel.cur_sku.data.cart_num'] = sku.cart_num;
    }
    this.setData(data)
  },
  minusCart(e){
    let goods_id = e.target.dataset.goods_id,
      attr = e.target.dataset.attr,
      cat_index = '',
      goods_index = '',
      item = this.data.goods.filter(v => v.goods_id == goods_id)[0],
      sku = this.find_in_cart(goods_id, attr); //含无规格商品
    item.cart_num = item.cart_num > 0 ? item.cart_num - 1 : 0;
    sku.cart_num = sku.cart_num > 0 ? sku.cart_num - 1 : 0;
    let data = {
      'cartPanel.cart': this.data.cartPanel.cart.filter(v => v.cart_num > 0),
      total_num: this.data.total_num - 1,
      total_price: Number(this.data.total_price) - Number(sku.price) * 100,
    };
    //找到索引goods_index
    if (this.data.viewMode == '1') {
      this.data.cats.forEach((cat, index) => {
        if (cat.cat_id == item.cat_id) {
          cat_index = index;
          cat.goods.forEach((good, i) => {
            if (good.goods_id == item.goods_id) goods_index = i;
          })
        }
      });
      data['cats[' + cat_index + '].goods[' + goods_index + '].cart_num'] = item.cart_num;
    }else{
      goods_index = this.data.goods.findIndex(v => v.goods_id == goods_id);
      data['goods[' + goods_index + '].cart_num'] = item.cart_num;
    }
    if (this.data.total_num - 1 == 0) data['cartPanel.show'] = false;
    if (this.data.skuPanel.show) {
      data['skuPanel.cur_sku.data.cart_num'] = sku.cart_num;
    }
    this.setData(data);
  },
  toggleCart(){
    if (this.data.cartPanel.cart.length){
      this.setData({ 'cartPanel.show': !this.data.cartPanel.show })
    }
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
  showSkuPanel(e) {
    let goods_id = e.target.dataset.goods_id,
      item = this.data.goods.find(v => v.goods_id == goods_id);
    this.data.skuPanel.goods_id = goods_id;
    app.request({
      method: 'post',
      url: app.api.goods_detail,
      data: { goods_id: goods_id },
      success: (res) => {
        if (res.status == '0') {
          return wx.showToast({ icon: 'none', title: res.message });
        }
        let list = res.contents.data.attr;
        this.data.skuPanel._list = list;
        let sku_group = this.gen_group_from_sku_list(list, goods_id);
        this.setData({
          'skuPanel.goods_id': goods_id,
          'skuPanel.show': true,
          'skuPanel.title': item.goods_name,
          'skuPanel.group': sku_group.group,
          'skuPanel.cur_sku': sku_group.cur_sku,
        });
      }
    })
  },
  hideSkuPanel(e) {
    this.setData({
      'skuPanel.show': false
    })
  },
  gen_group_from_sku_list(list, goods_id) {
    let group = {};
    let cur_sku = {
      path: [],
      data: {},
    };
    for (let i in list) {
      let attr_list = list[i].attr_list;
      for (let j in attr_list) {
        let attr = attr_list[j], cur_group = group[attr.group_name];
        if (!cur_group) {
          cur_group = [];
        }
        let duplicate = false;
        for (let k in cur_group) {//去重
          if (cur_group[k].name == attr.name) {
            duplicate = true;
            break;
          }
        }
        if (!duplicate) {
          !cur_group.length && cur_sku.path.push(attr.name);//默认选中
          cur_group.push({ name: attr.name, active: cur_group.length ? false : true });
        }
        group[attr.group_name] = cur_group;
      }
    }
    cur_sku.path = cur_sku.path.join('/');
    cur_sku.data = this.find_sku_by_path(list, cur_sku.path, this.find_in_cart(goods_id, cur_sku.path));
    return {
      group: group,
      cur_sku: cur_sku,
    };
  },
  find_sku_by_path(list, cur_path, goods_in_cart) {
    const matched_sku = list.find(sku => {
      let path = sku.attr_list.reduce((acc, cur) => acc + (acc ? '/' : '') + cur.name, '');
      return path == cur_path;
    });
    //todo: 从购物车取加购数
    if (goods_in_cart) matched_sku.cart_num = goods_in_cart.cart_num;
    return matched_sku;
  },
  pick_attr(e) {
    let { group_name, attr_index } = e.target.dataset;
    let group_names = Object.keys(this.data.skuPanel.group);
    let group_index = 0;
    let path = this.data.skuPanel.cur_sku.path.split('/');
    group_names.forEach((v, i) => {
      if (v == group_name) group_index = i;
    })
    this.data.skuPanel.group[group_name].map((v, i) => {
      if (i == attr_index) {
        v.active = true;
        path[group_index] = v.name;
      } else {
        v.active = false;
      }
    });
    this.data.skuPanel.cur_sku.path = path.join('/');
    this.setData({
      'skuPanel.group': this.data.skuPanel.group,
      'skuPanel.cur_sku': {
        path: this.data.skuPanel.cur_sku.path,
        data: this.find_sku_by_path(this.data.skuPanel._list, this.data.skuPanel.cur_sku.path, this.find_in_cart(this.data.skuPanel.goods_id, this.data.skuPanel.cur_sku.path)),
      }
    });
  },
  find_in_cart(goods_id, attr = false) {
    return this.data.cartPanel.cart.find(v => {
      let has_goods_id = v.goods_id == goods_id;
      let has_sku = true;
      if (attr) {
        has_sku = v.attr == attr;
      }
      return has_goods_id && has_sku;
    });
  },
  noop(){
    return false;
  },
  memberPay() {
    wx.navigateTo({ url: '/pages/member/cash/cash?amount=' + this.data.total_price/100 })
  }
})