var $main = $('#main');

var SessionData = {
  data: {},

  load: function() {
    this.data = JSON.parse(window.localStorage.getItem("bglab-data"));
    if (!this.data) {
      this.data = {};
      return null;
    }
    return this.data;
  },

  reset: function() {
    window.localStorage.removeItem("bglab-data");
  },

  mustExist: function(key, def) {
    if (typeof this.get(key) == 'undefined') {
      this.set(key, def);
    }
  },

  set: function(key, value) {
    this.data[key] = value;
    window.localStorage.setItem("bglab-data", JSON.stringify(this.data));
    return this;
  },

  get: function(key) {
    return this.data[key];
  }
}

var CSSProperty = function(title, property) {

  var $container = $("#properties")
    , values = []
    , $el = $('<div/>').addClass("property")
    , current
    , help
    , isCSS = true
    , onChange
    , formatter
    , styler;

  current = SessionData.get(property);

  function _format(obj) {
    if (formatter) {
      return formatter.apply(obj);
    } else {
      return current;
    }
  };

  function _style(obj) {
    if (styler) {
      return styler.apply(obj);
    } else {
      return function() {};
    }
  };

  function _onChange(obj, newValue) {
    if (onChange && typeof onChange == 'function') {
      return onChange.apply(obj, [newValue]);
    }
  };

  var customValue = SessionData.get(property + "-custom");
  if (typeof customValue !== 'undefined' && null !== customValue) {
    current = customValue;
  }

  return {

    add: function(name, value, isInput, size) {
      values.push({value: value, name: name, isInput: isInput, size: size || 40});
      return this;
    },

    render: function() {
      var _self = this;
      $el.on("click", "li", function(evt) {
        if ($(this).hasClass('input')) {
          return;
        }

        current = $(this).data("value");
        _self.activate(this);
        _style(_self);
        SessionData.set(property, current);
        SessionData.set(property + '-custom', null);
        _onChange(_self, current);
        App.showCode();
      });

      var $title = $("<b/>").text(title).appendTo($el);
      if (help) {
        $("<a>").attr({'href': help, 'target': '_blank'}).text("?").appendTo($title);
      }
      $el.append("<br/>");
      var $list = $("<ul/>").attr("id", property).addClass("values");
      var $active, $input;

      values.forEach(function(val) {
        var $li = $("<li>");
        if (val.isInput) {
          $li.addClass("input");
          $input = $("<input/>").attr("type", "text").attr("size", val.size).attr("id", "custom-" + property);
          $li.append($input);
          $li.append("<span>&nbsp;&crarr;&nbsp;</span>")
        } else {
          $li.html(val.name).data("value", val.value);
          if (val.value == current) {
            $active = $li;
          }
        }
        $list.append($li);
      });

      if ($input) {
        var _self = this;
        $input.on("change", function(e) {
            current = $(this).val();
            _style(_self);
            $(this).parents("ul").find(".active").removeClass('active');
            SessionData.set(property, "custom");
            SessionData.set(property + '-custom', current);
            _onChange(_self, current);
            App.showCode();
        });

        $input.val(customValue);
      }

      $el.append($list);

      $container.append($el);

      $active && $active.addClass("active");

      _style(this);

      return this;
    },

    get current() {
      return current;
    },

    set help(v) {
      help = v;
    },

    set isCSS(v) {
      isCSS = v;
    },

    get isCSS() {
      return isCSS;
    },

    toString: function() {
      if (!isCSS || current == '') {
        return "";
      }
      return property + ": " + _format(this) + ";\n";
    },

    set styler(v) {
      styler = v;
    },

    set formatter(v) {
      formatter = v;
    },

    set onChange(f) {
      onChange = f;
    },

    activate: function(el) {
      $(el).parent().find(".active").removeClass('active');
      $(el).addClass("active");
    },

    printCurrent: function(current) {
      var c = '('+current.replace(',', "x")+')';
      $('#current-dimension').html(c);
    }

  }
}

SessionData.load();

SessionData.mustExist('resolution', "320,480");
SessionData.mustExist('orientation', "portrait");
SessionData.mustExist('background-size', "");
SessionData.mustExist('background-size-custom', null);
SessionData.mustExist('background-position', "");
SessionData.mustExist('background-position-custom', null);
SessionData.mustExist('background-color', "white");
SessionData.mustExist('background-color-custom', null);
SessionData.mustExist('background-image', "default.jpg");
SessionData.mustExist('background-repeat', "no-repeat");
SessionData.mustExist('images-backlog', []);

var App = {

  props: [],

  $code: $("#code"),

  start: function() {

    this.props.forEach(function(prop) {
      prop.render();
    });

    $("#show-code").on("click", function() {
      this.$code.toggle();
      $("#show-code").text(this.$code.is(":visible") ? "Hide code" : "Show code");
      if (this.$code.is(":visible")) {
        this.showCode();
      }
      return false;
    }.bind(this));

    $("#reset").on("click", function() {
      SessionData.reset();
      window.location.reload();
      return false;
    }.bind(this));

    this.refreshImagesBacklog();
  },

  showCode: function() {
    this.$code.empty();

    this.props.forEach(function(prop) {
      if (!prop.isCSS) {
        return;
      }
      this.$code.text(this.$code.text() + prop.toString());
    }.bind(this));

  },

  add: function(prop) {
    this.props.push(prop);
  },

  refreshImagesBacklog: function() {
    var $ib = $('#images-backlog')
      , ib = SessionData.get('images-backlog');

    $ib.empty();
    ib.reverse().forEach(function(val) {
      var $li = $('<li>' + val + '</li>');
      $li.on("click", function() {
        $('#custom-background-image').val($(this).text()).focus();
        window.scrollTo(0,1);
      });
      $li.appendTo($ib);
    });

  }

};

var prop;

prop = new CSSProperty("Background Image", "background-image");
prop.help = "https://developer.mozilla.org/en-US/docs/CSS/background-image";
prop.add("custom", "", true);
prop.formatter = function() {
  return "url(" + this.current + ")";
};
prop.styler = function() {
  $main.css({"background-image": (this.current ? "url(" + this.current + ")" : "none")});
  $("#original").attr("src", this.current);
};
prop.onChange = function(value) {
  value = value.trim();
  if (value == '') {
    return;
  }
  var ib = SessionData.get('images-backlog');
  if (ib.indexOf(value) == -1) {
    ib.push(value);
    SessionData.set('images-backlog', ib);
    App.refreshImagesBacklog();
  }
};

App.add(prop);

prop = new CSSProperty("Orientation", "orientation");
prop.help = "https://developer.mozilla.org/en-US/docs/Detecting_device_orientation";
prop.add("Portrait", "portrait")
    .add("Landscape", "landscape");
prop.styler = function() {
  $main.get(0).className = "";
  $main.addClass(this.current);
  $main.css({width: $main.css("height"), height: $main.css("width")});
};
prop.isCSS = false;

App.add(prop);

prop = new CSSProperty("Resolution", "resolution");
prop.help = "http://developer.android.com/about/dashboards/index.html";
prop.add("320 <i>×</i> 480", "320,480")
    .add("480 <i>×</i> 640", "480,640")
    .add("480 <i>×</i> 800", "480,800")
    .add("640 <i>×</i> 960", "640,960")
    .add("640 <i>×</i> 1136", "640,1136")
    .add("720 <i>×</i> 1280", "720,1280")
    .add("768 <i>×</i> 1024", "768,1024")
    .add("800 <i>×</i> 1280", "800,1280");
prop.styler = function() {
  var dim = this.current.split(",");
  $main.css({width: dim[$(main).hasClass('portrait') ? 0 : 1], height: dim[$(main).hasClass('portrait') ? 1 : 0]});
};
prop.isCSS = false;

App.add(prop);

prop = new CSSProperty("Background Size", "background-size");
prop.help = "https://developer.mozilla.org/en-US/docs/CSS/background-size";
prop.add("Cover", "cover")
    .add("Contain", "contain")
    .add("Auto", "auto")
    .add("100%", "100%")
    .add("custom", "", true, 10);
prop.styler = function() {
  if (this.current == "") {
    return;
  }
  var p0 = $main.css("background-size");
  $main.css({"background-size": this.current});
  var p1 = $main.css("background-size");
  if (p0 == p1 && p0 != this.current) {
    $("#custom-bg-size").css({"border-color": "red"})
    console.log("Unable to set the background-size to " + this.current);
  } else {
    $("#custom-bg-size").css({"border-color": "green"})
  }
};

App.add(prop);

prop = new CSSProperty("Background Position", "background-position");
prop.help = "https://developer.mozilla.org/en-US/docs/CSS/background-position";
prop.add("Top", "top")
    .add("Center", "center")
    .add("Bottom", "bottom")
    .add("Left", "left")
    .add("Right", "right")
    .add("custom", "", true, 10);
prop.styler = function() {
  $main.css({"background-position": this.current});
};

App.add(prop);

prop = new CSSProperty("Background Color", "background-color");
prop.help = "https://developer.mozilla.org/en-US/docs/CSS/background-color";
prop.add("White", "white")
    .add("Black", "black")
    .add("custom", "", true, 5);
prop.styler = function() {
  $main.css({"background-color": this.current});
};

App.add(prop);

prop = new CSSProperty("Background Repeat", "background-repeat");
prop.help = "https://developer.mozilla.org/en-US/docs/CSS/background-repeat";
prop.add("No", "no-repeat")
    .add("Yes", "repeat")
    .add("X", "repeat-x")
    .add("Y", "repeat-y")
    .add("Round", "round")
    .add("Space", "space");
prop.styler = function() {
  $main.css({"background-repeat": this.current});
};

App.add(prop);

prop = new CSSProperty("Major Devices", "device");
prop.add("iPhone 3/3G/4/4S, iPod", "320,480")
    .add("iPhone 5", "640,1136")
    .add("iPad", "768,1024")
    .add("Samsung Galaxy SII, Nexus S, HTC", "480,800")
    .add("Samsung Galaxy SIII", "720,1280")
prop.styler = function() {
  var dim = this.current.split(",");
  $main.css({width: dim[$(main).hasClass('portrait') ? 0 : 1], height: dim[$(main).hasClass('portrait') ? 1 : 0]});
};
prop.isCSS = false;

App.add(prop);


App.start();