//
//  Created by Sures Kumar
//  sureskumar.com
//  sures.srinivasan@gmail.com
//

var loop, 
ori_layer_name, 
created_looper_group, 
ori_x, 
ori_y;
var opacity_val = 0;
var debugMode = false;

var layer, layerX, layerY, layerW, layerH;
var sx1, sy1, sx2, sy2, sx3, sy3, sx4, sy4;
var sx1a, sy1a, sx2a, sy2a, sx3a, sy3a, sx4a, sy4a;

var MD = {
  init: function (context, command, args) {
    var commandOptions = '' + args;
    this.prefs = NSUserDefaults.standardUserDefaults();
    this.context = context;
    this.version = this.context.plugin.version() + "";
    this.MDVersion = this.prefs.stringForKey("MDVersion") + "" || 0;
    this.extend(context);
    this.pluginRoot = this.scriptPath
      .stringByDeletingLastPathComponent()
      .stringByDeletingLastPathComponent()
      .stringByDeletingLastPathComponent();
    this.pluginSketch = this.pluginRoot + "/Contents/Sketch/scripts";
    this.resources = this.pluginRoot + '/Contents/Resources';
    coscript.setShouldKeepAround(false);
    if (command && command == "init") {
      return false;
    }
    this.document = context.document;
    this.documentData = this.document.documentData();
    this.UIMetadata = context.document.mutableUIMetadata();
    this.window = this.document.window();
    this.pages = this.document.pages();
    this.page = this.document.currentPage();
    this.artboard = this.page.currentArtboard();
    this.current = this.artboard || this.page;
    if (command) {
      switch (command) {
        case "generate-pattern":
          this.Pattern();
          break;
      }
    }
  },
  extend: function(options, target) {
    var target = target || this;
    for (var key in options) {
      target[key] = options[key];
    }
    return target;
  }
};

MD.extend({
    prefix: "MDConfig",
    getConfigs: function(container){
        var configsData;
        if(container){
            configsData = this.command.valueForKey_onLayer(this.prefix, container);
        }
        else{
            configsData = this.UIMetadata.objectForKey(this.prefix);
        }
        return JSON.parse(configsData);
    },
     setConfigs: function(newConfigs, container){
        var configsData;
        newConfigs.timestamp = new Date().getTime();
        if(container){
            configsData = this.extend(newConfigs, this.getConfigs(container) || {});
            this.command.setValue_forKey_onLayer(JSON.stringify(configsData), this.prefix, container);
        }
        else{
            configsData = this.extend(newConfigs, this.getConfigs() || {});
            this.UIMetadata.setObject_forKey (JSON.stringify(configsData), this.prefix);
        }
        var saveDoc = this.addShape();
        this.page.addLayers([saveDoc]);
        this.removeLayer(saveDoc);
        return configsData;
    },
    removeConfigs: function(container){
        if(container){
            this.command.setValue_forKey_onLayer(null, prefix, container);
        }
        else{
            configsData = this.UIMetadata.setObject_forKey (null, this.prefix);
        }
    }
});

MD.extend({
  addShape: function () {
    var shape = MSRectangleShape.alloc().initWithFrame(NSMakeRect(0, 0, 100, 100));
    return MSShapeGroup.shapeWithPath(shape);
  },
  removeLayer: function (layer) {
    var container = layer.parentGroup();
    if (container) container.removeLayer(layer);
  }
});

MD.extend({
  createCocoaObject: function (methods, superclass) {
    var uniqueClassName = "MD.sketch_" + NSUUID.UUID().UUIDString();
    var classDesc = MOClassDescription.allocateDescriptionForClassWithName_superclass_(uniqueClassName, superclass || NSObject);
    classDesc.registerClass();
    for (var selectorString in methods) {
      var selector = NSSelectorFromString(selectorString);
      [classDesc addInstanceMethodWithSelector:selector function:(methods[selectorString])];
    }
    return NSClassFromString(uniqueClassName).new();
  },

  addFirstMouseAcceptor: function (webView, contentView) {
    var button = this.createCocoaObject({
      'mouseDown:': function (evt) {
        this.removeFromSuperview();
        NSApplication.sharedApplication().sendEvent(evt);
      },
    }, NSButton);
    button.setIdentifier('firstMouseAcceptor');
    button.setTransparent(true);
    button.setTranslatesAutoresizingMaskIntoConstraints(false);
    contentView.addSubview(button);
    var views = {
      button: button,
      webView: webView
    };
    // Match width of WebView.
    contentView.addConstraints([NSLayoutConstraint
            constraintsWithVisualFormat:'H:[button(==webView)]'
            options:NSLayoutFormatDirectionLeadingToTrailing
            metrics:null
            views:views]);
    // Match height of WebView.
    contentView.addConstraints([NSLayoutConstraint
            constraintsWithVisualFormat:'V:[button(==webView)]'
            options:NSLayoutFormatDirectionLeadingToTrailing
            metrics:null
            views:views]);
    // Match top of WebView.
    contentView.addConstraints([[NSLayoutConstraint
            constraintWithItem:button attribute:NSLayoutAttributeTop
            relatedBy:NSLayoutRelationEqual toItem:webView
            attribute:NSLayoutAttributeTop multiplier:1 constant:0]]);
  },

  MDPanel: function (options) {
    var self = this,
      threadDictionary,
      options = this.extend(options, {
        url: this.pluginSketch + "/panel/chips.html",
        width: 240,
        height: 316,
        floatWindow: false,
        hiddenClose: false,
        data: {},
        callback: function (data) { return data; }
      }),
      result = false;
    options.url = encodeURI("file://" + options.url);
    var frame = NSMakeRect(0, 0, options.width, (options.height + 24)),
      titleBgColor = NSColor.colorWithRed_green_blue_alpha(0 / 255, 145 / 255, 234 / 255, 1),
      contentBgColor = NSColor.colorWithRed_green_blue_alpha(1, 1, 1, 1);
    if (options.identifier) {
      threadDictionary = NSThread.mainThread().threadDictionary();
    }
    if (options.identifier && threadDictionary[options.identifier]) {
      return false;
    }
    var Panel = NSPanel.alloc().init();
    Panel.setTitleVisibility(NSWindowTitleHidden);
    Panel.setTitlebarAppearsTransparent(true);
    Panel.standardWindowButton(NSWindowCloseButton).setHidden(options.hiddenClose);
    Panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
    Panel.standardWindowButton(NSWindowZoomButton).setHidden(true);
    Panel.setFrame_display(frame, true);
    Panel.setBackgroundColor(contentBgColor);
    Panel.setWorksWhenModal(true);
    if (options.floatWindow) {
      Panel.becomeKeyWindow();
      Panel.setLevel(NSFloatingWindowLevel);
      threadDictionary[options.identifier] = Panel;
      // Long-running script
      COScript.currentCOScript().setShouldKeepAround_(true);
    }
    var contentView = Panel.contentView(),
      webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, options.width, options.height));
    var windowObject = webView.windowScriptObject();
    contentView.setWantsLayer(true);
    contentView.layer().setFrame(contentView.frame());
    webView.setBackgroundColor(contentBgColor);
    webView.setMainFrameURL_(options.url);
    contentView.addSubview(webView);
    var delegate = new MochaJSDelegate({
      "webView:didFinishLoadForFrame:": (function (webView, webFrame) {
        var MDAction = [
          "function MDAction(hash, data) {",
            "if(data){ window.MDData = encodeURI(JSON.stringify(data)); }",
            "window.location.hash = hash;",
          "}"
        ].join(""),
          DOMReady = [
            "$(", "function(){", "init(" + JSON.stringify(options.data) + ")", "}",");"
          ].join("");
        windowObject.evaluateWebScript(MDAction);
        windowObject.evaluateWebScript(DOMReady);
      }),
      "webView:didChangeLocationWithinPageForFrame:": (function (webView, webFrame) {
        var request = NSURL.URLWithString(webView.mainFrameURL()).fragment();
        if (request == "submit") {
          var data = JSON.parse(decodeURI(windowObject.valueForKey("MDData")));
          options.callback(data);
          result = true;
        }
        if (request == "closePanel") {
            windowObject.evaluateWebScript("window.location.hash = 'close';");
        }
        if (request == "cancelPanel") {
            var data = JSON.parse(decodeURI(windowObject.valueForKey("MDData")));
            options.callback(data, 1);
            result = true;
            windowObject.evaluateWebScript("window.location.hash = 'close';");
        }
        if (request == 'drag-end') {
          var data = JSON.parse(decodeURI(windowObject.valueForKey("MDData")));
          MD.Importer().convertSvgToSymbol(data);
          result = true;
        }
        if (request == 'onWindowDidBlur') {
          MD.addFirstMouseAcceptor(webView, contentView);
        }
        if (request == "close") {
          if (!options.floatWindow) {
            Panel.orderOut(nil);
            NSApp.stopModal();
          }
          else {
            Panel.close();
          }
        }
        if (request == "focus") {
          var point = Panel.currentEvent().locationInWindow(),
            y = NSHeight(Panel.frame()) - point.y - 24;
          windowObject.evaluateWebScript("lookupItemInput(" + point.x + ", " + y + ")");
        }
        windowObject.evaluateWebScript("window.location.hash = '';");
      })
    });
    webView.setFrameLoadDelegate_(delegate.getClassInstance());
    if (options.floatWindow) {
      Panel.center();
      Panel.makeKeyAndOrderFront(nil);
    }
    var closeButton = Panel.standardWindowButton(NSWindowCloseButton);
    closeButton.setCOSJSTargetFunction(function (sender) {
      var request = NSURL.URLWithString(webView.mainFrameURL()).fragment();
      if (options.floatWindow && request == "submit") {
        data = JSON.parse(decodeURI(windowObject.valueForKey("MDData")));
        options.callback(data);
      }
      if (options.identifier) {
        threadDictionary.removeObjectForKey(options.identifier);
      }
      self.wantsStop = true;
      if (options.floatWindow) {
        Panel.close();
      }
      else {
        Panel.orderOut(nil);
        NSApp.stopModal();
      }
    });
    closeButton.setAction("callAction:");
    var titlebarView = contentView.superview().titlebarViewController().view(),
    titlebarContainerView = titlebarView.superview();
    closeButton.setFrameOrigin(NSMakePoint(4, 4));
    titlebarContainerView.setFrame(NSMakeRect(0, options.height, options.width, 24));
    titlebarView.setFrameSize(NSMakeSize(options.width, 24));
    titlebarView.setTransparent(true);
    titlebarView.setBackgroundColor(titleBgColor);
    titlebarContainerView.superview().setBackgroundColor(titleBgColor);
    if (!options.floatWindow) {
      NSApp.runModalForWindow(Panel);
    }
    return result;
  },

  patternPanel: function () {
    var self = this,
      data = {};
    var loopedOnce = 0;
    return this.MDPanel({
      url: this.pluginSketch + "/panel/table.html",
      width: 200,
      height: 180,
      data: data,
      identifier: 'com.google.material.pattern',
      floatWindow: false,
      callback: function (data, cl) {
        self.configs = self.setConfigs({
          table: data
        });
        if(self.configs) {  
            
            var top_temp = "Top_" + ori_layer_name;
            var right_temp = "Right_" + ori_layer_name;
            var bottom_temp = "Bottom_" + ori_layer_name;
            var left_temp = "Left_" + ori_layer_name;

            MD.superDebug("Panel returned value");

            var layers = MD.current.layers()
            for (var iaa=0; iaa < 4; iaa++) {
                for (var ia=0; ia < [layers count]; ia++) {
                    var layer = [layers objectAtIndex:ia]
                    if(layer.name() == top_temp || 
                      layer.name() == right_temp || 
                      layer.name() == bottom_temp || 
                      layer.name() == left_temp){
                      //log("Deleting " + layer.name());
                      layer.removeFromParent();
                    }
                }
            }

            if(cl == 1) {
            } else {
              MD.runLooper();  
            }
            
            
        }
      },
    });
  },

  runLooper: function () {

    selection = MD.context.selection;

    var send_top = MD.configs.table.send_top;
    MD.superDebug("send_top", send_top);

    var send_pos_top = MD.configs.table.send_pos_top;
    MD.superDebug("send_pos_top", send_pos_top);

    var send_thick_top = MD.configs.table.send_thick_top;
    MD.superDebug("send_thick_top", send_thick_top);


    var send_right = MD.configs.table.send_right;
    MD.superDebug("send_right", send_right);

    var send_pos_right = MD.configs.table.send_pos_right;
    MD.superDebug("send_pos_right", send_pos_right);

    var send_thick_right = MD.configs.table.send_thick_right;
    MD.superDebug("send_thick_right", send_thick_right);


    var send_bottom = MD.configs.table.send_bottom;
    MD.superDebug("send_bottom", send_bottom);

    var send_pos_bottom = MD.configs.table.send_pos_bottom;
    MD.superDebug("send_pos_bottom", send_pos_bottom);

    var send_thick_bottom = MD.configs.table.send_thick_bottom;
    MD.superDebug("send_thick_bottom", send_thick_bottom);


    var send_left = MD.configs.table.send_left;
    MD.superDebug("send_left", send_left);

    var send_pos_left = MD.configs.table.send_pos_left;
    MD.superDebug("send_pos_left", send_pos_left);

    var send_thick_left = MD.configs.table.send_thick_left;
    MD.superDebug("send_thick_left", send_thick_left);


    // Calculate co-ordinates

    sx1 = layerX;
    sy1 = layerY;
    
    sx2 = layerX + layerW;
    sy2 = layerY;

    sx3 = layerX + layerW;
    sy3 = layerY + layerH;

    sx4 = layerX;
    sy4 = layerY + layerH;

    if(send_top && send_left) {
      sx1a = layerX + parseFloat(send_thick_left);
      sy1a = layerY + parseFloat(send_thick_top);
    } else if (send_top) {
      sx1a = layerX;
      sy1a = layerY + parseFloat(send_thick_top);
    } else if (send_left) {
      sx1a = layerX + parseFloat(send_thick_left);
      sy1a = layerY;
    }

    if(send_top && send_right) {
      sx2a = layerX + layerW - parseFloat(send_thick_right);
      sy2a = layerY + parseFloat(send_thick_top);  
    } else if(send_top) {
      sx2a = layerX + layerW;
      sy2a = layerY + parseFloat(send_thick_top);
    } else if(send_right) {
      sx2a = layerX + layerW - parseFloat(send_thick_right);
      sy2a = layerY;
    }

    if(send_right && send_bottom) {
      sx3a = layerX + layerW - parseFloat(send_thick_right);
      sy3a = layerY + layerH - parseFloat(send_thick_bottom);
    } else if (send_right) {
      sx3a = layerX + layerW - parseFloat(send_thick_right);
      sy3a = layerY + layerH;
    } else if (send_bottom) {
      sx3a = layerX + layerW;
      sy3a = layerY + layerH - parseFloat(send_thick_bottom);
    }

    if(send_bottom && send_left) {
      sx4a = layerX + parseFloat(send_thick_left);
      sy4a = layerY + layerH - parseFloat(send_thick_bottom);
    } else if (send_bottom) {
      sx4a = layerX;
      sy4a = layerY + layerH - parseFloat(send_thick_bottom);
    } else if (send_left) {
      sx4a = layerX + parseFloat(send_thick_left);
      sy4a = layerY + layerH
    }

    if(send_pos_top == "Center") {
      sy1 = sy1 - (send_thick_top / 2);
      sy2 = sy2 - (send_thick_top / 2);
      sy1a = sy1a - (send_thick_top / 2);
      sy2a = sy2a - (send_thick_top / 2);
    } else if (send_pos_top == "Outside") {
      sy1 = sy1 - parseFloat(send_thick_top);
      sy2 = sy2 - parseFloat(send_thick_top);
      sy1a = sy1a - parseFloat(send_thick_top);
      sy2a = sy2a - parseFloat(send_thick_top);
    }

    if(send_pos_right == "Center") {
      sx2 = sx2 + (send_thick_right / 2);
      sx2a = sx2a + (send_thick_right / 2);
      sx3 = sx3 + (send_thick_right / 2);
      sx3a = sx3a + (send_thick_right / 2);
    } else if (send_pos_right == "Outside") {
      sx2 = sx2 + parseFloat(send_thick_right);
      sx2a = sx2a + parseFloat(send_thick_right);
      sx3 = sx3 + parseFloat(send_thick_right);
      sx3a = sx3a + parseFloat(send_thick_right);
    }


    if(send_pos_bottom == "Center") {
      sy4 = sy4 + (send_thick_bottom / 2);
      sy4a = sy4a + (send_thick_bottom / 2);
      sy3 = sy3 + (send_thick_bottom / 2);
      sy3a = sy3a + (send_thick_bottom / 2);
    } else if (send_pos_bottom == "Outside") {
      sy4 = sy4 + parseFloat(send_thick_bottom);
      sy4a = sy4a + parseFloat(send_thick_bottom);
      sy3 = sy3 + parseFloat(send_thick_bottom);
      sy3a = sy3a + parseFloat(send_thick_bottom);
    }

    if(send_pos_left == "Center") {
      sx1 = sx1 - (send_thick_left / 2);
      sx1a = sx1a - (send_thick_left / 2);
      sx4 = sx4 - (send_thick_left / 2);
      sx4a = sx4a - (send_thick_left / 2);
    } else if (send_pos_left == "Outside") {
      sx1 = sx1 - parseFloat(send_thick_left);
      sx1a = sx1a - parseFloat(send_thick_left);
      sx4 = sx4 - parseFloat(send_thick_left);
      sx4a = sx4a - parseFloat(send_thick_left);
    }


    // Draw the borders
    if(send_top) {
       MD.drawBorder("Top");
    }

    if(send_right) {
       MD.drawBorder("Right");
    }

    if(send_bottom) {
       MD.drawBorder("Bottom");
    }

    if(send_left) {
       MD.drawBorder("Left");
    }


  },

  drawBorder: function(pos) {

    if(pos == "Top") {
        var x1 = sx1;
        var y1 = sy1;

        var x2 = sx2;
        var y2 = sy2;

        var x3 = sx2a;
        var y3 = sy2a;

        var x4 = sx1a;
        var y4 = sy1a;
    }

    if(pos == "Right") {
        var x1 = sx2;
        var y1 = sy2;

        var x2 = sx3;
        var y2 = sy3;

        var x3 = sx3a;
        var y3 = sy3a;

        var x4 = sx2a;
        var y4 = sy2a;
    }

    if(pos == "Bottom") {
        var x1 = sx3;
        var y1 = sy3;

        var x2 = sx4;
        var y2 = sy4;

        var x3 = sx4a;
        var y3 = sy4a;

        var x4 = sx3a;
        var y4 = sy3a;
    }

    if(pos == "Left") {
        var x1 = sx4;
        var y1 = sy4;

        var x2 = sx1;
        var y2 = sy1;

        var x3 = sx1a;
        var y3 = sy1a;

        var x4 = sx4a;
        var y4 = sy4a;
    }


    var path = NSBezierPath.bezierPath();
    path.moveToPoint(NSMakePoint(x1, y1));
    path.lineToPoint(NSMakePoint(x2, y2));
    path.lineToPoint(NSMakePoint(x3, y3));
    path.lineToPoint(NSMakePoint(x4, y4));
    path.closePath();


    var shape = MSShapeGroup.shapeWithBezierPath(path);
    var border = shape.style().addStylePartOfType(0);
    
    var color1 = MSColor.colorWithRed_green_blue_alpha(0.6, 0.6, 0.6, 1.0);
    var color2 = MSColor.colorWithRed_green_blue_alpha(0.45, 0.45, 0.45, 1.0);

    if(pos == "Top") {
      border.color = color1;
    }

    if(pos == "Right") {
      border.color = color2;
    }

    if(pos == "Bottom") {
      border.color = color1;
    }

    if(pos == "Left") {
      border.color = color2;
    }
    

    var temp_name = pos + "_" + ori_layer_name;
    shape.setName(temp_name);
    MD.current.addLayers([shape]);
  },

  superDebug: function( lbl, val )
  {
      if(debugMode) {
        log("SUPER FORMULA - " + lbl + ": " + val);  
      }
  }


});



MD["Pattern"] = function()
{
    var self = MD,
    selection = MD.context.selection;   
    var self = this;


    this.scriptPath = MD.context.scriptPath;
    this.scriptPathRoot = this.scriptPath.stringByDeletingLastPathComponent();
    this.scriptResourcesPath = this.scriptPathRoot.stringByDeletingLastPathComponent() + '/Resources';
    var icon = NSImage.alloc().initByReferencingFile(this.scriptResourcesPath + '/' + "icon.png");


    var runPLugin = function()
    {
        if (selection.count() <= 0) {
          sendEvent(MD.context, 'Error', 'No layer selected');
          showDialog("Single Border", "Please select a rectangle to apply border. Cheers!");
        } else if(selection.count() > 1) {
          sendEvent(MD.context, 'Error', 'More than 1 layer selected');
          showDialog("Single Border", "Please select only one rectangle to apply border. Cheers!");
        } else {
              var layer = selection[0];
              ori_layer_name = layer.objectID();
              
              /*if(MD.artboard) {
                  layerX = layer.frame().x();
                  superDebug("layerX", layerX);
                  
                  layerY = layer.frame().y();
                  superDebug("layerY", layerY);
                  
                  layerW = layer.frame().width();
                  superDebug("layerW", layerW);
                  
                  layerH = layer.frame().height();
                  superDebug("layerH", layerH);
              } else {
                */
                  var rect = layer.absoluteRect();

                  layerX = rect.x();
                  superDebug("layerX", layerX);
                  
                  layerY = rect.y();
                  superDebug("layerY", layerY);
                  
                  layerW = rect.width();
                  superDebug("layerW", layerW);
                  
                  layerH = rect.height();
                  superDebug("layerH", layerH);
             // }              

              sendEvent(MD.context, 'Success', 'UI Modal opened');
              MD.patternPanel();
        }      
    }

    var superDebug = function( lbl, val )
    {
        if(debugMode) {
          log("SUPER FORMULA - " + lbl + ": " + val);  
        }
    }

    var showDialog = function(title, informativeText) {
      var alert = [[NSAlert alloc] init]
      [alert setMessageText: title]
      [alert setInformativeText: informativeText]
      [alert addButtonWithTitle: "OK"] // 1000
      alert.setIcon(icon);
      var responseCode = [alert runModal]
    }

  runPLugin();
}

var kUUIDKey = 'google.analytics.uuid'
var uuid = NSUserDefaults.standardUserDefaults().objectForKey(kUUIDKey)
if (!uuid) {
  uuid = NSUUID.UUID().UUIDString()
  NSUserDefaults.standardUserDefaults().setObject_forKey(uuid, kUUIDKey)
}

function jsonToQueryString(json) {
  return '?' + Object.keys(json).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
  }).join('&')
}

var index = function (context, trackingId, hitType, props) {
  var payload = {
    v: 1,
    tid: trackingId,
    ds: 'Sketch%20' + NSBundle.mainBundle().objectForInfoDictionaryKey("CFBundleShortVersionString"),
    cid: uuid,
    t: hitType,
    an: context.plugin.name(),
    aid: context.plugin.identifier(),
    av: context.plugin.version()
  }
  if (props) {
    Object.keys(props).forEach(function (key) {
      payload[key] = props[key]
    })
  }

  var url = NSURL.URLWithString(
    NSString.stringWithFormat("https://www.google-analytics.com/collect%@", jsonToQueryString(payload))
  )

  if (url) {
    NSURLSession.sharedSession().dataTaskWithURL(url).resume()
  }
}

var key = 'UA-102183635-1';
var sendEvent = function (context, category, action, label) {
  //log("GA called");
  var payload = {};
  payload.ec = category;
  payload.ea = action;
  return index(context, key, 'event', payload);
}