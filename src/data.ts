export type L10n = { en: string; hk: string; zh: string }
export type Lang = keyof L10n

const u = (id: string) => `${import.meta.env.BASE_URL}dishes/${id}.webp`

export const HERO = `${import.meta.env.BASE_URL}assets/welcome-hero.webp`

export const HOME_HERO = `${import.meta.env.BASE_URL}assets/home-banner-localized.webp`
export const HOME_AVATAR = `${import.meta.env.BASE_URL}assets/member-avatar.png`

export type Category = { id: string; name: L10n; thumb: string }
export type Dish = {
  id: string
  category: string
  name: L10n
  desc: L10n
  price: number
  oldPrice?: number
  unit: L10n
  image: string
  tag?: keyof typeof dishTags
  soldOut?: boolean
}

const L = (en: string, hk: string, zh: string): L10n => ({ en, hk, zh })

export const dishTags = {
  signature: L('Signature', '招牌', '招牌'),
  sharing: L('Sharing', '分享', '分享'),
  popular: L('Popular', '人氣', '人气'),
  seasonal: L('Seasonal', '時令', '时令'),
}

export const categories: Category[] = [
  { id: 'sets', name: L('Set meals', '精選套餐', '精选套餐'), thumb: `${import.meta.env.BASE_URL}dishes/baked-pork-rice.webp` },
  { id: 'dimsum', name: L('Hong Kong Snacks', '港式小食', '港式小食'), thumb: u('1558226933-792c5fe24e3b') },
  { id: 'mains', name: L('Tea Room Classics', '冰室常餐', '冰室常餐'), thumb: `${import.meta.env.BASE_URL}dishes/baked-pork-rice.webp` },
  { id: 'roast', name: L('Roast & Rice', '燒味飯', '烧味饭'), thumb: u('1785899578127-f3883106c735') },
  { id: 'noodles', name: L('Noodles', '粉麵', '粉面'), thumb: u('1763994685090-c0927ff195d1') },
  { id: 'sweets', name: L('Milk Tea & Sweets', '奶茶甜品', '奶茶甜品'), thumb: u('1607914770021-82956c49ec03') },
]

const basket = L('basket', '籠', '笼')
const plate = L('plate', '碟', '碟')
const bowl = L('bowl', '碗', '碗')
const glass = L('glass', '杯', '杯')
const piece = L('2 pcs', '2件', '2件')

export const dishes: Dish[] = [
  {
    id: 'set1', category: 'sets', name: L('Baked Pork Chop Rice Set', '焗豬扒飯套餐', '焗猪扒饭套餐'),
    desc: L('Baked pork chop rice with a choice of drink.', '焗豬扒飯配精選飲品一杯。', '焗猪扒饭配精选饮品一杯。'),
    price: 98, unit: L('set', '份', '份'), image: `${import.meta.env.BASE_URL}dishes/baked-pork-rice.webp`, tag: 'signature',
  },
  {
    id: 'set2', category: 'sets', name: L('Char Siu & Egg Rice Set', '叉燒煎蛋飯套餐', '叉烧煎蛋饭套餐'),
    desc: L('Char siu and egg rice with a choice of drink.', '叉燒煎蛋飯配精選飲品一杯。', '叉烧煎蛋饭配精选饮品一杯。'),
    price: 78, unit: L('set', '份', '份'), image: `${import.meta.env.BASE_URL}dishes/char-siu-egg-rice.webp`, tag: 'popular',
  },
  {
    id: 'set3', category: 'sets', name: L('Wonton Noodle Set', '鮮蝦雲吞麵套餐', '鲜虾云吞面套餐'),
    desc: L('Shrimp wonton noodles with a choice of drink.', '鮮蝦雲吞麵配精選飲品一杯。', '鲜虾云吞面配精选饮品一杯。'),
    price: 88, unit: L('set', '份', '份'), image: `${import.meta.env.BASE_URL}dishes/wonton-noodles.webp`,
  },
  {
    id: 'ds1',
    category: 'dimsum',
    name: L('Crystal Shrimp Dumplings', '筍尖鮮蝦餃', '笋尖鲜虾饺'),
    desc: L('Whole tiger prawns and bamboo shoots in a translucent wrapper, steamed to order.', '原隻虎蝦配筍尖，水晶外皮即叫即蒸。', '原只虎虾配笋尖，水晶外皮即叫即蒸。'),
    price: 58,
    unit: basket,
    image: u('1558226933-792c5fe24e3b'),
  },
  {
    id: 'ds2',
    category: 'dimsum',
    name: L('Xiao Long Bao', '上海小籠包', '上海小笼包'),
    desc: L('Delicate pork soup dumplings with ginger-black vinegar.', '皮薄湯多，配薑絲黑醋。', '皮薄汤多，配姜丝黑醋。'),
    price: 52,
    unit: basket,
    image: u('1779333277496-a5106680169c'),
  },
  {
    id: 'ds3',
    category: 'dimsum',
    name: L("Chef's Dim Sum Platter", '師傅點心拼盤', '师傅点心拼盘'),
    desc: L('Siu mai, har gow and seasonal steamed dumplings for sharing.', '燒賣、蝦餃及時令蒸點，適合分享。', '烧卖、虾饺及时令蒸点，适合分享。'),
    price: 128,
    oldPrice: 148,
    unit: basket,
    image: u('1756367201317-3d1494092529'),
    tag: 'sharing',
  },
  {
    id: 'r1',
    category: 'roast',
    name: L('Roast Pork & Egg Rice', '叉燒煎蛋飯', '叉烧煎蛋饭'),
    desc: L('Honey char siu, sunny egg and greens over rice.', '蜜汁叉燒、煎蛋配時菜，白飯底。', '蜜汁叉烧、煎蛋配时菜，白饭底。'),
    price: 58,
    unit: plate,
    image: `${import.meta.env.BASE_URL}dishes/char-siu-egg-rice.webp`,
  },
  {
    id: 'r2',
    category: 'roast',
    name: L('Honey Char Siu Rice', '蜜汁叉燒飯', '蜜汁叉烧饭'),
    desc: L('Iberico pork shoulder, slow roasted and lacquered with honey.', '西班牙黑毛豬肩肉，慢火燒製，蜜汁亮澤。', '西班牙黑毛猪肩肉，慢火烧制，蜜汁亮泽。'),
    price: 52,
    unit: plate,
    image: u('1768204037765-2c744f4330ca'),
  },
  {
    id: 'm1',
    category: 'mains',
    name: L('Baked Pork Chop Rice', '焗豬扒飯', '焗猪扒饭'),
    desc: L('Pork chop baked with tomato and melted cheese over fried rice.', '厚切豬扒配鮮茄芝士焗飯，茶餐廳經典。', '厚切猪扒配鲜茄芝士焗饭，茶餐厅经典。'),
    price: 88,
    oldPrice: 98,
    unit: plate,
    image: `${import.meta.env.BASE_URL}dishes/baked-pork-rice.webp`,
  },
  {
    id: 'm2',
    category: 'mains',
    name: L('Black Pepper Beef Ho Fun', '黑椒牛肉炒河', '黑椒牛肉炒河'),
    desc: L('Wok-fried rice noodles with beef and black pepper.', '河粉大火快炒，牛肉嫩滑，黑椒香濃。', '河粉大火快炒，牛肉嫩滑，黑椒香浓。'),
    price: 68,
    unit: plate,
    image: u('1561282664-b780e60a3e7f'),
  },
  {
    id: 'n1',
    category: 'noodles',
    name: L('Shrimp Wonton Noodles', '鮮蝦雲吞麵', '鲜虾云吞面'),
    desc: L('Springy egg noodles and shrimp wontons in a dried-flounder broth.', '銀絲細麵配鮮蝦雲吞，大地魚湯底。', '银丝细面配鲜虾云吞，大地鱼汤底。'),
    price: 68,
    unit: bowl,
    image: `${import.meta.env.BASE_URL}dishes/wonton-noodles.webp`,
  },
  {
    id: 'sw1',
    category: 'sweets',
    name: L('Baked Egg Tarts', '酥皮蛋撻', '酥皮蛋挞'),
    desc: L('Flaky puff pastry with silky egg custard, fresh from the oven.', '千層酥皮，蛋漿嫩滑，即日新鮮出爐。', '千层酥皮，蛋浆嫩滑，即日新鲜出炉。'),
    price: 32,
    unit: piece,
    image: u('1607914770021-82956c49ec03'),
  },
  {
    id: 'sw2',
    category: 'sweets',
    name: L('Mango Pomelo Sago', '楊枝甘露', '杨枝甘露'),
    desc: L('Chilled mango cream with pomelo pearls and sago.', '香滑芒果配柚子肉及西米，冰涼消暑。', '香滑芒果配柚子肉及西米，冰凉消暑。'),
    price: 48,
    unit: bowl,
    image: u('1642614696258-6eadac9705f0'),
  },
  {
    id: 'sw3',
    category: 'sweets',
    name: L('Iced HK Milk Tea', '凍港式奶茶', '冻港式奶茶'),
    desc: L('Silky pantyhose-brewed tea with evaporated milk.', '絲襪拉茶，香濃順滑。', '丝袜拉茶，香浓顺滑。'),
    price: 32,
    unit: glass,
    image: u('1558122104-355edad709f6'),
  },
  {
    id: 'sw4',
    category: 'sweets',
    name: L('Iced Lemon Tea', '凍檸茶', '冻柠茶'),
    desc: L('Ceylon black tea with fresh lemon slices.', '錫蘭紅茶配鮮檸檬片。', '锡兰红茶配鲜柠檬片。'),
    price: 30,
    unit: glass,
    image: u('1556679343-c7306c1976bc'),
  },
]


/* ---------- Customisation ---------- */
export type Option = { id: string; name: L10n; price?: number }
export type OptionGroup = { id: string; name: L10n; type: 'single' | 'multi'; size?: boolean; options: Option[] }

const g = (id: string, name: L10n, type: 'single' | 'multi', opts: [string, L10n, number?][], size = false): OptionGroup => ({
  id,
  name,
  type,
  size,
  options: opts.map(([oid, n, price]) => ({ id: `${id}.${oid}`, name: n, price })),
})

const G = {
  setDrink: g('setDrink', L('Choose a drink', '選擇套餐飲品', '选择套餐饮品'), 'single', [
    ['hotMilkTea', L('Hot milk tea', '熱奶茶', '热奶茶')],
    ['hotLemonTea', L('Hot lemon tea', '熱檸茶', '热柠茶')],
    ['icedMilkTea', L('Iced milk tea', '凍奶茶', '冻奶茶'), 3],
    ['icedLemonTea', L('Iced lemon tea', '凍檸茶', '冻柠茶'), 3],
  ]),
  setExtra: g('setExtra', L('Add-ons', '套餐加配', '套餐加配'), 'multi', [
    ['eggTart', L('Egg tart', '酥皮蛋撻', '酥皮蛋挞'), 12],
    ['soup', L('Soup of the day', '是日餐湯', '是日餐汤'), 10],
  ]),
  spice: g('spice', L('Spice level', '辣度', '辣度'), 'single', [
    ['0', L('Not spicy', '不辣', '不辣')],
    ['1', L('Mild', '小辣', '微辣')],
    ['2', L('Medium', '中辣', '中辣')],
    ['3', L('Hot', '大辣', '特辣')],
  ]),
  hold: g('hold', L('Hold the…', '走料', '忌口'), 'multi', [
    ['scallion', L('No spring onion', '走蔥', '不要葱')],
    ['ginger', L('No ginger', '走薑', '不要姜')],
    ['garlic', L('No garlic', '走蒜', '不要蒜')],
    ['coriander', L('No coriander', '走芫荽', '不要香菜')],
  ]),
  sauce: g('sauce', L('Dipping sauce', '醬料', '酱料'), 'multi', [
    ['chili', L('Chili oil', '辣椒油', '辣椒油')],
    ['vinegar', L('Black vinegar', '黑醋', '黑醋')],
    ['xo', L('XO sauce', 'XO 醬', 'XO 酱'), 8],
  ]),
  portion: g('portion', L('Portion', '份量', '份量'), 'single', [
    ['S', L('Regular', '例牌', '例份')],
    ['M', L('Medium', '中份', '中份'), 60],
    ['L', L('Large', '大份', '大份'), 120],
  ]),
  // Cup sizes are rendered as size tiles (drinks only)
  cup: g(
    'cup',
    L('Size', '杯型', '杯型'),
    'single',
    [
      ['M', L('Regular', '標準', '标准')],
      ['L', L('Large', '大杯', '大杯'), 6],
    ],
    true,
  ),
  fish: g('fish', L('Preparation', '做法', '做法'), 'single', [
    ['steam', L('Steamed with ginger & scallion', '薑蔥清蒸', '姜葱清蒸')],
    ['bean', L('Black bean sauce', '豉汁蒸', '豉汁蒸')],
    ['salt', L('Salt & pepper', '椒鹽', '椒盐'), 20],
  ]),
  noodle: g('noodle', L('Noodle type', '麵質', '面质'), 'single', [
    ['thin', L('Thin egg noodles', '細蓉麵', '细面')],
    ['flat', L('Flat rice noodles', '河粉', '河粉')],
    ['vermicelli', L('Rice vermicelli', '米粉', '米粉')],
  ]),
  sweet: g('sweet', L('Sweetness', '甜度', '甜度'), 'single', [
    ['normal', L('Regular', '正常', '正常')],
    ['less', L('Less sweet', '少甜', '少糖')],
    ['none', L('No sugar', '走甜', '无糖')],
  ]),
  ice: g('ice', L('Ice', '冰量', '冰量'), 'single', [
    ['normal', L('Regular ice', '正常冰', '正常冰')],
    ['less', L('Less ice', '少冰', '少冰')],
    ['none', L('No ice', '走冰', '去冰')],
  ]),
}

export const dishOptions: Record<string, OptionGroup[]> = {
  set1: [G.setDrink, G.setExtra],
  set2: [G.setDrink, G.setExtra],
  set3: [G.setDrink, G.setExtra],
  // ds1, ds3, sw1, sw2: no choices — "+" adds straight to the cart
  ds2: [G.sauce, G.hold],
  r1: [G.portion, G.hold],
  r2: [G.portion],
  m1: [G.portion, G.hold],
  m2: [G.portion, G.spice, G.hold],
  n1: [G.noodle, G.spice, G.hold],
  sw3: [G.cup, G.sweet, G.ice],
  sw4: [G.cup, G.sweet, G.ice],
}

/** Product-specific prompts for the free-text request field. */
export const dishHints: Record<string, L10n> = {
  ds1: L('e.g. cut in half for kids, extra soy on the side', '例如：小朋友食，幫手剪開', '例如：给小朋友吃，帮忙剪开'),
  ds2: L('e.g. extra ginger shreds, vinegar on the side', '例如：多啲薑絲、醋另上', '例如：多放姜丝、醋另放'),
  ds3: L('e.g. no pork, serve all at once', '例如：唔要豬肉、一次過上', '例如：不要猪肉、一次上齐'),
  r1: L('e.g. less rice, extra sauce, goose leg', '例如：少飯、多汁、要鵝髀', '例如：少饭、多汁、要鹅腿'),
  r2: L('e.g. leaner cut, sauce on the side', '例如：要半肥瘦、汁另上', '例如：要半肥瘦、汁另放'),
  m1: L('e.g. less rice, sauce on the side', '例如：少飯、醬汁另上', '例如：少饭、酱汁另上'),
  m2: L('e.g. extra onion, less oil', '例如：多洋蔥、少油', '例如：多洋葱、少油'),
  n1: L('e.g. firm noodles, soup on the side', '例如：麵要硬身、湯另上', '例如：面要硬一点、汤另放'),
  sw1: L('e.g. serve fresh from the oven', '例如：要即焗熱辣辣', '例如：要现烤热乎的'),
  sw2: L('e.g. less sago, extra mango', '例如：少西米、多芒果', '例如：少西米、多芒果'),
  sw3: L('e.g. condensed milk instead of sugar', '例如：茶走（煉奶代糖）', '例如：用炼奶代替糖'),
  sw4: L('e.g. lemon on the side', '例如：檸檬另上', '例如：柠檬另放'),
}

export const allOptions: Record<string, Option> = Object.fromEntries(
  Object.values(G).flatMap((grp) => grp.options.map((o) => [o.id, o])),
)

export const strings = {
  restaurant: L('Lai Wah Cafe', '麗華冰室', '丽华冰室'),
  meta: L('Cantonese Cuisine · Central, Hong Kong', '粵菜 · 香港中環', '粤菜 · 香港中环'),
  headline1: L('Authentic', '地道', '地道'),
  headline2: L('Cantonese,', '粵式滋味', '粤式滋味'),
  headlineAccent: L('served to you', '即點即上', '即点即上'),
  all: L('All', '全部', '全部'),
  items: L('items', '項', '项'),
  add: L('Add to cart', '加入購物車', '加入购物车'),
  viewCart: L('Review order', '查看點單', '查看点单'),
  cart: L('Your order', '我的點單', '我的点单'),
  emptyCart: L('Nothing ordered yet', '尚未點餐', '尚未点餐'),
  emptyCartHint: L('Browse the menu and add your favourites.', '瀏覽菜單，挑選心水菜式。', '浏览菜单，挑选心仪菜式。'),
  note: L('Note for the kitchen (allergies, less salt…)', '給廚房的備註（過敏、少鹽等）', '给厨房的备注（过敏、少盐等）'),
  subtotal: L('Subtotal', '小計', '小计'),
  receiptNumber: L('Receipt sequence', '流水號', '流水号'),
  orderType: L('Order type', '訂單類型', '订单类型'),
  settledAt: L('Checkout time', '結帳時間', '结账时间'),
  receiptBreakdown: L('Charges and discounts', '費用與優惠明細', '费用与优惠明细'),
  discount: L('Discount', '優惠', '优惠'),
  tip: L('Tip', '小費', '小费'),
  packagingFee: L('Packaging fee', '包裝費', '包装费'),
  quantity: L('Quantity', '數量', '数量'),
  customize: L('Customize dish', '選擇菜品規格', '选择菜品规格'),
  inCart: L('In cart', '購物車已有', '购物车已有'),
  service: L('Service charge', '服務費', '服务费'),
  total: L('Total', '總計', '总计'),
  placeOrder: L('Send to kitchen', '確認落單', '确认下单'),
  orderPlaced: L('Order sent to the kitchen', '已成功落單', '已成功下单'),
  orders: L('My orders', '我的訂單', '我的订单'),
  noOrders: L('No orders yet', '暫無訂單', '暂无订单'),
  noOrdersHint: L('Orders placed at this table appear here.', '本枱已落的訂單會顯示於此。', '本桌已下的订单会显示在这里。'),
  preparing: L('Preparing', '製作中', '制作中'),
  language: L('Language', '語言', '语言'),
  callTitle: L('How can we help?', '需要甚麼服務？', '需要什么服务？'),
  callWaiter: L('Call a server', '呼叫侍應', '呼叫服务员'),
  water: L('Refill tea', '加茶', '加茶'),
  cutlery: L('Extra cutlery', '添加餐具', '添加餐具'),
  callSent: L('A team member is on the way', '侍應即將為您服務', '服务员马上就到'),
  noResults: L('No matches found', '找不到相關菜式', '没有找到相关菜品'),
  cancel: L('Cancel', '取消', '取消'),
  categories: L('Menu sections', '菜單分類', '菜单分类'),
  menu: L('Menu', '菜單', '菜单'),
  search: L('Search', '搜尋', '搜索'),
  done: L('Done', '完成', '完成'),
  added: L('Added to your order', '已加入點單', '已加入点单'),
  order: L('Order', '訂單', '订单'),
  // Dining mode & entry
  welcome: L('Welcome to', '歡迎光臨', '欢迎光临'),
  chooseLanguage: L('Language', '語言', '语言'),
  chooseMode: L('How would you like to dine today?', '請選擇用餐方式', '请选择用餐方式'),
  dineIn: L('Dine in', '堂食', '堂食'),
  takeaway: L('Takeaway', '外帶', '外带'),
  dineInDesc: L('Served to your table', '坐低慢慢食', '堂内用餐'),
  takeawayDesc: L('Pick up at the counter', '櫃檯自取', '柜台自取'),
  pickupNo: L('Pickup no.', '取餐編號', '取餐编号'),
  noService: L('No service charge for takeaway', '外帶免收服務費', '外带免收服务费'),
  soldOut: L('Sold out', '已售罄', '已售罄'),
  checkout: L('Checkout', '去結算', '去结算'),
  clear: L('Clear', '清空', '清空'),
  addMore: L('Order more', '繼續加單', '继续加单'),
  ordered: L('Ordered', '已點', '已点'),
  checkoutTitle: L('Payment', '支付', '支付'),
  review: L('Review', '揀好了', '选好了'),
  continueOrder: L('Continue', '去下單', '去下单'),
  confirmTitle: L('Confirm order', '確認訂單', '确认订单'),
  confirmAddTitle: L('Confirm add-on', '確認加菜', '确认加菜'),
  submitOrder: L('Place order', '提交訂單', '提交订单'),
  payAfterAcceptance: L('Once the restaurant accepts, pay from Order details.', '商家接單後，可在訂單詳情付款', '商家接单后，可在订单详情付款'),
  phoneValidation: L('Enter an 8-digit Hong Kong mobile number.', '請輸入 8 位香港手機號碼', '请输入 8 位香港手机号码'),
  tableNumber: L('Table number', '桌號', '桌号'),
  awaitingAcceptance: L('Waiting for the restaurant', '等待商家接單', '等待商家接单'),
  merchantAccepted: L('Accepted by the restaurant', '商家已接單', '商家已接单'),
  orderCancelled: L('Order cancelled', '訂單已取消', '订单已取消'),
  rejectedHint: L('The restaurant did not accept this order. No payment is due.', '商家未接單，無須付款', '商家未接单，无需付款'),
  simulateMerchant: L('Demo · Restaurant controls', '原型演示 · 商家操作', '原型演示 · 商家操作'),
  simulateAccept: L('Accept order', '模擬接單', '模拟接单'),
  simulateReject: L('Reject order', '模擬拒單', '模拟拒单'),
  bill: L('Bill', '帳單', '账单'),
  balanceDue: L('Remaining amount', '剩餘應付', '剩余应付'),
  billTotal: L('Total', '總計', '总计'),
  confirmedPaid: L('Paid', '已付', '已付'),
  fullyPaid: L('Paid in full', '已付清', '已付清'),
  viewPayments: L('View payment history', '查看付款記錄', '查看付款记录'),
  paymentHistory: L('Payment history', '付款記錄', '付款记录'),
  goPay: L('Pay', '去付款', '去付款'),
  continuePay: L('Pay balance', '繼續付款', '继续付款'),
  paymentReceived: L('Paid', '已付', '已付'),
  confirmPaymentTitle: L('Confirm payment', '確認付款', '确认付款'),
  paymentAmount: L('Paying now', '本次付款', '本次付款'),
  changePaymentAmount: L('Change amount', '修改金額', '修改金额'),
  amountInvalid: L('Enter an amount above zero, with up to two decimal places.', '請輸入大於 0 的金額，最多兩位小數。', '请输入大于 0 的金额，最多两位小数。'),
  amountOverBalance: L('The amount cannot exceed the remaining amount.', '付款金額不可超過剩餘應付。', '付款金额不可超过剩余应付。'),
  balanceAfterPayment: L('Remaining after payment', '付款後剩餘', '付款后剩余'),
  confirmingPayment: L('Confirming your payment', '正在確認付款結果', '正在确认付款结果'),
  paymentLockHint: L('You can add dishes once the result is confirmed.', '付款結果確認後可繼續加菜', '付款结果确认后可继续加菜'),
  providerDemo: L('Simulated payment provider', '第三方付款模擬', '第三方付款模拟'),
  providerSuccess: L('Simulate successful payment', '模擬付款成功', '模拟付款成功'),
  providerCancel: L('Return without paying', '未付款返回', '未付款返回'),
  contact: L('Contact for pickup', '取餐聯絡資料', '取餐联系方式'),
  namePh: L('Name', '稱呼', '称呼'),
  phonePh: L('Mobile number', '手機號碼', '手机号码'),
  roundFirst: L('First order', '首單', '首单'),
  roundAdd: L('Add-on', '加菜', '加菜'),
  addDishes: L('Add dishes', '加菜', '加菜'),
  payWith: L('Pay with {m}', '使用 {m} 支付', '使用 {m} 支付'),
  counterConfirm: L('Pay at the counter', '確認到櫃檯付款', '确认到柜台付款'),
  counterTitle: L('Please pay at the counter', '請到櫃檯付款', '请到柜台付款'),
  counterHint: L('Show order #{n} to our staff', '向職員出示訂單 #{n} 即可', '向店员出示订单 #{n} 即可'),
  payFailed: L('Payment failed. Please try again.', '付款失敗，請重試', '支付失败，请重试'),
  payCancelled: L('Payment cancelled', '已取消付款', '已取消支付'),
  polling: L('Confirming your payment…', '正在確認付款結果…', '正在确认支付结果…'),
  stillProcessing: L('Still processing, please wait', '仍在處理中，請稍候', '仍在处理中，请稍候'),
  change: L('Change', '更換', '更换'),
  confirmPay: L('Confirm payment', '確認支付', '确认支付'),
  simulateFail: L('Simulate a failed payment', '模擬支付失敗', '模拟支付失败'),
  pickupTag: L('Pickup {p}', '取餐 {p}', '取餐 {p}'),
  address: L("2/F, 88 Queen's Road Central", '中環皇后大道中 88 號 2 樓', '中环皇后大道中 88 号 2 楼'),
  pickupStore: L('Pickup at', '取餐門店', '取餐门店'),
  yourItems: L('Your items', '已選菜品', '已选菜品'),
  callStore: L('Call restaurant', '致電餐廳', '致电餐厅'),
  pickupNoTitle: L('Pickup number', '取餐編號', '取餐编号'),
  payNow: L('Checkout', '結帳', '结账'),
  payMethod: L('Payment method', '付款方式', '付款方式'),
  pay: L('Pay', '支付', '支付'),
  paying: L('Processing…', '處理中…', '处理中…'),
  paidTitle: L('Payment successful', '付款成功', '支付成功'),
  thanks: L('Thank you for dining with us', '多謝光臨，期待再見', '感谢光临，期待再见'),
  receiptNo: L('Receipt', '收據編號', '收据编号'),
  paidWith: L('Paid with', '付款方式', '支付方式'),
  finish: L('Done', '完成', '完成'),
  card: L('Credit card', '信用卡', '信用卡'),
  octopus: L('Octopus', '八達通', '八达通'),
  counterPay: L('Pay at counter', '櫃檯付款', '柜台付款'),
  required: L('Required', '必選', '必选'),
  optional: L('Optional', '可選', '可选'),
  multiple: L('Choose any', '可多選', '可多选'),
  specialRequest: L('Special requests', '其他要求', '其他要求'),
  description: L('Description', '介紹', '介绍'),
  more: L('More', '更多', '更多'),
  less: L('Less', '收起', '收起'),
  price: L('Price', '價錢', '价格'),
  findDish: L('Find a dish or drink…', '搜尋菜式或飲品…', '搜索菜品或饮品…'),
  currencyNote: L('Prices in HKD', '價錢以港幣計算', '价格以港币计算'),
  pickupReadyEstimate: L('Ready ~15 min after ordering', '下單後約 15 分鐘可取餐', '下单后约 15 分钟可取餐'),
  successTitle: L('Order placed', '下單成功', '下单成功'),
  successDine: L('Your dishes will be served in about 15–20 min', '預計 15–20 分鐘上菜', '预计 15–20 分钟上菜'),
  successTake: L('Show this number at the counter', '請憑此編號到櫃檯取餐', '请凭此编号到柜台取餐'),
  tableTotal: L('Total so far', '本枱累計', '本桌累计'),
  history: L('Order history', '訂單記錄', '订单记录'),
  switchMode: L('Change dining mode', '更改用餐方式', '更改用餐方式'),
  backHome: L('Back to start', '返回首頁', '返回首页'),
} satisfies Record<string, L10n>
