/**
 * Created by Michael Cartmel.
 */
// customised jquery ajax function for posting JSON
$.postJSON = function(url, data, callback) {
  return jQuery.ajax({
    'type': 'POST',
    'url': url,
    'contentType': 'application/json',
    'data': data,
    'dataType': 'json',
    'success': callback
  });
};

var counter = 0;

$.views.helpers({
  initObj: function (id, value) {
    if(!_.isPlainObject(value)) $.observable(this.data).setProperty(id, {});
    return true;
  },
  initArr: function (id, value) {
    if(!_.isArray(value)) $.observable(this.data).setProperty(id, []);
    return true;
  },
  cleanName: function (value) {
    return value.replace(unicodematch,'');
  },
  genid: function () {
    return counter++;
  },
  idxid: function (idx,id) {
    return !_.isUndefined(idx)? String(idx)+'_'+id : id;
  },
  sanitize: function(value, maxLength) {
    var value = JSON.stringify(value, null, 2);
    if (maxLength && value.length > maxLength) {
      return value.substring(0, maxLength ) + "...";
    }
    return value;
  },
  nicetime: function(value, long){
    if(long) return moment(value).format('MM-DD HH:mm:ss.SS');
    else return moment(value).format('Do MMM, h:mm a');
  },
  fromtime: function(value){
    return moment(value).from(moment(), true);
  },
  srcflt: function(item, i, items) {
    if(this.view.data.flt) {
      return item[this.props.srch].search(new RegExp(this.view.data.flt, "ig")) !== -1;
    }
    else return true;
  },
  encodr: function(value){
    return encodr(value);
  },
  initHid: function (id) {
    if(!(id in this.data)) Object.defineProperty(this.data, id, {enumerable:false, writable:true});
    return true;
  },
  highlight: function(value, sub) {
    sub = sub.replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&');
    var re = new RegExp("(.*)("+sub+")(.*)","ig");
    return value.replace(re, '$1<strong>$2</strong>$3')
  },
  stringify: function(value){
    return JSON.stringify(value);
  },
  isset: function(value){
    return(!_.isUndefined(value));
  },
  jsonhighlight: function(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = 'jsonnumber';
      if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'jsonkey';
          } else {
            cls = 'jsonstring';
          }
      } else if (/true|false/.test(match)) {
          cls = 'jsonboolean';
      } else if (/null/.test(match)) {
          cls = 'jsonnull';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  },
  sortReachable: function(a,b) {
    return b.reachable - a.reachable;
  }
});

$.views.helpers.sortReachable.depends = "**";

$.views.converters({
  intToStr: function(value) {
    return "" + value;
  },
  strToInt: function(value) {
    return isNaN(value) || value === '' ? null : parseFloat(value);
  }
});

$.fn.shiftSelectable = function() {
  var $container = this;
  var lastChecked;
  $container.on('click', 'label.multi input[type="checkbox"]', function(e) {
    if(e.shiftKey) {
      e.preventDefault();
    };
  });
  $container.on('mousedown', 'label.multi', function(e) {
    if(!lastChecked) {
        lastChecked = this;
        return;
    }
    var $boxes = $container.find('label.multi');
    if(e.shiftKey) {
        var start = $boxes.index(this),end = $boxes.index(lastChecked);
        var ischecked = $(lastChecked).find('input[type="checkbox"]').prop('checked');
        $boxes.slice(Math.min(start, end), Math.max(start, end) + 1).find('input[type="checkbox"]').prop('checked', ischecked).trigger('change');
        e.preventDefault();
    }
    lastChecked = this;
  });
};

var parseType = function(val, type) {
  switch(type){
    case "number":
      return parseFloat(val);
    case "string":
      return String(val);
    case "boolean":
      return Boolean(val);
  };
  return val;
}

var stringify = function(arg, type) {
  if($.isPlainObject(arg)) return JSON.stringify(arg);
  else if(type=="string") return '"'+arg+'"';
  else return arg;
};

var copyToClipboard = function(str) {
  var el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

// override json parse and stringify
var json_parse = JSON.parse;
var json_stringify = JSON.stringify;
var encpattern = /(^[0-9]|[^0-9a-zA-Z])/g;
var incpattern = /([^0-9a-zA-Z])/g;
var decpattern = /__([0-9]+)__/g;

var encodr = function(str, inc){
  if(!inc) {
    return str.replace(/\s/g, '').replace(encpattern, function(match, char){
      return '__'+char.charCodeAt(0)+'__';
    });
  } else {
    return str.replace(/\s/g, '').replace(incpattern, function(match, char){
      return '__'+char.charCodeAt(0)+'__';
    });
  }
};

var decodr = function(str){
  return str.replace(decpattern, function(match, code){
    return String.fromCharCode(code);
  });
};

JSON.stringify = function(data) {
  return json_stringify(data, function (key, value) {
    if (value && Object.prototype.toString.call(value) === '[object Object]') {
      var replacement = {};
      for (var k in value) {
        if (Object.hasOwnProperty.call(value, k)) {
          replacement[decodr(k)] = value[k];
        }
      }
      return replacement;
    }
    return value;
  });
};

JSON.parse = function(data) {
  return json_parse(data, function (key, value) {
    if (value && Object.prototype.toString.call(value) === '[object Object]') {
      for (var k in value) {
        if (/(^[0-9]|[^0-9a-zA-Z])/g.test(k) && Object.hasOwnProperty.call(value, k)) {
          value[encodr(k)] = value[k];
          delete value[k];
        }
      }
    }
    return value;
  });
};

// set global ajax timeout and disable cache, and specify JSON parser
$.ajaxSetup({timeout: 30000, cache: false, converters: {"text json": JSON.parse}});

var removeNulls = function(obj){
  var isArray = obj instanceof Array;
  for (var k in obj){
    if (obj[k]==="" || ((typeof obj[k]=="object") && ($.isEmptyObject(obj[k])))) {
      isArray ? obj.splice(k,1) : delete obj[k];
    } else if (typeof obj[k]=="object") removeNulls(obj[k]);
  }
}

navigator.issmart = (function(){
  var ua= navigator.userAgent;
  x= ua.match(/SMART-TV|ADAPI/i) ? true: false;
  return x;
})();

var updatepadding = function() {
  $('body').css('padding-top',  $('nav.navbar-fixed-top').outerHeight() + 20);
  $('body.hasfooter').css('padding-bottom',  $('footer.navbar-fixed-bottom').outerHeight() + 50);
  $('body > div.alert').css('top',  $('nav.navbar-fixed-top').outerHeight() + 8);
};

var updatemeter = function(el, val) {
  var pxheight = $(el).data('pxheight');
  if(!pxheight) {
    var pxheight = $(el).find('.bar').height() / 100;
    $(el).data('pxheight', pxheight);
  }
  var width = $(el).data('width');
  if(!width) {
    var width = $(el).find('.bar').width();
    $(el).data('width', width);
  }
  var bar = $(el).data('bar');
  if(!bar) {
    var bar = $(el).find('.bar');
    $(el).data('bar', bar);
  }
  var range = $(el).data('range');
  if(range=='db') var vl = 88*Math.pow(10,val/40);
  else var vl = val;
  if(vl > 100) vl = 100;
  if(vl < 0) vl = 0;
  $(bar).css('clip', 'rect('+((100-vl) * pxheight)+'px, '+width+'px, 100px, 0px)');
  var p = $(el).data('p');
  if(!p) {
    var p = $(el).find('p');
    $(el).data('p', p);
  }
  $(p).text(Math.floor(val));
};

var updatesignal = function(el, val) {
  var range = $(el).data('range');
  if(range=='db') var vl = 88*Math.pow(10,val/40);
  else var vl = val;
  if(vl > 100) vl = 100;
  if(vl < 0) vl = 0;
  $(el).attr('class', function(i, c){
    return c && c.replace(/\bmeter-colour-\S+/g, 'meter-colour-'+Math.round(vl));
  });
};

var getHost = function(url){
  var parser = document.createElement('a');
  parser.href = url;
  var host = parser.host;
  $(parser).remove();
  return host;
}

var getColours = function(){
  $.each(colours, function(key) {
    var dummy = $('<div class="text-'+key+'" style="display: none;"></div>').appendTo('body');
    colours[key] = dummy.css("color");
    dummy.remove();
  });
};

var caretToEnd = function(ele) {
  ele.focus();
  if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
    var range = document.createRange();
    range.selectNodeContents(ele);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (typeof document.body.createTextRange != "undefined") {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(ele);
    textRange.collapse(false);
    textRange.select();
  }
}

var alert = function(message, type, duration, body){
  var cls = type || "success";
  duration = _.isNumber(duration) ? duration : 3000;
  clearTimeout($('.alert').stop().data('timer'));
  $('.alert').removeClass('alert-danger alert-success alert-warning').addClass('alert-'+cls).children('div.message').empty().append('<span>'+message+'</span>');
  if(body) {
    body = $('<div/>').text(body).html()
    $('.alert').children('div.message').append('<br/><span class="detail">'+body+'</span>');
  }
  $('.alert').slideDown(function() {
    var elem = $(this);
    if(duration>0) $.data(this, 'timer', setTimeout(function() { elem.slideUp(); }, duration));
  });
  return false;
};

var checkRedirect = function(url) {
  $.get(url, function() {
    $('body').data('redirecttimeout', 0);
    window.location.href = url;
  }).fail(function(e) {
    // check again in one second
    if($('body').data('redirecttimeout')) $('body').data('redirecttimeout', $('body').data('redirecttimeout')+1);
    else $('body').data('redirecttimeout',1);
    $('body').data('redirect', setTimeout(function() { checkRedirect(url); }, 1000));
    alert('Redirecting. Waiting for node to become available ('+$('body').data('redirecttimeout')+')', 'info', 0);
  });
};

var node = host = nodename = nodedesc = ''; //= opts = '';
var converter = new Markdown.Converter();
var unicodematch = new XRegExp("[^\\p{L}\\p{N}]", "gi");
var simplematch = new RegExp(/^(.+?)(?:\(| \(|$)/i);
var colours = {'primary':'','success':'','danger':'','warning':'','info':'','default':''};
var throttle = {'logs': []};
var allowedtxt = ['py','xml','xsl','js','json','html','htm','css','java','groovy','sql','sh','cs','bat','ini','txt','md','cmd'];
var allowedbinary = ['png','jpg','ico'];
var nodeList = {'lst':[], 'flt':'', 'end':20, 'hosts':{}};
var nodeListreq = null;

var checkBindLinks = function(ev, eventArgs) {
  if((ev.type == "propertyChange") && (eventArgs.path == "reachable")) {
    var host = decodr(ev.data.observeAll.path().split(".").pop());
    var data = $.view($(".nodel-actsig")).data;
    var group = ['actions','events'];
    for (var y=0; y<group.length; y++) {
      for (var name in data[group[y]]) {
        if (data[group[y]].hasOwnProperty(name)) {
          for (var i=0; i<data[group[y]][name]._$link.length; i++) {
            if(data[group[y]][name]._$link[i].host == host) {
              $.observable(data[group[y]][name]._$link[i]).setProperty("reachable", eventArgs.value);
            }
          }
        }
      }
    }
  }
}

$.observable(nodeList).observeAll(checkBindLinks);

$(function() {
  host = document.location.hostname + ':' + window.document.location.port;
  $('.nodel-icon img').attr("src", "data:image/svg+xml;base64,"+generateHostIcon(host));
  $('.nodel-icon a').attr("href", window.document.location.protocol+"//"+host);
  $('.nodel-icon a').attr("title", host);
  if(navigator.issmart){
    $('head').append('<style>.fixed-table-body{overflow-y: hidden;} body{zoom: 140%}</style>');
  };
  getColours();
  // get the node name
  if(window.location.pathname.split( '/' )[1]=="nodes") node = decodeURIComponent(window.location.pathname.split( '/' )[2].replace(/\+/g, '%20'));
  if(node) {
    if($('body').hasClass('core')) $('.navbar-brand a').attr("href", window.document.location.protocol+"//"+host);
    getNodeDetails().then(function(){
      updatepadding();
      $.when(createDynamicElements().then(function(){
        convertNames();
        updateConsoleForm();
        updateLogForm();
        updateCharts();
        checkHostList();
        setEvents();
        updateLogs();
        // selecct page
        if(window.location.hash) $("*[data-nav='"+window.location.hash.substring(1)+"']").trigger('click');
        else $('*[data-nav]').first().trigger('click');
        // init scrollable divs
        $('.scrollbar-inner').scrollbar();
        // hide sects by default
        $(".sect").hide();
        // init editor
        initEditor();
        // init toolkit
        initToolkit();
        fillUIPicker();
        checkReload();
      }));
    });
  } else {
    $.when(createDynamicElements().then(function(){
      updatepadding();
      getNodeList();
      checkHostList();
      setEvents();
      updateLogForm();
      updateCharts();
      initToolkit();
      checkHostOnline();
      $('*[data-nav]').first().trigger('click');
      $('.nodelistfilter').focus();
    }));
  }
});

var isFileTransfer = function (e) {
  if (e.dataTransfer.types) {
    for (var i=0; i<e.dataTransfer.types.length; i++) {
      if (e.dataTransfer.types[i] == "Files") {
        return true;
      }
    }
  }
  return false;
};

var clearTimers = function(){
  if(!_.isUndefined($('body').data('nodel-console-timer'))) clearTimeout($('body').data('nodel-console-timer'));
  if(!_.isUndefined($('body').data('nodelistTimer'))) clearTimeout($('body').data('nodelistTimer'));
  if(!_.isUndefined($('body').data('timer'))) clearTimeout($('body').data('nodeltimeristTimer'));
}

var getNodeDetails = function(){
  var d = $.Deferred();
  $.getJSON('http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/', function(data) {
    if(!$('.navbar-brand #title').text()) $('.navbar-brand #title').text(getSimpleName(data.name));
    if(data.desc) $('.nodel-description').html(converter.makeHtml(data.desc));
    $('title').text(getSimpleName(data.name));
    nodename = data.name;
    nodedesc = data.desc;
  }).always(function(){
    d.resolve();
  });
  return d.promise();
};

var initEditor = function(){
  $('.nodel-editor textarea').each(function() {
    var ele = this;
    var editor = CodeMirror.fromTextArea(this, {
      lineNumbers: true,
      matchBrackets: true,
      autoRefresh: true,
      tabSize: 2
    });
    cmResize(editor, {resizableWidth: false});
    var counter = 0;
    editor.on('drop', function(data, e) {
      var file;
      var files;
      // Check if files were dropped
      files = e.dataTransfer.files;
      if (files.length > 0) {
        $(ele).closest('.editor').removeClass('drop');
        counter = 0;
        e.preventDefault();
        e.stopPropagation();
        file = files[0];
        var reader = new FileReader();
        reader.onload = function() {
          var addgrp = $('.editor').closest('.base').find('.addgrp');
          $(addgrp).data('filedata',reader.result);
          $(addgrp).find('.scriptnamval').val(file.name);
          $(addgrp).find('.dropdown').not('.open').find('> button').dropdown('toggle');
        }
        reader.readAsArrayBuffer(file);
        return false;
      }
    });
    editor.on('dragenter', function(data, e) {
      if(isFileTransfer(e)){
        counter++;
        $(ele).closest('.editor').addClass('drop');
      }
    });
    editor.on('dragleave', function(data, e) {
      if(isFileTransfer(e)){
        counter--;
        if (counter === 0) { 
          $(ele).closest('.editor').removeClass('drop');
        }
      }
    });
    editor.setOption("extraKeys", {
      Tab: function Tab(cm) {
        return cm.execCommand("indentMore");
      },
      "Shift-Tab": function ShiftTab(cm) {
        return cm.execCommand("indentLess");
      }
    });
    $(this).data('editor', editor);
    $(ele).closest('.base').find('.picker').data('goto','script.py');
    fillPicker();
  });
};

var initToolkit = function(){
  $('.nodel-toolkit textarea').each(function() {
    var editor = CodeMirror.fromTextArea(this, {
      lineNumbers: true,
      matchBrackets: true,
      autoRefresh: true
    });
    cmResize(editor, {resizableWidth: false})
    editor.setOption('readOnly');
    editor.setOption('mode', 'python');
  });
};

var createDynamicElements = function(){
  var p = [];
  var dynres = $('div[data-nodel]');
  var actions, events;
  $.each(dynres, function(i,ele){
    var d = $.Deferred();
    if($(ele).data('nodel') == 'actsig'){
      var reqs = [];
      reqs.push($.getJSON('http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/actions', function(list) {
        actions = list;
      }));
      reqs.push($.getJSON('http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/events', function(list) {
        events = list;
      }));
      var forms = {"forms":[],"groups":{}};
      $.when.apply($, reqs).then(function (){
        $.each(actions, function(i, act){
          act.title = _.isUndefined(act.title) ? act.name: act.title;
          var schema = {"type":"object", "properties": {"arg": act.schema }};
          ale = {'action': {'type': 'action', 'name': act.name, 'target':'actions/'+act.name+'/call', 'schema':JSON.stringify(schema), 'btntext': act.title, 'btntitle': act.name, 'notitle': true, 'nokeytitle': true}, 'order': act.order, 'title': act.title};
          if(!_.isUndefined(events[i])) {
            events[i].title = _.isUndefined(events[i].title) ? events[i].name: events[i].title;
            var schema = {"type":"object", "properties": {"arg": events[i].schema }};
            $.extend(ale, {'event': {'type': 'event', 'name': events[i].name, 'target':'events/'+events[i].name+'/emit', 'schema':JSON.stringify(schema), 'btntext': events[i].title, 'btntitle': events[i].name, 'notitle': true, 'nokeytitle': true}});
            delete events[i];
          }
          if(act.group) {
            if(_.isUndefined(forms['groups'][act.group])) forms['groups'][act.group] = [];
            forms['groups'][act.group].push(ale);
          } else forms['forms'].push(ale);
        });
        $.each(events, function(i, evt){
          evt.title = _.isUndefined(evt.title) ? evt.name: evt.title;
          var schema = {"type":"object", "properties": {"arg": evt.schema }};
          eve = {'event': {'type': 'event', 'name': evt.name, 'target':'events/'+evt.name+'/emit', 'schema':JSON.stringify(schema), 'btntext': evt.title, 'btntitle': evt.name, 'notitle': true, 'nokeytitle': true}, 'order': evt.order, 'title': evt.title};
          if(evt.group) {
            if(_.isUndefined(forms['groups'][evt.group])) forms['groups'][evt.group] = [];
            forms['groups'][evt.group].push(eve);
          } else forms['forms'].push(eve);
        });
        forms['forms'].sort(function(a, b){
          return a.order > b.order? 1: a.order == b.order? 0: -1;
        });
        $.each(forms['groups'], function(i, group) {
          group.sort(function(a, b){
            return a.order > b.order? 1: a.order == b.order? 0: -1;
          });
        });
        $(ele).html($.templates("#actsigTmpl").render(forms));
        var p = [];
        $('[data-type="action"],[data-type="event"]').each(function(i, ele){
          p.push(makeTemplate(ele, $(ele).data('schema')));
        });
        $.when.apply($, p).then(function(){
          d.resolve();
        });
      });
    } else if($(ele).data('nodel') == 'params'){
      $.getJSON('http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/params/schema', function(data) {
        if(!_.isEmpty(data)){
          $(ele).data('btntext','Save');
          $(ele).data('btncolour','success');
          $(ele).data('btntitle','Params');
          $(ele).data('target','params/save');
          $(ele).data('source','params');
          $(ele).data('alert','Saved');
          makeTemplate(ele, data).then(function() {
            d.resolve();
          });
        } else {
          $(ele).html('<h6>None</h6>');
          d.resolve();
        }
      }).fail(function(){d.resolve();});
    } else if($(ele).data('nodel') == 'remote'){
      $.getJSON('http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/remote/schema', function(data) {
        if(!_.isEmpty(data)){
          $(ele).data('target','remote/save');
          $(ele).data('source','remote');
          $(ele).data('alert','Saved');
          makeTemplate(ele, data, '#remoteTmpl').then(function() {
            d.resolve();
          });
        } else {
          $(ele).html('<h6>None</h6>');
          d.resolve();
        }
      }).fail(function(){d.resolve();});
    } else if($(ele).data('nodel') == 'toolkit'){
      var ele = this;
      $.get('http://' + host + '/REST/toolkit', function(data) {
        $(ele).find('textarea').val(data['script']);
        d.resolve();
      }).fail(function(){d.resolve();});
    } else if($(ele).data('nodel') == 'diagnostics'){
      $.getJSON('http://'+host+'/REST/diagnostics', function(data) {
        $.getJSON('http://'+host+'/build.json', function(build) {
          $.extend(data, {'build':build});
          $.templates("#diagsTmpl").link(ele, data);
          d.resolve();
        }).fail(function(){d.resolve();});
      }).fail(function(){d.resolve();});
    } else if($(ele).data('nodel') == 'log'){ 
      $.templates("#logTmpl").link(ele, {'logs':[],'flt':''});
      d.resolve();
    } else if($(ele).data('nodel') == 'console'){
      $.templates("#consoleTmpl").link(ele, {'logs':[]});
      d.resolve();
    } else if($(ele).data('nodel') == 'serverlog'){
      $.templates("#serverlogTmpl").link(ele, {'logs':[]});
      d.resolve();
    } else if($(ele).data('nodel') == 'list'){
      $.templates("#listTmpl").link(ele, nodeList);
      d.resolve();
    } else d.resolve();
    p.push(d);
  });
  return $.when.apply($, p).promise();
};

var getSimpleName = function(name){
  return simplematch.exec(name)[1];
};

var getVerySimpleName = function(name){
  var smp = simplematch.exec(name);
  return smp[1].replace(unicodematch,'');
};

var generateHostIcon = function(host) {
  var hash = XXH.h64(host, 0x4e6f64656c).toString(16).padStart(16,'0');
  var options = {
    background: [255, 255, 255, 0],
    margin: 0.1,
    size: 20,
    format: 'svg'
  };
  return new Identicon(hash, options).toString();
}

var updateHost = function(host) {
  var data = generateHostIcon(host);
  var newhost = {};
  newhost.icon = data;
  newhost.reachable = false;
  newhost.checked = false;
  var hostobj = {}
  hostobj[encodr(host)] = newhost;
  var hosts = $.extend({}, nodeList['hosts'], hostobj);
  $.observable(nodeList).setProperty('hosts', hosts);
};

var checkHostList = function(){
  clearTimeout($('body').data('hostlistTimer'));
  var okey = null;
  var ele = $('.nodel-list .base');
  if(ele) {
    var flst = $.view(ele).ctxPrm('flst');
    if(flst) {
      var flstl = flst.slice(0,$.view(ele).data['end']);
      for (var host in nodeList['hosts']) {
        if (nodeList['hosts'].hasOwnProperty(host)) {
          if(nodeList['hosts'][host].checked == false){
            var dhost = decodr(host);
            var ind = flstl.findIndex(function(_ref) {
              return (_ref.host == dhost);
            });
            if(ind > -1){
              okey = host; 
              break;
            }
          }
        }
      }
    }
  }
  if(!okey) {
    for (var host in nodeList['hosts']) {
      if (nodeList['hosts'].hasOwnProperty(host)) {
        if(nodeList['hosts'][host].checked == false){
          okey = host; 
          break;
        }
      }
    }
  }
  if(okey) {
    checkReachable(decodr(okey)).then(function(reachable){
      $.observable(nodeList['hosts'][okey]).setProperty('checked', true);
      if(reachable) $.observable(nodeList['hosts'][okey]).setProperty('reachable', true);
      $('body').data('hostlistTimer', setTimeout(function() { checkHostList(); }, 1000));
    });
  } else {
    $('body').data('hostlistTimer', setTimeout(function() { checkHostList(); }, 1000));
  }
};

var getNodeList = function(filterstr){
  if(!_.isUndefined(filterstr)) filter={'filter':filterstr};
  else filter = {};
  var d = $.Deferred();
  if(nodeListreq) nodeListreq.abort();
  // test list (for large Nodel networks performance testing)
  //nodeListreq = $.getJSON('http://'+host+'/nodes/Unify/nodeURLs.json', function(data) {
  nodeListreq = $.postJSON('http://'+host+'/REST/nodeURLs', JSON.stringify(filter), function(data) {
    for (i=0; i<data.length; i++) {
      var ind = -1;
      data[i].host = getHost(data[i].address);
      data[i].name = data[i].node;
      data[i].node = getSimpleName(data[i].node);
      if(_.isUndefined(nodeList['hosts'][encodr(data[i].host)])) updateHost(data[i].host);
    }
    $.observable(nodeList['lst']).refresh(data);
  }).always(function(){
    d.resolve();
  });
  return d.promise();
}

var checkReachable = function(host){
  var d = $.Deferred();
  $.ajax({
    url: 'http://'+host+'/REST',
    timeout: 3000
  }).done(function() {
    d.resolve(true);
  }).fail(function(e,s,t){
    if((e.state() == 'rejected') && (e.statusText == 'error')) d.resolve(true);
    else d.resolve(false);
  });
  return d.promise();
};

var makeTemplate = function(ele, schema, tmpls){
  var d = $.Deferred();
  $.views.settings.delimiters("<%", "%>");
  // patch schema for UI related elements
  var extschema = $.extend({}, {"btntitle": $(ele).data('btntitle')}, {'schema':schema});
  if(!_.isUndefined($(ele).data('btnicon')) && $(ele).data('btnicon') !== '') extschema = $.extend({}, {"btnicon": $(ele).data('btnicon')}, extschema);
  if(!_.isUndefined($(ele).data('btnfaicon')) && $(ele).data('btnfaicon') !== '') extschema = $.extend({}, {"btnfaicon": $(ele).data('btnfaicon')}, extschema);
  if(!_.isUndefined($(ele).data('btntext'))) extschema = $.extend({}, {"btntext": $(ele).data('btntext')}, extschema);
  if(!_.isUndefined($(ele).data('btncolour'))) extschema = $.extend({}, {"btncolour": $(ele).data('btncolour')}, extschema);
  if(!_.isUndefined($(ele).data('btntop'))) extschema = $.extend({}, {"btntop": $(ele).data('btntop')}, extschema);
  if(!_.isUndefined($(ele).data('disabled'))) extschema = $.extend({}, {"disabled": true}, extschema);
  if(!_.isUndefined($(ele).data('nokeytitle'))) extschema = $.extend({}, {"nokeytitle": true}, extschema);
  if(!_.isUndefined($(ele).data('notitle')) && $(ele).data('notitle') == true) extschema.title = '';
  // generate
  //console.log(extschema);
  var generatedTemplate = $.templates(tmpls ? tmpls: "#baseTmpl").render(extschema);
  //console.log(generatedTemplate);
  $.views.settings.delimiters("{{", "}}");
  var tmpl = $.templates(generatedTemplate);
  if(!(_.isUndefined($(ele).data('source'))) && ($(ele).data('source').charAt(0) != '/')){
    $.getJSON('http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/'+$(ele).data('source'), function(data) {
      tmpl.link(ele, data);
      d.resolve();
    });
  } else if(!(_.isUndefined($(ele).data('source'))) && ($(ele).data('source').charAt(0) == '/')){
    $.getJSON('http://'+host+'/REST'+$(ele).data('source'), function(data) {
      tmpl.link(ele, data);
      d.resolve();
    }); 
  } else {
    tmpl.link(ele, {});
    d.resolve();
  }
  return d.promise();
};

var checkReload = function(){
  var params = {};
  if(!_.isUndefined($('body').data('timer'))) clearTimeout($('body').data('timer'));
  if(!_.isUndefined($('body').data('timestamp'))) params = {timestamp:$('body').data('timestamp')};
  $.getJSON('http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/hasRestarted', params, function(data) {
    if(_.isUndefined($('body').data('timestamp'))){
      $('body').data('timestamp', data.timestamp);
    } else if ($('body').data('timestamp')!=data.timestamp) {
      window.location.reload();
    }
  }).always(function() {
    $('body').data('timer', setTimeout(function() { checkReload(); }, 5000));
  });
};

var convertNames = function(){
  $.each($("[data-showevent]"), function () {
    $(this).addClass('nodel-showevent');
    $(this).data('showevent', $.map($.isArray($(this).data('showevent')) ? $(this).data('showevent') : [$(this).data('showevent')], function(at){
      return at.replace(unicodematch,'');
    }));
  });
  $.each($("[data-event]"), function () {
    $(this).addClass('nodel-event');
    $(this).data('event', $.map($.isArray($(this).data('event')) ? $(this).data('event') : [$(this).data('event')], function(at){
      return at.replace(unicodematch,'');
    }));
  });
  $.each($("[data-status]"), function () {
    $(this).addClass('nodel-status');
    $(this).data('status', $.map($.isArray($(this).data('status')) ? $(this).data('status') : [$(this).data('status')], function(at){
      return at.replace(unicodematch,'');
    }));
  });
  $.each($("[data-render]"), function () {
    $(this).addClass('nodel-render');
    $(this).data('render', $.map($.isArray($(this).data('render')) ? $(this).data('render') : [$(this).data('render')], function(at){
      return at.replace(unicodematch,'');
    }));
  });
  $.each($("[data-schema]"), function () {
    $(this).addClass('nodel-schema-'+$(this).data('type'));
    $(this).data('name', $.map($.isArray($(this).data('name')) ? $(this).data('name') : [$(this).data('name')], function(at){
      return at.replace(unicodematch,'');
    }));
  });
};

var linkToNode = function(node, grp, name){
  var arg = {name: node};
  $.postJSON('http://'+host+'/REST/nodeURLsForNode', JSON.stringify(arg), function(data) {
    for (i=0; i<data.length; i++) {
      data[i].host = getHost(data[i].address);
      if(_.isUndefined(nodeList['hosts'][encodr(data[i].host)])) updateHost(data[i].host);
      data[i].reachable = false;
    }
    $('.nodel-remote').each(function(){
      var rdata = $.view(this).data;
      $.observable(rdata).setProperty(grp+'.'+name+'._$link', data);
    });
  });
};

var setEvents = function(){
  $(window).on('resize', function () {
    updatepadding();
  });
  $(window).on('orientationchange', function () {
    if(!_.isUndefined(window.navigator.standalone) && window.navigator.standalone){
      setTimeout(function(){ updatepadding(); }, 200);
    }
  });
  $('body').on('touchend touchcancel',':not(input)', function (e) {
    if(navigator.issmart) $('body').removeClass('touched');
  });
  $('body').on('touchstart',':not(input)', function (e) {
    if(navigator.issmart) $(this).trigger('click');
  });
  $('body').on('input','input[type=range]input[data-action]', function (e){
    var ele = $(this);
    data = getAction(this);
    if(!_.isFunction($(this).data('throttle'))) {
      $(ele).data('throttle', _.throttle(function(act, ar) {
        callAction(act, ar);
      }, 250));
    }
    $(ele).data('throttle')(data.action, data.arg);
  });
  $('body').on('touchstart mousedown touchend touchcancel mouseup','input[type=range]input[data-action]', function (e) {
    if($.inArray(e.type, ['touchstart','mousedown']) > -1) $(this).addClass('active');
    else $(this).removeClass('active');
  });
  $('body').on('touchstart mousedown touchend touchcancel mouseup','*[data-actionon]*[data-actionoff]', function (e) {
    e.stopPropagation(); e.preventDefault();
    data = getAction(this);
    if($.inArray(e.type, ['touchstart','mousedown']) > -1) $(this).addClass('active');
    else $(this).removeClass('active');
    callAction(data.action, data.arg);
  });
  $('body').on('click','*[data-arg], *[data-action]', function (e) {
    e.stopPropagation(); e.preventDefault();
    if(!$('body').hasClass('touched')) {
      if(navigator.issmart) $('body').addClass('touched');
      data = getAction(this);
      if(data.action) {
        if(data.confirm){
          $('#confirmlabel').text(data.confirmtitle);
          $('#confirmtext').text(data.confirmtext);
          $('#confirmaction').data('confirmaction', data.action);
          $('#confirmaction').data('arg', data.arg);
          if((data.confirm == 'code') && ($('#confirmcodesrc').val().length)) {
            $('#confirmkeypad').show();
            $('#confirmaction').attr('disabled','disabled');
          } else {
            $('#confirmkeypad').hide();
            $('#confirmaction').removeAttr('disabled');
          }
          $('#confirm').modal('show');
        } else callAction(data.action, data.arg);
        $(this).parents('.btn-select.open').find('.dropdown-toggle').dropdown('toggle');
      }
    }
  });
  $('body').on('click','#confirmaction', function (e) {
    e.stopPropagation(); e.preventDefault();
    if(!$('body').hasClass('touched')) {
      if(navigator.issmart) $('body').addClass('touched');
      callAction($(this).data('confirmaction'), $(this).data('arg'));
      $('#confirm').modal('hide');
    };
  });
  $('body').on('click','*[data-link-event]', function (e) {
    e.stopPropagation(); e.preventDefault();
    var ele = $(this);
    var newWindow = window.open('http://'+host);
    $.getJSON('http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/remote', function(data) {
      if (!_.isUndefined(data['events'][$(ele).data('link-event')])) {
        var lnode = data['events'][$(ele).data('link-event')]['node'];
        if(lnode!==''){
          newWindow.location = 'http://'+host+'/?filter='+lnode;
          $.postJSON('http://'+host+'/REST/nodeURLsForNode',JSON.stringify({'name':lnode}), function(data) {
            if (!_.isUndefined(data[0]['address'])){
              newWindow.location = data[0]['address'];
            }
          });
        }
      }
    });
  });
  $('body').on('click','*[data-link-url]', function (e) {
    e.stopPropagation(); e.preventDefault();
    window.open($(this).data('link-url'));
  });
  $('body').on('click', '*[data-nav]', function (e) {
    e.preventDefault();
    var id = $(this).data('nav');
    $('*[data-nav]').parents('li').removeClass('active');
    $('*[data-nav="'+id+'"]').parents('li').addClass('active');
    $("[data-section]").hide();
    $("[data-section="+id+"]").show();
    history.replaceState(undefined, undefined, '#'+id);
    $("[data-section="+id+"]").find('.nodel-console').scrollTop(999999);
    return false;
  });
  $('body').on('click', '#confirmkeypad *[data-keypad]', function () {
    var number = $(this).data('keypad');
    if(number==-1){
      $("#confirmcode").val(function() {
        return this.value.slice(0, -1);
      });
    } else {
      $("#confirmcode").val(function() {
          return this.value + number;
      });
    }
    if($("#confirmcode").val() == $("#confirmcodesrc").val()) $('#confirmaction').removeAttr('disabled');
    else $('#confirmaction').attr('disabled','disabled');
  });
  $('#confirm').on('hidden.bs.modal', function () {
    $("#confirmcode").val('');
  });
  $('body').on('submit', function (e) {
    e.preventDefault();
  });
  $('body').on('change','.advancedmode', function(){
    if($(this).is(":checked")) {
      $('.nodel-actsig').find('.nodel-schema-event button[type="submit"].disabled').removeClass('disabled');
    } else {
      $('.nodel-actsig').find('.nodel-schema-event button[type="submit"]').addClass('disabled');
    }
  });
  $('body').on('click','*[data-form] button[type="submit"]', function (e) {
    if(e.shiftKey) {
      e.preventDefault();
      copyToClipboard($(this).attr('title'));
      alert('Copied to clipboard');
    }
    if($(this).hasClass('disabled')) {
      e.preventDefault();
    }
  });
  $('body').on('submit','*[data-form]', function (e) {
    e.stopPropagation(); e.preventDefault();
    if(!$('body').hasClass('touched')) {
      if(navigator.issmart) $('body').addClass('touched');
      var tosend = JSON.parse(JSON.stringify($.view(this).data));
      removeNulls(tosend);
      //console.log(tosend);
      var nme = $(this).parent().data('btntitle');
      var alt = $(this).parent().data('alert');
      $.postJSON('http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/'+$(this).parent().data('target'), JSON.stringify(tosend), function () {
        console.log(nme+': success');
        if(alt) alert(alt);
      }).fail(function(e){
        alert('Error', 'danger', 7000, e.responseText);
      });
    }
  });
  $('body').on("click", ".del", function() {
    $.observable($.view(this).get("array").data).remove($.view(this).getIndex(),1);
  });
  $('body').on("click", ".up", function() {
    $.observable($.view(this).get("array").data).move($.view(this).getIndex(),$.view(this).getIndex()-1,1);
  });
  $('body').on("click", ".down", function() {
    $.observable($.view(this).get("array").data).move($.view(this).getIndex(),$.view(this).getIndex()+1,1);
  });
  $('body').on("click", ".add", function(e) {
    $.observable($.view(this).data[$(this).data('for')]).insert($.view(this).data[$(this).data('for')].length,{});
  });
  $('body').on("keydown", ".nodel-console", function(e) {
    var charCode = e.charCode || e.keyCode;
    if ((charCode !== 16) && (charCode !== 17) && (charCode !== 18) && (!e.ctrlKey) && (!e.shiftKey) && (!e.altKey)) {
      var ele = $(this).find('.consoleinput').not(':focus');
      if(ele.length) {
        caretToEnd(ele.get(0));
      }
    }
  });
  $('body').on("keydown", ".nodel-console .consoleinput", function(e) {
    var charCode = e.charCode || e.keyCode;
    if ((charCode === 13) || (charCode === 38) || (charCode === 40)) {
      return false;
    }
  });
  $('body').on("keyup", ".nodel-console .consoleinput", function(e) {
    var charCode = e.charCode || e.keyCode;
    if (charCode === 13) {
      var text = $(this).text();
      if(text){
        $(this).empty();
        var arg = JSON.stringify({code: text});
        $.postJSON('/REST/nodes/'+encodeURIComponent(node)+'/exec', arg, function(data){
        }).fail(function(e, s) {
          console.log('Console error: ' + s);
        }).always(function(e){
          updateConsoleForm();
        });
        if(_.isUndefined($.data(this, 'history'))) $.data(this, 'history', []);
        $.data(this, 'current', -1);
        $.data(this, 'history').unshift(text);
      }
    } else if ((charCode === 38) || (charCode === 40)) {
      if(!_.isUndefined($.data(this, 'history'))) {
        if(_.isUndefined($.data(this, 'current'))) $.data(this, 'current', -1);
        var current = $.data(this, 'current');
        if ((charCode === 38) && (current+1 < $.data(this, 'history').length)) {
          $.data(this, 'current', current+1);
          $(this).text(($.data(this, 'history')[current+1]));
          caretToEnd($(this)[0]);
        } else if (charCode === 40) {
          if(current > 0) {
            $.data(this, 'current', current-1);
            $(this).text(($.data(this, 'history')[current-1]));
            caretToEnd($(this)[0]);
          } else {
            $.data(this, 'current', -1);
            $(this).empty();
          }
        }
      }
    }
  });
  $('body').on("click", ".nodel-remote .remoteselectall", function(e) {
    var data = $.view(this).data;
    var grp = ($(this).hasClass('action')) ? 'actions' : 'events';
    for (i in data[grp]) {
      $.observable(data[grp][i]).setProperty('_$checked', $(this).prop('checked'));
    }
  });
  $('body').on("click", ".nodel-remote .remotenodecopy", function(e) {
    var data = $.view(this).data;
    var grp = ($(this).hasClass('action')) ? 'actions' : 'events';
    var nme = data['_$filldown'];
    for (i in data[grp]) {
      if(data[grp][i]['_$checked'] == true) $.observable(data[grp][i]).setProperty('node', nme);
    }
  });
  $('.nodel-remote').shiftSelectable();
  $('body').on('keydown', 'input.node, input.event, input.action', function(e) {
    var charCode = e.charCode || e.keyCode;
    if(charCode == 13) {
      var ele = $(this).siblings('div.autocomplete');
      if(ele.length !== 0){
        e.preventDefault();
      }
    } else if((charCode == 40) || (charCode == 38)) {
      e.preventDefault();
    } else if(charCode == 27) {
      $(this).siblings('div.autocomplete').remove();
    }
  });
  $('body').on('keyup', 'input.node', function(e) {
    var charCode = e.charCode || e.keyCode;
    if((charCode == 40) || (charCode == 38) || (charCode == 13)) {
      if(($(this).siblings('div.autocomplete').length == 0) && (charCode == 13)) return true;
      e.preventDefault();
      var ele = $(this).siblings('div.autocomplete');
      if(ele.length !== 0){
        if((charCode == 40) || (charCode == 38)) {
          if($(ele).find('li.active').length != 0) {
            var sub = $(ele).find('li.active');
            if (charCode == 40) {
              if($(sub).next().length !== 0){
                $(sub).removeClass('active');
                $(sub).next().addClass('active');
              }
            } else {
              if($(sub).prev().length !== 0){
                $(sub).removeClass('active');
                $(sub).prev().addClass('active');
              }
            }
          } else {
            $(ele).find("li").first().addClass('active');
          }
        } else {
          $(ele).find('li.active').trigger('mousedown');
        }
      }
    } else if ((charCode != 9) && (charCode != 27)) {
      if(e.ctrlKey || e.altKey) return true;
      var srchstr = $(this).val();
      var srchflt = srchstr.replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&');
      var ele = this;
      getNodeList($(this).val()).then(function(){
        var data = nodeList.lst;
        if ((data.length == 1) && (srchstr == data[0].node)) $(ele).siblings('div.autocomplete').remove();
        else if(data.length > 0) {
          if(!$(ele).siblings('div.autocomplete').length) $(ele).after('<div class="autocomplete"><ul></ul></div>');
          var list = $(ele).siblings('div.autocomplete').children('ul');
          $(list).empty();
          $.each(data, function(key, value) {
            var re = new RegExp("(.*)("+srchflt+")(.*)","ig");
            var val = value.node.replace(re, '$1<strong>$2</strong>$3')
            $('<li>'+val+'</li>').data('address', value.address).appendTo(list);
            return key < 20;
          });
        } else $(ele).siblings('div.autocomplete').remove();
      });
    }
  });
  $('body').on('keyup', 'input.event, input.action', function(e) {
    var charCode = e.charCode || e.keyCode;
    if((charCode == 40) || (charCode == 38) || (charCode == 13)) {
      if(($(this).siblings('div.autocomplete').length == 0) && (charCode == 13)) return true;
      e.preventDefault();
      var ele = $(this).siblings('div.autocomplete');
      if(ele.length !== 0){
        if((charCode == 40) || (charCode == 38)) {
          if($(ele).find('li.active').length != 0) {
            var sub = $(ele).find('li.active');
            if (charCode == 40) {
              if($(sub).next().length !== 0){
                $(sub).removeClass('active');
                $(sub).next().addClass('active');
              }
            } else {
              if($(sub).prev().length !== 0){
                $(sub).removeClass('active');
                $(sub).prev().addClass('active');
              }
            }
          } else {
            $(ele).find("li").first().addClass('active');
          }
        } else {
          $(ele).find('li.active').trigger('mousedown');
        }
      }
    } else if ((charCode != 9) && (charCode != 27)) {
      if(e.ctrlKey || e.altKey) return true;
      var srchstr = $(this).val()
      var srchflt = srchstr.replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&');
      var ele = this;
      var type = $(this).hasClass("event") ? 'events' : 'actions';
      var node = $.view(this).data.node;
      getNodeList(node).then(function(){
        $.each($(this).data('reqs'), function(key,value){ value.abort() });
        var reqs=[];
        var actsigs=[];
        var data = $.grep(nodeList.lst, function(v) {
          return v.node == node;
        });
        if(data.length > 0){
          $.each(data, function(key, value) {
            reqs.push($.getJSON('http://'+value.host+'/REST/nodes/'+encodeURIComponent(value.node)+'/'+type, function(data) {
              $.each(data, function(key, value) {
                if(value.name.search(new RegExp(srchflt, "ig")) >= 0) {
                  actsigs.push(value.name);
                }
              });
            }));
          });
          $.when.apply($, reqs).then(function (){
            if ((actsigs.length == 1) && (srchstr == actsigs[0])) $(ele).siblings('div.autocomplete').remove();
            else if(actsigs.length > 0) {
              if(!$(ele).siblings('div.autocomplete').length) $(ele).after('<div class="autocomplete"><ul></ul></div>');
              var list = $(ele).siblings('div.autocomplete').children('ul');
              $(list).empty();
              $.each(actsigs, function(key, value) {
                var re = new RegExp("(.*)("+srchflt+")(.*)","ig");
                var val = value.replace(re, '$1<strong>$2</strong>$3')
                $(list).append('<li>'+val+'</li>');
                return key < 20;
              });
            } else $(ele).siblings('div.autocomplete').remove();
          });
          $(ele).data('reqs', reqs);
        } else $(ele).siblings('div.autocomplete').remove();
      });
    }
  });
  $('body').on('mouseenter', 'div.autocomplete ul li', function() {
    $(this).parent().find('.active:not(:hover)').removeClass('active');
    $(this).addClass('active');
  });
  $('body').on('mousedown touchstart', 'div.autocomplete ul li', function() {
    if($(this).closest('div.autocomplete').siblings('input').hasClass('goto')) {
      window.open($(this).data()['address']);
    } else {
      var data = $.view(this).data;
      var fld = $(this).closest('div.autocomplete').siblings('input').data('link');
      if(!fld) fld = '_$filldown';
      $.observable(data).setProperty(fld, $(this).text());
    }
    $(this).closest('div.autocomplete').remove();
  });
  $('body').on('focusout', 'input.node, input.event, input.action', function() {
    $(this).siblings('div.autocomplete').remove();
  });
  $('body').on("click", ".nodel-remote .remotefill", function(e) {
    var data = $.view(this).data;
    var grp = ($(this).hasClass('action')) ? 'actions' : 'events';
    var fld = (grp == 'actions') ? 'action' : 'event';
    var ele = this;
    $.each(data[grp], function(nme, val){
      if(val['_$checked'] == true){
        var lnode = val.node;
        getNodeList(node).then(function(){
          var data = $.grep(nodeList.lst, function(v) {
            return v.node == lnode;
          });
          if(data.length > 0){
            $.each($(ele).data('reqs_'+nme), function(k,value){ value.abort() });
            var reqs=[];
            var strs=[];
            $.each(data, function(key, value) {
              var parser = document.createElement('a');
              parser.href = value.address;
              var host = parser.host;
              $(parser).remove();
              var lnode = value.node;
              reqs.push($.getJSON('http://'+host+'/REST/nodes/'+encodeURIComponent(lnode)+'/'+grp, function(data) {
                $.each(data, function(key, value) {
                  strs.push(value.name);
                });
              }));
            });
            $.when.apply($, reqs).then(function (){
              if(strs.length != 0){
                var fs = FuzzySet(strs, true, 1, 1);
                var data = $.view(ele).data;
                var res = fs.get(decodr(nme), null, 0.5);
                if(res) {
                  $.observable(data[grp][nme]).setProperty(fld, res[0][1])
                }
              }
            });
            $(ele).data('reqs_'+nme, reqs);
          }
        });
      }
    });
  });
  $('body').on('click', '.script_default', function() {
    var ele = $(this).closest('.base').find('.picker');
    $(ele).val("script.py");
    $(ele).trigger('change');
  });
  $('body').on('change', '.picker', function() {
    var ele = $(this).closest('.base');
    $(ele).find('.script_save, .script_delete').prop("disabled", true);
    var editor = $(ele).find('textarea').data('editor');
    if(editor) {
      editor.setOption('readOnly', 'nocursor');
      var path = $(ele).find('.picker').val();
      $(ele).find('textarea').data('path', path);
      $.get('http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/files/contents?path=' +encodeURIComponent(path), function (data) {
        switch(path.split('.').pop()){
          //'sh'
          case 'js':
          case 'json':
            editor.setOption("mode", "javascript");
            break;
          case 'xml':
          case 'xsl':
          case 'html':
          case 'htm':
            editor.setOption("mode", "xml");
            break;
          case 'css':
            editor.setOption("mode", "css");
            break;
          case 'java':
            editor.setOption("mode", "clike");
            break;
          case 'groovy':
            editor.setOption("mode", "groovy");
            break;
          case 'sql':
            editor.setOption("mode", "sql");
            break;
          case 'sh':
            editor.setOption("mode", "shell");
            break;
          case 'py':
            editor.setOption("mode", "python");
            break;
          default:
            editor.setOption("mode", "txt");
        }
        if(allowedtxt.indexOf(path.split('.').pop()) > -1) {
          editor.getDoc().setValue(data);
          editor.setOption('readOnly', false);
          $(ele).find('.script_save, .script_delete').prop("disabled", false);
        } else if(allowedbinary.indexOf(path.split('.').pop()) > -1) {
          editor.getDoc().setValue('binary file');
          $(ele).find('.script_delete').prop("disabled", false);
        }
      }).fail(function(e){
        alert("Error loading file: "+path, "danger", 7000, e.responseText);
      });
    }
  });
  $('body').on('click', '.script_save', function() {
    var ele = $(this).closest('.base');
    $(ele).find('.script_save, .script_delete').prop("disabled", true);
    var editor = $(ele).find('textarea').data('editor');
    editor.setOption('readOnly', 'nocursor');
    editor.save();
    var path = $(ele).find('textarea').data('path');
    // use different method to save main script
    if(path == 'script.py') {
      url = 'http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/script/save';
      payload = JSON.stringify({'script': $(ele).find('textarea').val() });
      $.postJSON(url, payload, function (data) {
        alert("File saved: "+path);
      }).fail(function(e){
        alert("Error saving file: "+path, "danger", 7000, e.responseText);
      }).always(function(){
        editor.setOption('readOnly', false);
        $(ele).find('.script_save, .script_delete').prop("disabled", false);
      });
    } else {
      url = 'http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/files/save?path=' +encodeURIComponent(path);
      payload = $('#field_script').val();
      payload = $(ele).find('textarea').val();
      $.ajax({url:url, type:"POST", data:payload, contentType:"application/octet-stream", success: function (data) {
        alert("File saved: "+path);
      }}).fail(function(e){
        alert("Error saving file: "+path, "danger", 7000, e.responseText);
      }).always(function(){
        editor.setOption('readOnly', false);
        $(ele).find('.script_save, .script_delete').prop("disabled", false);
      });
    }
  });
  $('body').on('click', '.script_delete', function() {
    var ele = $(this).closest('.base');
    $(ele).find('.script_save, .script_delete').prop("disabled", true);
    var editor = $(ele).find('textarea').data('editor');
    editor.setOption('readOnly', 'nocursor');
    var path = $(ele).find('textarea').data('path');
    if((path != 'script.py') && (confirm("Are you sure?"))) {
      $.get('http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/files/delete?path=' +encodeURIComponent(path), function (data) {
        editor.getDoc().setValue('');
        $(ele).find('.picker').val('');
        alert("File deleted: "+path);
        fillPicker();
        fillUIPicker();
      }).fail(function(e){
        alert("Error deleting file: "+path, "danger", 7000, e.responseText);
      }).always(function(){
        $(ele).find('.script_save, .script_delete').prop("disabled", false);
        editor.setOption('readOnly', false);
      });
    } else {
      $(ele).find('.script_save, .script_delete').prop("disabled", false);
      editor.setOption('readOnly', false);
    }
  });
  $('body').on('keyup', '.scriptnamval', function(e) {
    var charCode = e.charCode || e.keyCode;
    if(charCode == 13) $(this).closest('form').find('.scriptsubmit').click();
  });
  $('body').on('click', '.scriptsubmit', function(e) {
    e.preventDefault();
    var ele = $(this).closest('.base');
    var path = $(ele).find('.scriptnamval').val();
    var grp = $(ele).find('.addgrp');
    if(allowedtxt.concat(allowedbinary).indexOf(path.split('.').pop()) > -1) {
      var url = 'http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/files/save?path=' +encodeURIComponent(path);
      var dta = '';
      var prc = true;
      if($(grp).data('filedata') !== null) {
        dta = $(grp).data('filedata');
        prc = false;
      }
      $.ajax({url:url, type:"POST", data:dta, processData:prc, contentType:"application/octet-stream", success: function (data) {
        $(ele).find('.open > button').dropdown('toggle');
        alert('File added');
        $(ele).find('.picker').data('goto', path);
        fillPicker();
        fillUIPicker();
      }}).fail(function (req) {
        if (req.statusText != "abort") {
          alert('File add failed', 'danger', 7000, JSON.parse(req.responseText));
        }
      });
      return false;
    } else {
      alert('Invalid file name, must end with: ' + allowedtxt.concat(allowedbinary).join(', '), 'danger');
    }
  });
  $('body').on('keydown', '.nodel-editor', function(e) {
    if (e.ctrlKey || e.metaKey) {
      if (String.fromCharCode(e.which).toLowerCase() == 's') {
        e.preventDefault();
        $(this).find('.script_save').click();
      }
    }
  });
  $('body').on('shown.bs.dropdown', '.nodel-editor .addgrp', function () {
    $(this).find('.scriptnamval').get(0).focus();
  });
  $('body').on('hidden.bs.dropdown', '.nodel-editor .addgrp', function () {
    $(this).find('.scriptnamval').val(null);
    $(this).data('filedata', null);
  });
  $('body').on('shown.bs.dropdown', '.srchgrp', function () {
    $(this).find('.node').val(null).get(0).focus();
  });
  $('body').on('shown.bs.dropdown', '.edtgrp', function () {
    $(this).find('.renamenode').val(nodename).get(0).focus();
  });
  $('body').on('click', '.uipicker', function (e) {
    e.stopPropagation();
  });
  $('body').on('change', '.uipicker', function (e) {
    window.location.href = $(this).val();
  });
  $('body').on('keyup', '.renamenode', function(e) {
    var charCode = e.charCode || e.keyCode;
    if(charCode == 13) $(this).closest('.form').find('.renamenodesubmit').click();
  });
  $('body').on('click', '.renamenodesubmit', function (e) {
    var nodenameraw = $(this).closest('.form').find('.renamenode').val();
    if(nodename != nodenameraw) {
      if(confirm('Are you sure?')) {
        var nodename = JSON.stringify({"value": nodenameraw});
        $.postJSON('http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/rename', nodename, function (data) {
          alert("Rename successful, redirecting", "success", 0);
          clearTimers();
          checkRedirect('http://' + host + '/nodes/' + encodeURIComponent(getVerySimpleName(nodenameraw)));
        }).fail(function(e){
          alert("Error renaming node", "danger", 7000, e.responseText);
        });
      }
    }
  });
  $('body').on('click', '.restartnodesubmit', function (e) {
    $.get('http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/restart', function (data) {
      alert("Restarting, please wait", "success", 7000);
    }).fail(function(e){
      alert("Error restarting", "danger", 7000, e.responseText);
    });
  });
  $('body').on('click', '.deletenodesubmit', function (e) {
    if(confirm('Are you sure?')) {
      $.getJSON('http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/remove?confirm=true', function (data) {
        alert("Delete successful, redirecting", "success", 0);
        clearTimers();
        setTimeout(function() { window.location.href = 'http://' + host; }, 3000);
      }).fail(function(e){
        alert("Error deleting", "danger", 7000, e.responseText);
      });
    }
  });
  $('body').on('shown.bs.dropdown', '.nodel-add .addgrp', function () {
    var ele = this;
    $(ele).find('.nodeaddsubmit').prop('disabled', true);
    $(ele).find('.recipepicker').empty();
    $(ele).find('.nodenamval').focus();
    $(ele).find('.nodenamval').val(null).get(0).focus();
    $.getJSON('http://' + host + '/REST/recipes/list', function(data) {
      if (data.length > 0) {
        var picker = $(ele).find('.recipepicker');
        $(picker).append('<option value="" selected disabled hidden></option>');
        $.each(data, function(i, value) {
          var readme = (typeof value.readme == 'undefined') ? "" : $('<div/>').text(value.readme).html();
          $(picker).append('<option value="' + value.path + '" title="' + readme + '">' + value.path + '</option>');
        });
      } else {
        $(ele).find('.recipepicker').append('<option value="error">-- no recipes available --</option>');
      }
    }).fail(function(){
      $(ele).find('.recipepicker').append('<option value="error">-- no recipes available --</option>');
    }).always(function(){
      $(ele).find('.nodeaddsubmit').prop('disabled', false);
    });
    //return false;
  });
  $('body').on('keyup', '.nodenamval', function(e) {
    var charCode = e.charCode || e.keyCode;
    if(charCode == 13) $(this).closest('form').find('.nodeaddsubmit').click();
  });
  $('body').on('click', '.nodeaddsubmit', function(e) {
    var ele = $(this).closest('.base');
    $(ele).find('.nodeaddsubmit').prop('disabled', true);
    var nodenameraw = $(ele).find('.nodenamval').val();
    var recipeval = $(ele).find('.recipepicker').val();
    if(nodenameraw) {
      var nodename = {"value": nodenameraw};
      if(recipeval && (recipeval !== 'error')) nodename["base"] = recipeval;
      $.postJSON('http://' + host + '/REST/newNode', JSON.stringify(nodename), function() {
        $(ele).find('.open > button').dropdown('toggle');
        checkRedirect('http://' + host + '/nodes/' + encodeURIComponent(getVerySimpleName(nodenameraw)));
      }).fail(function(req){
        if(req.statusText!="abort"){
          var error = 'Node add failed';
          if(req.responseText) {
            var message = JSON.parse(req.responseText);
            error = error + '<br/>' + message['message'];
          }
          alert(error, 'danger');
          $(ele).find('.nodeaddsubmit').prop('disabled', false);
        }
      });
    }
    //return false;
  });
  // fancy panel highlighter
  $('body').on('show.bs.collapse', '[class*="nodel-"] .panel-collapse', function(e){
    if ($(this).is(e.target)) {
      $('.panel.panel-default').removeClass('panel-primary');
      $(this).parent('.panel').addClass('panel-primary');
    }
  });
  $('body').on('hide.bs.collapse', '[class*="nodel-"] .panel-collapse', function(e){
    if ($(this).is(e.target)) {
      $('.panel.panel-default').removeClass('panel-primary');
      $(this).closest('.panel').parent().closest('.panel.panel-default:not(".collapsed")').addClass('panel-primary');
    }
  });
  $('body').on('click', '[class*="nodel-"] .panel-heading', function(e){
    if (!$(this).parent('.panel').hasClass('panel-primary') && !$(this).hasClass('collapsed')) {
      e.stopPropagation();
      $('.panel.panel-default').removeClass('panel-primary');
      $(this).parent('.panel').addClass('panel-primary');
    }
  });
  $('body').on('focus', 'input, button', function() {
    if ($(this).closest('.panel').length && !$(this).closest('.panel').hasClass('panel-primary')) {
      $('.panel.panel-default').removeClass('panel-primary');
      $(this).closest('.panel').addClass('panel-primary');
    } else if (!$(this).closest('.panel').length) {
      $('.panel.panel-default').removeClass('panel-primary');
    };
  });
  $('body').on('keydown', function(e) {
    var charCode = e.charCode || e.keyCode;
    if((charCode == 40) || (charCode == 38) || (charCode == 13) || (charCode == 27)) {
      var ele = $(this).find('div.nodel-list');
      if(ele.length !== 0){
        e.preventDefault();
        if((charCode == 40) || (charCode == 38)) {
          var sub = $(ele).find('a.list-group-item.active');
          var nxt;
          if($(sub).length != 0) {
            if (charCode == 40) {
              nxt = $(sub).nextAll('a.list-group-item:first');
              if($(nxt).length !== 0){
                $(sub).removeClass('active');
                $(nxt).addClass('active');
              }
            } else {
              nxt = $(sub).prevAll('a.list-group-item:first');
              if($(nxt).length !== 0){
                $(sub).removeClass('active');
                $(nxt).addClass('active');
              }
            }
            if($(nxt).length !== 0) {
              var difft = $(nxt).get(0).getBoundingClientRect().top - parseFloat($('body').css('padding-top')) - 20;
              if(difft < 0) {
                $(window).scrollTop($(window).scrollTop() + difft);
              }
              var diffb = $(nxt).get(0).getBoundingClientRect().top - $(window).height() + $(nxt).outerHeight() + parseFloat($('body').css('padding-bottom')) + 20;
              if(diffb > 0) {
                $(window).scrollTop($(window).scrollTop() + diffb);
              }
            }
          } else {
            $(ele).find("a.list-group-item").first().addClass('active');
          }
        } else if (charCode == 13) {
          if((e.target.tagName.toLowerCase() == 'body') || ($(e.target).hasClass('nodelistfilter'))) {
            if($(ele).find('a.list-group-item.active').length){
              $(ele).find('a.list-group-item.active').removeClass('active').get(0).click();
            }
          }
        } else {
          $(ele).find('a.list-group-item.active').removeClass('active');
        }
      }
    }
  });
  $('body').on('keyup','.nodelistfilter', function(e){
    var charCode = e.charCode || e.keyCode;
    if((charCode !== 40) && (charCode !== 38) && (charCode !== 13) && (charCode !== 27)) {
      var filterstr = $(this).val();
      getNodeList(filterstr);
    };
  });
  $('body').on('click','.nodel-list .listmore', function(){
    var ele = $(this).closest('.base').find('.nodelistshow');
    $(ele).find('option:selected').prop('selected', false).next().prop('selected', true);
    $(ele).trigger('change');
  });
  $('body').on('keydown','input', function(e){
    var charCode = e.charCode || e.keyCode;
    if(charCode == 27) {
      $(this).parents('.dropdown.open').find('.dropdown-toggle').dropdown('toggle');
    }
  });
};

var getAction = function(ele){
  var arg = '';
  var action = '';
  var confirm = false;
  var confirmtitle = 'Confirm';
  var confirmtext = 'Are you sure you would like to continue?';
  if (!_.isUndefined($(ele).data('arg-type'))) var type = $(ele).data('arg-type')
  else type = false;
  if (!_.isUndefined($(ele).data('actionon')) && !_.isUndefined($(ele).data('actionoff'))) {
    if ($(ele).hasClass('active')) action = $(ele).data('actionoff');
    else action = $(ele).data('actionon');
    if(!_.isUndefined($(ele).data('confirm'))) {
      confirm = $(ele).data('confirm');
      if(!_.isUndefined($(ele).data('confirmtitle'))) confirmtitle = $(ele).data('confirmtitle');
      if(!_.isUndefined($(ele).data('confirmtext'))) confirmtext = $(ele).data('confirmtext');
    }
  }
  else if (!_.isUndefined($(ele).data('action'))) {
    action = $(ele).data('action');
    if(!_.isUndefined($(ele).data('confirm'))) {
      confirm = $(ele).data('confirm');
      if(!_.isUndefined($(ele).data('confirmtitle'))) confirmtitle = $(ele).data('confirmtitle');
      if(!_.isUndefined($(ele).data('confirmtext'))) confirmtext = $(ele).data('confirmtext');
    }
  }
  else if (!_.isUndefined($(ele).closest('[data-arg-action]').data('arg-action'))) {
    action = $(ele).closest('[data-arg-action]').data('arg-action');
    if(!_.isUndefined($(ele).closest('[data-arg-action]').data('confirm'))) confirm = $(ele).closest('[data-arg-action]').data('confirm');
    if(!_.isUndefined($(ele).closest('[data-arg-action]').data('confirmtitle'))) confirmtitle = $(ele).closest('[data-arg-action]').data('confirmtitle');
    if(!_.isUndefined($(ele).closest('[data-arg-action]').data('confirmtext'))) confirmtext = $(ele).closest('[data-arg-action]').data('confirmtext');
  }
  if (!_.isUndefined($(ele).data('arg-on')) && !_.isUndefined($(ele).data('arg-off'))) {
    if ($(ele).hasClass($(ele).data('class-on'))) arg = stringify({'arg': parseType($(ele).data('arg-off'), type)});
    else arg = stringify({'arg': parseType($(ele).data('arg-on'), type)});
  } else {
    if (!_.isUndefined($(ele).data('arg'))) arg = stringify({'arg':parseType($(ele).data('arg'), type)});
    else if(!_.isUndefined($(ele).data('arg-source'))) {
      if($(ele).data('arg-source') == 'this') val = parseType($(ele).val(), type);
      else val = parseType($($(ele).data('arg-source')).data('arg'), type);
      if(_.isUndefined(val)) val = {};
      if(!_.isUndefined($(ele).data('arg-sourcekey'))) {
        arg = {"arg":{}};
        arg['arg'][$(ele).data('arg-sourcekey')] = val;
        if(!_.isUndefined($(ele).data('arg-add'))) arg = $.extend(true, arg, {'arg': parseType($(ele).data('arg-add'), type)});
        arg = stringify(arg);
      } else arg = stringify({'arg':val});
    } else if ($(ele).is('input[type="checkbox"]')) {
      arg = stringify({'arg':$(ele).prop('checked')});
    } else arg = "{}";
  }
  return {'action': action, 'arg': arg, 'confirm': confirm, 'confirmtitle': confirmtitle, 'confirmtext': confirmtext};
}

var callAction = function(action, arg) {
  $.each($.isArray(action) ? action : [action], function(i, act){
    $.postJSON('http://' + host + '/REST/nodes/' + node + '/actions/' + encodeURIComponent(act) + '/call', arg, function () {
      console.log(act + " - Success");
    }).fail(function (e, s) {
      errtxt = s;
      if (e.responseText) errtxt = s + "\n" + e.responseText;
      console.log("exec - Error:\n" + errtxt, "error");
    });
  });
};

var fillPicker = function() {
  // fill editor file list
  var pickers = $('.nodel-editor select.picker');
  $.each(pickers, function(i,picker) {
    $(picker).empty();
    $(picker).append('<option value="" selected disabled hidden></option>');
    $.getJSON('http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/files', function (data) {
      data.sort(function(a, b){
        if (a['path'] == b['path']) return 0;
        if (a['path'] > b['path']) return 1;
        else return -1;
      });
      $.each(data, function(i, file){
        if(allowedtxt.concat(allowedbinary).indexOf(file['path'].split('.').pop()) > -1) $(picker).append('<option value="'+file['path']+'">'+file['path']+'</option>');
      });
      if((typeof $(picker).data('goto') !== 'undefined') && ($(picker).data('goto') != '')) {
        $(picker).val($(picker).data('goto'));
        $(picker).trigger('change');
        $(picker).data('goto','');
      }
    });
  });
};

var fillUIPicker = function() {
  // fill UI file list
  var pickers = $('select.uipicker');
  $.each(pickers, function(i,picker) {
    $(picker).empty();
    $(picker).append('<option value="" selected disabled hidden>select UI</option>');
    $.getJSON('http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/files', function (data) {
      data.sort(function(a, b){
        if (a['path'] == b['path']) return 0;
        if (a['path'] > b['path']) return 1;
        else return -1;
      });
      $.each(data, function(i, file){
        if(file['path'].match(/content\/(?!index\.htm|nodes\.xml|index-sample.xml|index-sample\.xml\.htm)\w*\.(xml|html|htm)/g)) {
          $(picker).append('<option value="'+file['path'].replace('content/','')+'">'+file['path'].replace('content/','')+'</option>');
        }
      });
      if($(picker).find('option').length == 1 ) {
        $(picker).prop('disabled', true);
      } else {
        $(picker).removeAttr('disabled');
      }
    });
  });
};

// function to update the console
var updateConsoleForm = function(){
  if(typeof $('body').data('nodel-console') == 'undefined'){
    if($(".nodel-console").length) $('body').data('nodel-console', true);
  } 
  if($('body').data('nodel-console')){
    if(!_.isUndefined($('body').data('nodel-console-timer'))) clearTimeout($('body').data('nodel-console-timer'));
    if(!_.isUndefined($('body').data('nodel-console-req'))) $('body').data('nodel-console-req').abort();
    var url;
    if(typeof $('body').data('nodel-console-seq') === "undefined") url = 'http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/console?from=-1&max=200';
    else url = 'http://'+host+'/REST/nodes/'+encodeURIComponent(node)+'/console?from='+$('body').data('nodel-console-seq')+'&max=9999';
    var req = $.getJSON(url, function(data) {
      if(!_.isEmpty(data)){
        data.reverse();
        if (typeof $('body').data('nodel-console-seq') === "undefined") {
          if(data[0] === undefined) $('body').data('nodel-console-seq', 0);
          else $('body').data('nodel-console-seq', data[0].seq);
        }
        var eles = $(".nodel-console");
        var seq = 0;
        $.each(eles, function (i, ele) {
          if ($(ele)[0].scrollHeight - $(ele)[0].scrollTop <= $(ele)[0].clientHeight + 1) var yesscroll = true;
          $.each(data, function(key, value) {
            seq = value.seq;
            (function(key, val, yesscroll, ele) {
              setTimeout(function() {
                var data = $.view($(ele).find('.base')).data['logs'];
                $.observable(data).insert(val);
                if(data.length > 200) $.observable(data).remove(0);
                if(yesscroll) $(ele).scrollTop($(ele)[0].scrollHeight); 
              }, 0);
            })(key, value, yesscroll, ele);
          });
        });
        $('body').data('nodel-console-seq', seq+1);
      }
    }).always(function() {
      $('body').data('nodel-console-timer', setTimeout(function() { updateConsoleForm(); }, 1000));
    });
    $('body').data('nodel-console-req', req);
  }
};

// function to update the console
var updateLogForm = function(){
  if(typeof $('body').data('nodel-serverlog') == 'undefined'){
    if($(".nodel-serverlog").length) $('body').data('nodel-serverlog', true);
  } 
  if($('body').data('nodel-serverlog')){
    if(!_.isUndefined($('body').data('nodel-serverlog-timer'))) clearTimeout($('body').data('nodel-serverlog-timer'));
    if(!_.isUndefined($('body').data('nodel-serverlog-req'))) $('body').data('nodel-serverlog-req').abort();
    var url;
    if(typeof $('body').data('nodel-serverlog-seq') === "undefined") url = 'http://'+host+'/REST/logs?from=-1&max=200';
    else url = 'http://'+host+'/REST/logs?from='+$('body').data('nodel-serverlog-seq')+'&max=9999';
    var req = $.getJSON(url, function(data) {
      if(!_.isEmpty(data)){
        data.reverse();
        if (typeof $('body').data('nodel-serverlog-seq') === "undefined") {
          if(data[0] === undefined) $('body').data('nodel-serverlog-seq', 0);
          else $('body').data('nodel-serverlog-seq', data[0].seq);
        }
        var eles = $(".nodel-serverlog");
        var seq = 0;
        $.each(eles, function (i, ele) {
          if ($(ele)[0].scrollHeight - $(ele)[0].scrollTop <= $(ele)[0].clientHeight + 1) var yesscroll = true;
          $.each(data, function(key, value) {
            seq = value.seq;
            var data = $.view($(ele).find('.base')).data['logs'];
            $.observable(data).insert(value);
            if(data.length > 200) $.observable(data).remove(0);
          });
          if(yesscroll) $(ele).scrollTop($(ele)[0].scrollHeight);
        });
        $('body').data('nodel-serverlog-seq', seq+1);
      }
    }).always(function() {
      $('body').data('nodel-serverlog-timer', setTimeout(function() { updateLogForm(); }, 1000));
    });
    $('body').data('nodel-serverlog-req', req);
  }
};

var updateCharts = function(){
  if(typeof $('body').data('nodel-charts') == 'undefined'){
    if($(".nodel-charts").length) {
      $('body').data('nodel-charts', false);
      googleCharts.GoogleCharts.load(updateCharts);
    }
  } else if(!$('body').data('nodel-charts') && google){
    google.setOnLoadCallback(updateCharts);
    $('body').data('nodel-charts', true);
    $('body').data('nodel-charts-prepared',{});
  } else if($('body').data('nodel-charts')){
    $.getJSON('/REST/diagnostics/measurements', function(rawMeasurements) {
      rawMeasurements.sort(function(x, y) {
        return x.name.localeCompare(y.name);
      });
      rawMeasurements.forEach(function(measurement, i, a) {
        try {
          //drawChart(measurement.values, measurement.isRate, measurement.name);
          if (measurement.isRate) scale = 10;
          else scale = 1;
          var chartData = new google.visualization.DataTable();
          chartData.addColumn('string', measurement.name);
          chartData.addColumn('number', measurement.name);
          measurement.values.forEach(function(element, index, array) {
            chartData.addRow(['', element/scale]);
          });
          var parts = measurement.name.split('.');
          var category, subcategory;
          if (parts.length == 2) {
              category = parts[0];
              subcategory = parts[1];
          } else {
              category = 'general';
              subcategory = measurement.name;
          }
          re = /[^a-zA-Z0-9]/g;
          categoryForDiv = category.replace(re, '_');
          subcategoryForDiv = subcategory.replace(re, '_');
          nameForDiv = measurement.name.replace(re, '_');      
          var categoryDiv = $('#' + categoryForDiv);
          if (categoryDiv.length == 0) {
            $('.nodel-charts').append('<div><h6>' + category + '</h6><hr/><div class="col-sm-12"><div class="row" id="'+categoryForDiv+'"></div></div></div>');
            categoryDiv = $('#' + categoryForDiv);
          }      
          var chartDiv = $('#' + nameForDiv);
          var chart;
          if (chartDiv.length == 0) {
            // console.log('Preparing new ' + nameForDiv);
            chartDiv = categoryDiv.append('<div id="' + nameForDiv + '" class="col-sm-4 chart-min"></div>');    
            chart = {
              chart : new google.visualization.LineChart(document.getElementById(nameForDiv)),
              options : {
                title : subcategory,
                vAxis : {
                  minValue : 0
                },
                legend : {
                  position : 'none'
                }
              }
            };
            var prepared = {};
            prepared[measurement.name] = chart;
            $.extend($('body').data('nodel-charts-prepared'), prepared);
          } else {
            chart = $('body').data('nodel-charts-prepared')[measurement.name];
          }
          chart.chart.draw(chartData, chart.options);
        } catch (err) {
          throw ('draw chart failed related to ' + measurement.name + ': ' + err);
        }
      });
    }).always(function(){
      $('body').data('nodel-charts-timer', setTimeout(function() { updateCharts(); }, 10000));
    });
  }
}

var updateLogs = function(){
  if(!("WebSocket" in window) || ($('body').data('trypoll'))){
    var url;
    if (typeof $('body').data('seq') === "undefined") url = 'http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/activity?from=-1';
    else url = 'http://' + host + '/REST/nodes/' + encodeURIComponent(node) + '/activity?from=' + $('body').data('seq');
    $.getJSON(url, function (data) {
      online();
      if (typeof $('body').data('seq') === "undefined") {
        var noanimate = true;
        $('body').data('seq', -1);
      }
      data.sort(function (a, b) {
        return a.seq < b.seq ? -1 : a.seq > b.seq ? 1 : 0;
      });
      $.each(data, function (key, value) {
        if (value.seq != 0) {
          $('body').data('seq', value.seq + 1);
          throttleLog(value, noanimate);
        }
      });
    }).fail(function() {
      offline();
    }).always(function () {
      $('body').data('update', setTimeout(function() { updateLogs(); }, 1000));
    });
  } else {
    $.getJSON('http://'+host+'/REST/nodes/' + encodeURIComponent(node), function(data){
      var wshost = "ws://"+document.location.hostname+":"+data['webSocketPort']+"/nodes/"+node;
      try{
        var socket = new WebSocket(wshost);
        socket.onopen = function(){
          console.log('Socket Status: '+socket.readyState+' (open)');
          online(socket);
        }
        socket.onmessage = function(msg){
          var data = JSON.parse(msg.data);
          //console.log('Received:');
          //console.log(data);
          if('activityHistory' in data){
            data['activityHistory'].sort(function (a, b) {
              return a.seq < b.seq ? -1 : a.seq > b.seq ? 1 : 0;
            });
            $.each(data['activityHistory'], function() {
              if(this.seq != 0) {
                this.unprocessed = false;
                throttle['logs'][throttle['logs'].length] = this;
                parseLog(this, true);
              }
            });
          } else throttleLog(data['activity']);
        }
        socket.onclose = function(){
          console.log('Socket Status: '+socket.readyState+' (Closed)');
          offline();
          $('body').data('update', setTimeout(function() { updateLogs(); }, 1000));
        }
      } catch(exception){
        console.log('Error: '+exception);
        offline();
        $('body').data('update', setTimeout(function() { updateLogs(); }, 1000));
      }
    }).fail(function(){
      console.log('Error reading configuration (getJSON failed)');
      offline();
      $('body').data('update', setTimeout(function() { updateLogs(); }, 1000));
    });
  }
};

var checkHostOnline = function() {
  var url = 'http://' + host + '/REST/logs?from=0&max=1';
  $.getJSON(url, function (data) {
    online();
  }).fail(function() {
    offline();
  }).always(function () {
    $('body').data('checkonline', setTimeout(function() { checkHostOnline(); }, 1000));
  });
};

var online = function(socket){
  if(socket) $('body').data('timeout', setInterval(function() { socket.send('{}'); }, 1000));
  if(_.isUndefined($('body').data('trypoll'))) {
    $('body').data('trypoll', false);
  };
  $('#offline').modal('hide');
};

var offline = function(){
  clearInterval($('body').data('timeout'));
  if(_.isUndefined($('body').data('trypoll'))) {
    $('body').data('trypoll', true);
    alert('Websockets unavailable, trying polling mode');
  } else {
    $('.modal').modal('hide');
    $('#offline').modal('show');
  }
};

var throttleLog = function(log, ani){
  log.unprocessed = true;
  if(!_.isFunction(throttle['throttle'])) {
    throttle['throttle'] = _.throttle(function(ani) {
      var i = throttle['logs'].length;
      while (i--) {
        if(throttle['logs'][i]['unprocessed']) {
          parseLog(throttle['logs'][i], ani);
          throttle['logs'][i]['unprocessed'] = false;
        }
      }
    }, 200);
  }
  var ind = throttle['logs'].findIndex(function(_ref) {
    id = _ref.type + '_' + _ref.alias;
    return id == log.type + '_' + log.alias;
  });
  if(ind > -1) {
    throttle['logs'].unshift(throttle['logs'].splice(ind, 1)[0]);
    throttle['logs'][0] = log;
  }
  else throttle['logs'][throttle['logs'].length] = log;
  throttle['throttle'](ani);
};

var process_showevent = function(log, ani){
  var eles = $(".nodel-showevent").filter(function() {
    return $.inArray(log.alias, $.isArray($(this).data('showevent')) ? $(this).data('showevent') : [$(this).data('showevent')]) >= 0;
  });
  $.each(eles, function (i, ele) {
    if ($(ele).hasClass('sect')) {
      if($.type(log.arg)== "object") log.arg = log.arg[$(ele).data('showevent-arg')];
      switch ($.type(log.arg)) {
        case "string":
        case "number":
          $(ele).hide();
          $(ele).filter(function() {
            return $.inArray(log.arg, $.isArray($(this).data('showarg')) ? $(this).data('showarg') : [$(this).data('showarg')]) >= 0;
          }).show();
          break;
        case "boolean":
          $(ele).hide();
          if(_.isUndefined($(ele).data('showeventdata'))) $(ele).data('showeventdata', {});
          var val = $(ele).data('showeventdata');
          val[log.alias] = log.arg;
          $(ele).data('showeventdata', val);
          $.each($(ele).data('showeventdata'), function(i, e){
            if(e == true) $(ele).show();
          });
          // fix scroll for hidden console
          $(ele).find('.nodel-console').scrollTop(999999);
          break;
      };
    }
  });
  if(eles.length) updatepadding();
}

var process_event = function(log, ani){
  var eles = $(".nodel-event").filter(function() {
    return $.inArray(log.alias, $.isArray($(this).data('event')) ? $(this).data('event') : [$(this).data('event')]) >= 0;
  });
  $.each(eles, function (i, ele) {
    if($.type(log.arg)== "object") log.arg = log.arg[$(ele).data('event-arg')];
    if($(ele).hasClass('dynamic')) {
      $(ele).data('dynamic',log);
    }
    switch ($.type(log.arg)) {
      case "number":
        if ($(ele).not('.meter, .signal').is("div")) {
          $(ele).children().filter(function () {
            return $(this).attr("data-arg") > log.arg;
          }).removeClass('btn-success').addClass('btn-default');
          $(ele).children().filter(function () {
            return $(this).attr("data-arg") <= log.arg;
          }).removeClass('btn-default').addClass('btn-success');
        } else if ($(ele).hasClass("meter")) {
          updatemeter(ele, log.arg);
        } else if ($(ele).hasClass("signal")) {
          updatesignal(ele, log.arg);
        } else if ($(ele).is("input")) {
          $(ele).not('.active').val(log.arg);
        } else if ($(ele).hasClass('toint')) {
          $(ele).text(parseInt(log.arg));
        } else if ($(ele).hasClass('btn')) {
          $(ele).removeClass($(ele).data('class-on'));
          $(ele).filter(function() {
            return $.inArray(log.arg, $.isArray($(this).data('arg')) ? $(this).data('arg') : [$(this).data('arg')]) >= 0;
          }).addClass($(ele).data('class-on'));
        } else {
          if ($(ele).is("output, span, h4, p")) $(ele).text(log.arg);
          // lists
          $(ele).children('li').has('a[data-arg]').removeClass('active');
          $(ele).children('li').has('a[data-arg="' + log.arg + '"]').addClass('active');
          // button select
          $(ele).parents('.btn-select').children('button').children('span:first-child').text($(ele).children('li').has('a[data-arg="' + log.arg + '"]').text());
          // pages
          $("[data-page]").hide();
          $('[data-page="' + log.arg + '"]').show();
        }
        break;
      case "string":
        if($(ele).hasClass('btn-pswitch')){
          var arg = log.arg.toLowerCase().replace(/[^a-z]+/gi, "");
          switch (arg) {
            case "on":
              $(ele).children('[data-arg="On"]').addClass($(ele).data('class-on')).removeClass('btn-default').removeClass('btn-warning');
              $(ele).children('[data-arg="Off"]').addClass('btn-default').removeClass($(ele).data('class-off')).removeClass('btn-warning');
              break
            case "off":
              $(ele).children('[data-arg="Off"]').addClass($(ele).data('class-off')).removeClass('btn-default').removeClass('btn-warning');
              $(ele).children('[data-arg="On"]').addClass('btn-default').removeClass($(ele).data('class-on')).removeClass('btn-warning');
              break;
            case "partiallyon":
              $(ele).children('[data-arg="On"]').addClass('btn-warning').removeClass('btn-default').removeClass($(ele).data('class-on'));
              $(ele).children('[data-arg="Off"]').addClass('btn-default').removeClass($(ele).data('class-off')).removeClass('btn-warning');
              break
            case "partiallyoff":
              $(ele).children('[data-arg="Off"]').addClass('btn-warning').removeClass('btn-default').removeClass($(ele).data('class-off'));
              $(ele).children('[data-arg="On"]').addClass('btn-default').removeClass($(ele).data('class-on')).removeClass('btn-warning');
              break;
          }
        } else if ($(ele).hasClass('label-pbadge')) {
          var arg = log.arg.toLowerCase().replace(/[^a-z]+/gi, "");
          switch (arg) {
            case "on":
              $(ele).text($(ele).data('on'));
              $(ele).addClass($(ele).data('class-on')).removeClass('label-default').removeClass('label-warning').removeClass($(ele).data('class-off'));
              break;
            case "off":
              $(ele).text($(ele).data('off'));
              $(ele).addClass($(ele).data('class-off')).removeClass('label-default').removeClass('label-warning').removeClass($(ele).data('class-on'));
              break;
            case "partiallyon":
              $(ele).text($(ele).data('on'));
              $(ele).addClass('label-warning').removeClass('label-default').removeClass($(ele).data('class-on')).removeClass($(ele).data('class-off'));
              break;
            case "partiallyoff":
              $(ele).text($(ele).data('off'))
              $(ele).addClass('label-warning').removeClass('label-default').removeClass($(ele).data('class-on')).removeClass($(ele).data('class-off'));
              break;
          }
        } else if ($(ele).hasClass('scrollbar-inner')) {
          var arg = converter.makeHtml(log.arg);
          $(ele).html(arg);
        } else if ($(ele).hasClass('btn')) {
          $(ele).removeClass($(ele).data('class-on'));
          $(ele).filter(function() {
            return $.inArray(log.arg, $.isArray($(this).data('arg')) ? $(this).data('arg') : [$(this).data('arg')]) >= 0;
          }).addClass($(ele).data('class-on'));
        } else {
          if ($(ele).is("span, h4, p")) $(ele).text(log.arg);
          // lists
          $(ele).children('li').has('a[data-arg]').removeClass('active');
          $(ele).children('li').has('a[data-arg="' + log.arg + '"]').addClass('active');
          // button select
          $(ele).parents('.btn-select').children('button').children('span:first-child').text($(ele).children('li').has('a[data-arg="' + log.arg + '"]').text());
          // pages
          $("[data-page]").hide();
          $('[data-page="' + log.arg + '"]').show();
          if($(ele).is("input")) $(ele).not(':active').val(log.arg);
          // image
          if ($(ele).is("img")) $(ele).attr("src", log.arg);
        }
        break;
      case "boolean":
        if($(ele).hasClass('btn-switch')) {
          if (log.arg) {
            $(ele).children('[data-arg=true]').addClass($(ele).data('class-on')).removeClass('btn-default');
            $(ele).children('[data-arg=false]').addClass('btn-default').removeClass($(ele).data('class-off'));
          } else {
            $(ele).children('[data-arg=false]').addClass($(ele).data('class-off')).removeClass('btn-default');
            $(ele).children('[data-arg=true]').addClass('btn-default').removeClass($(ele).data('class-on'));                  
          }
        } else if($(ele).is("a.btn")) {
          if (log.arg) $(ele).addClass($(ele).data('class-on')).removeClass('btn-default');
          else $(ele).addClass('btn-default').removeClass($(ele).data('class-on'));
        } else if($(ele).is("input[type='checkbox'")) {
          $(ele).prop('checked',log.arg);
        } else $(ele).val(log.arg);
        break;
      case "undefined":
        if($(ele).is("span, h4, p, output")) $(ele).text('');
        else if($(ele).is("input")) $(ele).not(':active').val('');
        break;
    }
  });
}

var process_status = function(log, ani) {
  var eles = $(".nodel-status").filter(function() {
    return $.inArray(log.alias, $.isArray($(this).data('status')) ? $(this).data('status') : [$(this).data('status')]) >= 0;
  });
  $.each(eles, function (i, ele) {
    var ele = $(ele);
    var clstype = ele.hasClass('panel') ? 'panel' : 'label';
    if(!_.isUndefined(log.arg) && !_.isUndefined(log.arg['level']) && _.isNumber(log.arg['level'])){
      var msg = '';
      if(!_.isUndefined(log.arg['message']) && _.isString(log.arg['message'])) msg = log.arg['message'];
      ele.find('.status').not('[data-status]').text(msg);
      if(ele.hasClass('status')) ele.text(msg);
      switch(log.arg['level']) {
        case 0:
          ele.removeClass(clstype+'-default '+clstype+'-warning '+clstype+'-danger '+clstype+'-primary').addClass(clstype+'-success');
          break;
        case 1:
          ele.removeClass(clstype+'-default '+clstype+'-success '+clstype+'-danger '+clstype+'-primary').addClass(clstype+'-warning');
          break;
        case 2:
        case 3:
        case 4:
          ele.removeClass(clstype+'-default '+clstype+'-success '+clstype+'-warning '+clstype+'-primary').addClass(clstype+'-danger');
          break;
        case 5:
          ele.removeClass(clstype+'-default '+clstype+'-success '+clstype+'-warning '+clstype+'-danger').addClass(clstype+'-primary');
          break;
      }
    } else if(_.isBoolean(log.arg)) {
      if (log.arg) $(ele).addClass(clstype+'-success').removeClass(clstype+'-default');
      else $(ele).addClass(clstype+'-default').removeClass(clstype+'-success');
    }
  });
}

var process_render = function(log, ani){
  var eles = $(".nodel-render").filter(function() {
    return $.inArray(log.alias, $.isArray($(this).data('render')) ? $(this).data('render') : [$(this).data('render')]) >= 0;
  });
  $.each(eles, function (i, ele) {
    if($(ele).data('render-template')) {
      try {
        $(ele).html($($(ele).data('render-template')).render(log));
        if(!_.isUndefined($(ele).data('dynamic'))) parseLog($(ele).data('dynamic'));
      } catch(err) {
        console.log(err.message);
      } finally {
        return true;
      }
    }
  });
}

var process_form = function(log, ani){
  var eles = $(".nodel-schema-"+log.type).filter(function() {
    return $.inArray(log.alias, $.isArray($(this).data('name')) ? $(this).data('name') : [$(this).data('name')]) >= 0;
  });
  $.each(eles, function (i, ele) {
    $.observable($.view($(ele).find('.base')).data).setProperty({'arg':log.arg});
    if(!ani) {
      var col = log.type == 'action' ? colours['success'] : colours['danger'];
      var def = colours['default'];
      $(ele).find('button[type="submit"] > span').stop(true, true).css({'color': col}).animate({'color': def}, 1000);
    };
  });
}

var process_log = function(log, ani){
  var eles = $(".nodel-log");
  var alias = encodr(log.alias);
  $.each(eles, function (i, ele) {
    var src = $.view($(ele).find('.base')).data;
    var data = src['logs'];
    var ind = data.findIndex(function(_ref) {
      id = _ref.type + '_' + _ref.alias;
      return id == log.type + '_' + alias;
    });
    var entry = {
      'alias':alias,
      'rawalias':log.alias,
      'type':log.type,
      'source':log.source,
      'arg':log.arg,
      'timestamp': log.timestamp};
    if(ind > -1) {
      // lock height while updating to prevent scrolling
      var ul = $(ele).find('ul');
      $(ul).css("height", $(ul).height());
      $.observable(data[ind]).setProperty({'arg': entry.arg, 'timestamp': entry.timestamp});
      if(!src.hold) $.observable(data).move(ind, 0);
      $(ul).css("height", 'auto');
    } else $.observable(data).insert(0, entry);
    // animate icon
    if(!ani) {
      $(ele).find('.log_'+log.type+'_'+alias+ ' .logicon').stop(true,true).css({'opacity': 1}).animate({'opacity': 0.2}, 1000);
    }
  });
}

var parseLog = function(log, ani){
  if(log.type=='event' && log.source=='local'){
    switch(log.alias) {
      case "Title":
        $('#title, title').text(log.arg)
        console.log(log.arg);
        break;
      case "Clock":
        var time = moment(log.arg).utcOffset(log.arg);
        $('#clock').data('time',time).text(time.format('h:mm:ss a'));
        break;
      default:
        // handle show-hide events
        (function(log, ani) {
          setTimeout(function() {process_showevent(log, ani), 0});
        })(log, ani);
        // handle event data updates
        (function(log, ani) {
          setTimeout(function() {process_event(log, ani), 0});
        })(log, ani);
        // handle status update
        (function(log, ani) {
          setTimeout(function() {process_status(log, ani), 0});
        })(log, ani);
        // handel dynamic templates
        (function(log, ani) {
          setTimeout(function() {process_render(log, ani), 0});
        })(log, ani);
    }
  }
  if(log.source=='local'){
    // nodel forms
    (function(log, ani) {
      setTimeout(function() {process_form(log, ani), 0});
    })(log, ani);
  }
  // process binding events
  if(log.source=='remote'){
    if(log.type == "eventBinding"){
      var eles = $(".nodel-remote");
      var alias = encodr(log.alias);
      $.each(eles, function(i, ele) {
        var data = $.view($(ele).find('.base')).data;
        $.observable(data.events[alias]).setProperty('_$status', log.arg);
        linkToNode(data.events[alias].node, 'events', alias);
      });
    } else if(log.type == "actionBinding"){
      var eles = $(".nodel-remote");
      var alias = encodr(log.alias);
      $.each(eles, function(i, ele) {
        var data = $.view($(ele).find('.base')).data;
        $.observable(data.actions[alias]).setProperty('_$status', log.arg);
        linkToNode(data.actions[alias].node, 'actions', alias);
      });
    }
  }
  // nodel log
  (function(log, ani) {
    setTimeout(function() {process_log(log, ani), 0});
  })(log, ani);
};