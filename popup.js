'use strict';

$(() => {
  blackListHandler.init(() => {
    appendList(blackListHandler.list());
  });

  $('#add').click(onAddClick);

  $('#url').on('keypress', (e) => {
    if (e.keyCode === 13) {
      onAddClick();
    }
  });

  $('#force').click(onForce);
  checkForce();

  // 解锁按钮点击事件
  $('#emergency-unlock').click(emergencyUnlock);

  // 绑定下载规则按钮点击事件
  $('#download-rules').click(downloadRules);

  // 绑定上传规则按钮点击事件
  $('#trigger-upload').click(() => {
    $('#upload-rules').click();
  });

  // 官网按钮跳转逻辑
  $('#webhome').click(() => {
    window.open('https://github.com/QsSama-W/Web-blocking', '_blank');
  });

  // 监听文件选择事件
  $('#upload-rules').on('change', uploadRules);
})

let force = false;

// force
/**
 * 检测是否锁定
 */
function checkForce() {
  chrome.storage.local.get(['force'], (res) => {
    force = !!res.force;
    if (force) {
      $('#force').html('已锁定').addClass('off');
      $('#add').addClass('off');
      $('#list li .close').hide();
    } else {
      // 不在锁定状态
      chrome.storage.local.set({
        force: false
      });
      $('#force').html('点击锁定').removeClass('off');
      $('#add').removeClass('off');
      $('#list li .close').show();
    }
  });
}

function onForce() {
  if (confirm('开启后无法删减屏蔽列表，直到手动解除锁定')) {
    chrome.storage.local.set({
      force: true
    }, () => {
      checkForce();
    });
  }
}

// list
function onAddClick() {
  let url = $('#url').val();
  if (url === '') return;
  // 自动添加协议头
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  url = removeProtocol(url);
  if (url.length <= 3 && !confirm(`确定要屏蔽【${url}】吗？`)) {
    return;
  }
  if (blackListHandler.list().indexOf(url) > -1) {
    alert('添加失败，已存在该网址');
    return;
  }
  appendItem(url, blackListHandler.size());
  blackListHandler.append(url);
  $('#url').val('');
}

function closeItem(url, index) {
  if (force) {
    alert('目前无法删除');
    return;
  }

  blackListHandler.splice(url);
  $('#list li').eq(index).remove();
}

function appendList(list) {
  list.forEach((url, index) => {
    appendItem(url, index);
  });
}

function appendItem(url, index) {
  const el = $(`<li>${url} <span class="close"></span></li>`);
  $('#list').append(el);
  el.click(() => {
    closeItem(url, index);
  });
}

// blackListHandler
const blackListHandler = {
  KEY: 'CHANDING_BLACKLIST',
  blackList: [],
  init(cb) {
    this._readList().then((blackList) => {
      this.blackList = blackList;
      cb && cb();
    });
  },
  size() {
    return this.blackList.length;
  },
  list() {
    return this.blackList;
  },
  append(url) {
    if (url === '') return;
    this.blackList.push(url);
    this._saveList(this.blackList);
  },
  splice(url) {
    const index = this.blackList.findIndex(item => item === url);
    if (index === -1) {
      return;
    }
    this.blackList.splice(index, 1);
    this._saveList(this.blackList);
  },
  clear() {
    this.blackList = [];
    chrome.storage.local.remove(this.KEY);
  },
  _saveList(list) {
    if (Array.isArray(list)) {
      chrome.storage.local.set({
        blackList: list
      });
    }
  },
  _readList() {
    return new Promise((resolve) => {
      chrome.storage.local.get('blackList', function (res) {
        const blackList = res.blackList ? res.blackList : [];
        resolve(blackList);
      });
    });
  }
};

// 解锁函数
function emergencyUnlock() {
  if (confirm('确定要进行解锁吗？')) {
    chrome.storage.local.set({
      force: false
    }, () => {
      checkForce();
      alert('解锁成功');
    });
  }
}

// 下载规则函数
function downloadRules() {
  const blackList = blackListHandler.list();
  const jsonData = JSON.stringify(blackList, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rules.json';
  a.click();
  URL.revokeObjectURL(url);
}

// 上传规则函数
function uploadRules() {
  const file = $('#upload-rules')[0].files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const blackList = JSON.parse(e.target.result);
        if (Array.isArray(blackList)) {
          blackListHandler.clear();
          blackList.forEach(url => {
            url = removeProtocol(url);
            blackListHandler.append(url);
          });
          $('#list').empty();
          appendList(blackList);
          alert('规则上传成功');
        } else {
          alert('上传的文件格式不正确');
        }
      } catch (error) {
        alert('上传的文件格式不正确');
      }
    };
    reader.readAsText(file);
  }
}

// 去除协议头的函数
function removeProtocol(url) {
  return url.replace(/^https?:\/\//, '');
}
