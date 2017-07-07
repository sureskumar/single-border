(function () {
  
  var debugMode = false;

  var _submit,
    _close,
    send_top,
    send_pos_top,
    send_thick_top,
    send_right,
    send_pos_right,
    send_thick_right,
    send_bottom,
    send_pos_bottom,
    send_thick_bottom,
    send_left,
    send_pos_left,
    send_thick_left;

  _close = function () {
    var options = {};
    MDAction('closePanel', options);
  }

  _cancel = function () {
    var options = {};
    MDAction('cancelPanel', options);
  }

  var _sendVal = function (element, lessThan, sendVal) {
      if($(element).val().trim() < lessThan || isNaN($(element).val().trim())) {
        return sendVal;
      } else {
        return $(element).val().trim();
      }
  }

  _submit = function () {
  
      var options = {};          
      
      options.send_top = $('#toggle_top').is(':checked');
      _superDebug("options.send_top", options.send_top);

      if ($('#toggle_top').is(':checked')) {
        options.send_pos_top = $('#pos_top').val().trim();
      } else {
        options.send_pos_top = "Inside";
      }
      _superDebug("options.send_pos_top", options.send_pos_top);

      options.send_thick_top = _sendVal('#thick_top', 0.2, 1);
      _superDebug("options.send_thick_top", options.send_thick_top);


      options.send_right = $('#toggle_right').is(':checked');
      _superDebug("options.send_right", options.send_right);

      if ($('#toggle_right').is(':checked')) {
        options.send_pos_right = $('#pos_right').val().trim();
      } else {
        options.send_pos_right = "Inside";
      }
      _superDebug("options.send_pos_right", options.send_pos_right);

      options.send_thick_right = _sendVal('#thick_right', 0.2, 1);
      _superDebug("options.send_thick_right", options.send_thick_right);


      options.send_bottom = $('#toggle_bottom').is(':checked');
      _superDebug("options.send_bottom", options.send_bottom);

      if ($('#toggle_bottom').is(':checked')) {
        options.send_pos_bottom = $('#pos_bottom').val().trim();
      } else {
        options.send_pos_bottom = "Inside";
      }
      _superDebug("options.send_pos_bottom", options.send_pos_bottom);

      options.send_thick_bottom = _sendVal('#thick_bottom', 0.2, 1);
      _superDebug("options.send_thick_bottom", options.send_thick_bottom);


      options.send_left = $('#toggle_left').is(':checked');
      _superDebug("options.send_left", options.send_left);

      if ($('#toggle_left').is(':checked')) {
        options.send_pos_left = $('#pos_left').val().trim();
      } else {
        options.send_pos_left = "Inside";
      }
      _superDebug("options.send_pos_left", options.send_pos_left);

      options.send_thick_left = _sendVal('#thick_left', 0.2, 1);
      _superDebug("options.send_thick_left", options.send_thick_left);

    
      MDAction('submit', options);
    
  }

    
    $('#close').on('click', _cancel);    
    $('#done').on('click', _close);    
    

    var _onChangeTrigger = function (element) {
      $(element).on('click',function() {
          _submit();  
      });
    }

    var _onChangeInput = function (element) {
      $(element).on('input',function() {
          _submit();  
      });
    }


// Input updates
_onChangeTrigger("#toggle_top");
_onChangeTrigger("#pos_top");
_onChangeInput("#thick_top");

_onChangeTrigger("#toggle_right");
_onChangeTrigger("#pos_right");
_onChangeInput("#thick_right");

_onChangeTrigger("#toggle_bottom");
_onChangeTrigger("#pos_bottom");
_onChangeInput("#thick_bottom");

_onChangeTrigger("#toggle_left");
_onChangeTrigger("#pos_left");
_onChangeInput("#thick_left");        


var _superDebug = function (lbl, val) {
  if(debugMode) {
      //if(isNaN(val)) {
        //  console.log("SB - " + lbl);
      //} else {
          console.log("SB - " + lbl + ": " + val);  
      //}
  }
}



_toggleTop = function () {
    if ($('#toggle_top').is(':checked')) {
        $('#pos_top').prop('disabled', false);
        $('#thick_top').prop('disabled', false);
        $('#thick_top').fadeTo( 10, 1.0 );
    } else {
        $('#pos_top').prop('disabled', true);
        $('#thick_top').prop('disabled', true);
        $('#thick_top').fadeTo( 10, 0.5 );
    }
}

_toggleTop();

_toggleRight = function () {
    if ($('#toggle_right').is(':checked')) {
        $('#pos_right').prop('disabled', false);
        $('#thick_right').prop('disabled', false);
        $('#thick_right').fadeTo( 10, 1.0 );
    } else {
        $('#pos_right').prop('disabled', true);
        $('#thick_right').prop('disabled', true);
        $('#thick_right').fadeTo( 10, 0.5 );
    }
}

_toggleRight();

_toggleBottom = function () {
    if ($('#toggle_bottom').is(':checked')) {
        $('#pos_bottom').prop('disabled', false);
        $('#thick_bottom').prop('disabled', false);
        $('#thick_bottom').fadeTo( 10, 1.0 );
    } else {
        $('#pos_bottom').prop('disabled', true);
        $('#thick_bottom').prop('disabled', true);
        $('#thick_bottom').fadeTo( 10, 0.5 );
    }
}

_toggleBottom();

_toggleLeft = function () {
    if ($('#toggle_left').is(':checked')) {
        $('#pos_left').prop('disabled', false);
        $('#thick_left').prop('disabled', false);
        $('#thick_left').fadeTo( 10, 1.0 );
    } else {
        $('#pos_left').prop('disabled', true);
        $('#thick_left').prop('disabled', true);
        $('#thick_left').fadeTo( 10, 0.5 );
    }
}

_toggleLeft();


$('#done').focus();

$('#toggle_top').on('change', _toggleTop);
$('#toggle_right').on('change', _toggleRight);
$('#toggle_bottom').on('change', _toggleBottom);
$('#toggle_left').on('change', _toggleLeft);


})(jQuery);