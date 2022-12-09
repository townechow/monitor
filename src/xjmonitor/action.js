
// xj_track_click_download  前缀_flag_类型_名称

class Action {
  constructor(options, report) {
    this.actions = options.actions || ["click", "touchend", "mouseover"];
    this.actionPrefix = options.actionPrefix || "xj";
    this.report = report;
  }

  addEvent() {
    const _this = this;
    this.actions.forEach((action) => {
      document.addEventListener(action, (e) => _this.actReport(action, e));
    });
  }
  actReport(action, e) {
    const { id, className, classList, outerHTML, dataset } = e.target;
    // 如果 存在 class 以指定前缀开头写需要上报
    const prefix = `${this.actionPrefix}_track_${action}_`;
    const tracker = [...classList].filter((name) => name.startWith(prefix))[0];
    if (tracker) {
      this.report({
        kind: "business",
        type: action, // 不同数据类型
        name: tracker.replace(prefix, ""),
        data: {
          outerHTML,
          data: dataset[`${this.actionPrefix}_track_data`] || null,
        },
      });
    }
  }
}

export default Action;
