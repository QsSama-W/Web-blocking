'use strict';

// 从本地存储获取黑名单和设置
chrome.storage.local.get(['blackList', 'setting'], function (res) {
  const blackList = res.blackList ? res.blackList : [];
  const setting = res.setting ? res.setting : {};
  const dateTime = setting.dateTime;

  // 检查当前页面 URL 是否需要屏蔽
  checkAndBlock(blackList, dateTime);

  // 监听 DOM 变化
  const observer = new MutationObserver(() => {
    checkAndBlock(blackList, dateTime);
  });

  const config = { childList: true, subtree: true };
  observer.observe(document.body, config);
});

// 检查并屏蔽页面的函数
function checkAndBlock(blackList, dateTime) {
  const currentUrl = window.location.href;
  if (blackList.some(item => matchUrl(item, currentUrl))) {
    // 停止页面加载
    window.stop();
    blockPage();
  }
}

// 检查日期时间是否在生效范围内的函数
function checkDateTime(dateTime) {
  const now = new Date();
  const nowWeek = now.getDay();
  const nowTime = Number(`${now.getHours()}.${fixNumber(now.getMinutes())}`);
  const settingStartTime = Number(dateTime.startTime.replace(':', '.'));
  const settingEndTime = Number(dateTime.endTime.replace(':', '.'));
  const settingWeeks = dateTime.weeks;
  return (
    settingWeeks.indexOf(nowWeek) > -1 && 
    nowTime >= settingStartTime && 
    nowTime < settingEndTime
  );
}

// 屏蔽页面的函数
function blockPage() {
  const template = `
    <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100vh; background: #fff;">
      <div style="margin-top: -100px;">
        <h1 style="font-size: 60px;">富强、民主、文明、和谐</h1>
        <h1 style="font-size: 60px;">自由、平等、公正、法治</h1>
        <h1 style="font-size: 60px;">爱国、敬业、诚信、友善</h1>
      </div>
    </div>
  `;
  document.body.innerHTML = template;
}

// 修复数字格式的函数
function fixNumber(number) {
  number = Number(number);
  if (number < 10) {
    return `0${number}`;
  }
  return `${number}`;
}

// 匹配 URL 的函数
function matchUrl(pattern, url) {
  // 将泛域名模式转换为正则表达式
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  const regex = new RegExp(regexPattern);
  return regex.test(url);
}