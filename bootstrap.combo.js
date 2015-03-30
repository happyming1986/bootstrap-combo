/*
 * 一个粗略可用的autocomplete插件
 * author: manxingxing@gmail.com
 * date: 2014-12-17
 */
;
(function ($, window, document, undefined) {
  var pluginName = "SimpleAutoComplete";
  var focusClass = pluginName + '-focus',
    focusEvent = pluginName + '.focus', // 鼠标悬浮在选项上
    selectEvent = pluginName + '.selected'; //

  var _ = {
    inputEventSupport: function () {
      var input = document.createElement('input');
      return 'oninput' in input;
    }(),
    propertyChangeSupport: function () {
      var input = document.createElement('input');
      return 'onpropertychange' in input;
    }()
  }

  // constructor
  function SimpleAutoComplete(element, options) {

    this.input = $(element);

    var container = $("<div/>").addClass(pluginName + '-container');
    var list = $("<ul/>").addClass('dropdown-menu').attr({role: 'menu'});

    this.container = this.input.wrap(container).parent();
    this.list = list.appendTo(this.container);
    if (options && options.source) {
      this.source = options.source;
    } else {
      if (this.input.data("source")) {
        this.source = this.input.data("source").split('|');
      } else {
        this.source = [];
      }
    }

    this._name = pluginName;
    this.init();
  }

  $.extend(SimpleAutoComplete.prototype, {
    init: function () {
      this.defineEventListeners();
    },
    autocomplete: function () {
      if (!$.isArray(this.source)) {
        return
      }

      var $this = this,
        txt = this.input.val().toLowerCase(),
        result = [];
      this.list.empty();

      if ($.trim(txt) == '') {
        result = this.source;
      } else {
        result = $.grep(this.source, function (x) {
          return x.toLowerCase().indexOf(txt) > -1
        })
      }
      $.each(result, function (i, x) {
        $("<li/>").text(x).appendTo($this.list);
      });

      result.length > 0 ? this.open() : this.close()
    },
    defineEventListeners: function () {
      var $this = this;

      $this.input.focus(function () {
        $(document).click();
        $this.autocomplete();
      });

      $this.list.on(focusEvent, 'li', function () {
        $this.resetFocusStatus();
        $(this).addClass(focusClass);
      })

      $this.list.on(selectEvent, 'li', function () {
        $this.input.val($(this).text());
        $this.close();
      });

      $this.list.on('click', 'li', function () {
        $(this).trigger(selectEvent);
      });

      $this.container.on('mouseenter', 'li', function () {
        $(this).trigger(focusEvent);
      });

      // close dropdown when click outside
      $this.container.click(function (evt) {
        evt.stopPropagation();
      })
      $(document).click(function () {
        $this.close();
      })

      // filter
      if (_.inputEventSupport) {
        $this.input.on('input', function () {
          $this.autocomplete();
        });
      } else {
        $this.input.on('propertychange', function (evt) {
          if (evt.propertyName == 'value') {
            $this.autocomplete();
          }
        });
      }

      // key
      $this.input.keydown(function (evt) {
        var keycode = evt.which;
        if (keycode != 40  // down
          && keycode != 38 // up
          && keycode != 13 // enter
          && keycode != 27 // esc
        ) {
          return;
        }

        evt.preventDefault(); // prvent default action

        if (!$this.container.hasClass('open') && keycode != 40) {
          return;
        } // press down to open dropdown again

        if (keycode == 27) {
          $this.close();
        }

        var selectedNow = $("." + focusClass, $this.list).get(0);

        if (keycode == 13 && selectedNow) { // enter to select current highlighted option
          $(selectedNow).trigger(selectEvent);
        }

        if (keycode == 40) {
          if (!$this.container.hasClass('open')) { // press down to open dropdown again
            $this.autocomplete();
          }
          if (!selectedNow) {
            $("li:first", $this.list).trigger(focusEvent);
          } else {
            var nextChoice = $(selectedNow).next('li')[0];
            if (nextChoice) {
              $(nextChoice).trigger(focusEvent);
            }
          }
        }

        if (keycode == 38) {
          if (!selectedNow) {
            $("li:visible", $this.list).last().trigger(focusEvent);
          } else {
            var prevChoice = $(selectedNow).prev('li')[0];
            if (prevChoice) {
              $(prevChoice).trigger(focusEvent);
            }
          }
        }
      })
    },
    resetFocusStatus: function () {
      $('li.' + focusClass, this.list).removeClass(focusClass);
    },
    updateSource: function (newSource) {
      if (!$.isArray(newSource)) {
        $.error('source should be an Array');
      }
      this.source = $.map(newSource[0], function (x) {
        return x.toString();
      });
    },
    open: function () {
      this.container.addClass('open')
    },
    close: function () {
      this.container.removeClass('open');
      this.resetFocusStatus();
    }
  });

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[pluginName] = function (options) {
    if (this.size() > 1) {
      $(this).each(function () {
        $(this).SimpleAutoComplete();
      })
      return
    }

    if (!options) {
      options = {};
    }
    if (!$(this).length) {
      return $(this);
    }

    var instance = $(this).data("plugin_" + pluginName);

    if (instance &&
      typeof options == 'string' &&
      typeof instance[options] == 'function') {
      instance[options].call(instance, [].slice.call(arguments, 1));
    } else if ($.isPlainObject(options)) {
      $(this).data("plugin_" + pluginName, new SimpleAutoComplete(this, options));
    } else if (!instance) {
      $.error('Plugin must be initialised before using method: ' + options);
    } else {
      $.error('Method ' + options + ' does not exist.');
    }

  };
})(jQuery, window, document);
