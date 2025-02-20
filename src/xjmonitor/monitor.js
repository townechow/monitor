let SDK = null; // EasyAgentSDK 实例对象
const QUEUE = []; // 任务队列
const NOOP = (v) => v;
import Action from "./action";

/* 
{
  appId: '', // 当前应用唯一标识
  apiUrl: '', // 接口地址
  pageUrl: '', // 页面地址
  userId: '', // 当前用户 id
  userName: '', // 当前用户 name
  time: '',// 触发记录的时间
  kind: "stability", // 监控指标的大类，stability-稳定性| experience-用户体验指标 | business-业务
  type: "error", // 小类型，这是一个错误
  data: {}, // 接口响应结果 | 性能指标 | 错误对象 | 用户操作相关信息
}
*/

// 通过 web-vitals 页面性能指标
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry); // 布局偏移量
      getFID(onPerfEntry); // 首次输入延迟时间
      getFCP(onPerfEntry); // 首次内容渲染时间
      getLCP(onPerfEntry); // 首次最大内容渲染时间
      getTTFB(onPerfEntry); // 首个字节到达时间
    });
  }
};

export default class EasyAgentSDK {
  appId = "";
  baseUrl = "";
  timeOnPage = 0;
  config = {};
  onPageShow = null;
  onPagesHide = null;

  constructor(options = {}) {
    if (SDK) return;
    SDK = this;

    this.appId = options.appId;
    this.baseUrl = options.baseUrl || window.location.origin;
    this.onPageShow = options.onPageShow || NOOP;
    this.onPagesHide = options.onPagesHide || NOOP;
    this.action = new Action(options, this.report);
  }
  init() {
    // 初始化监听页面变化
    this.listenPage();
  }

  // 设置 config
  setConfig(congfig) {
    this.config = congfig;
  }

  // 刷新任务队列
  flushQueue() {
    Promise.resolve().then(() => {
      QUEUE.forEach((fn) => fn());
      QUEUE.length = 0;
    });
  }

  // 监听页面变化
  listenPage() {
    let pageShowTime = 0;

    window.addEventListener("pageshow", () => {
      // mdn pageshow: 当一条会话历史记录被执行的时候将会触发页面显示 (pageshow) 事件。(这包括了后退/前进按钮操作，同时也会在 onload 事件触发后初始化页面时触发，切换tab不会触发)
      // 注意与 visibilitychange 的区别
      pageShowTime = performance.now();

      // 页面性能指标上报
      reportWebVitals((data) => {
        this.performanceReport({ data });
      });

      // 执行 onPageShow
      this.onPageShow();
    });

    window.addEventListener("pagehide", () => {
      // 记录用户在页面停留时间
      this.timeOnPage = performance.now() - pageShowTime;

      // 刷新队列前执行 onPageShow
      this.onPageShow();

      // 刷新任务队列
      this.flushQueue();
    });
  }

  // Json 转 FormData
  json2FormData(data) {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    return formData;
  }

  // 自定义上报类型
  report(config) {
    QUEUE.push(() => {
      const formData = json2FormData({
        ...this.config,
        ...config,
        time: new Date().toLocaleString(),
        appId: this.appId,
        pageUrl: window.location.href,
      });
      navigator.sendBeacon(`${this.baseUrl}${config.url || ""}`, formData);
    });
  }

  // 用户行为上报
  actionReport(config) {
    this.report({
      ...config,
      type: "action",
    });
  }

  // 网络状况上报
  networkReport(config) {
    this.report({
      ...config,
      type: "network",
    });
  }

  // 页面性能指标上报
  performanceReport(config) {
    this.report({
      ...config,
      type: "performance",
    });
  }

  // 错误警告上报
  errorReport(config) {
    this.report({
      ...config,
      type: "error",
    });
  }
}
