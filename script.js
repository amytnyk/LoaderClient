function parseIntMod(v) {
	if (v == "")
		return 0;
	return parseInt(v);
}

$.fn.center = function () {
  this.css('left', $(window).width()/2 - ($(this).width() + parseIntMod($(this).css("padding-left")) + parseIntMod($(this).css("border-width")) + parseIntMod($(this).css("padding-right")))/2);
};

function resize() {
  $('.loading_text').center();
  $('.percentage').center();
  $('.loader').center();
  $(".loading_text").css("top", $(".loader").css("top", "30%").position().top + $(".loader").height() + parseIntMod($(".loader").css("border-width")) + parseIntMod($(".loader").css('marginTop')) * 2);
  $(".percentage").css("top", $(".loading_text").position().top + $(".loading_text").height() + parseIntMod($(".percentage").css("margin-top")));
  $(".description").css("top", $(".percentage").position().top + $(".percentage").height() + parseIntMod($(".description").css("margin-top")));
}

function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

function animate() {
  $(window).resize(function() {resize();  });
  $(".loader").animate({ top: "30%", opacity: 1}, 1000);
  resize();
  $(".loading_text").animate({ opacity: 1 }, 1000);
  $(".percentage").animate({ opacity: 1 }, 1000);
  $(".description").animate({ opacity: 1 }, 1000);
}

function hideIndicators() {
  console.log("HII");
  $(".saved_indicator").stop().animate({ right: -$(".saved_indicator").width() - parseInt($(".saved_indicator").css("padding-left")) - parseInt($(".saved_indicator").css("padding-right"))}, 500);
  $(".not_saved_indicator").stop().animate({ right: -$(".not_saved_indicator").width() - parseInt($(".not_saved_indicator").css("padding-left")) - parseInt($(".not_saved_indicator").css("padding-right"))}, 500);
}

function showSaved() {
  $(".saved_indicator").animate({ right: 0 }, 500);
  clearTimeout(timeout);
  timeout = setTimeout(hideIndicators, 3000);
}

function showNotSaved() {
  $(".not_saved_indicator").animate({ right: 0 }, 500);
  clearTimeout(timeout);
  timeout = setTimeout(hideIndicators, 3000);
}

const request_frequency = 500;
const url = "http://localhost:8000/";
const chunk_size = 5000;
let request_interval = null;
let first_try = true;
let timeout;

$(window).on("load", function() {
  $.support.cors = true;
  hideIndicators();
  //     UI
  $(".ui").hide();
  $(".loader_div").hide();
  $('button').focus(function() {
    this.blur();
  });
  //

  // Handle cancel_btn
  $(".cancel_btn").on("click", function() {
    clearInterval(request_interval);
  });
  //

  // Handle save_btn
  $(".save_btn").on("click", function() {
    let str = $(".input_text").val();
    let chunks_len = parseInt(str.length % chunk_size == 0 ? str.length / chunk_size : str.length / chunk_size + 1);
    let sent_chunks = 0;

    while (sent_chunks < chunks_len) {
      $.ajax({
        type: 'POST',
        url: url,
        contentType: 'application/x-www-form-urlencoded; charset=utf-8',
        crossdomain: true,
        dataType: "jsonp",
        data: {
          action: "save",
          text: str.substr(sent_chunks * chunk_size, chunk_size),
          chunk: sent_chunks == chunks_len - 1 ? "last" : "middle"
        },
        xhrFields: {
          withCredentials: false
        },

        headers: {
        },

        success: function(responseText) {
          console.log(chunks_len);
          console.log(responseText);
          if (responseText.state == "Saved") { // All is OK
            if (responseText.last_chunk)
              showSaved();
          } else { // Very bad
            sent_chunks = chunks_len;
            showNotSaved();
          }
        },

        timeout: 20000,

        error: function() {
          sent_chunks = chunks_len;
          showNotSaved();
        }
      });
      sent_chunks++;
    }
  });
  //

  //     Request
  request_interval = setInterval(function() {
    $.ajax({
      type: 'POST',
      url: url,
      contentType: 'application/x-www-form-urlencoded; charset=utf-8',
      crossdomain: true,
      xhrFields: {
        withCredentials: false
      },

      headers: {
      },

      data: {
        action: "get"
      },

      success: function(responseText) {
        let j_obj = JSON.parse(responseText);
        if (j_obj.state == "Loading") {
          if (first_try) {
            $(".pre_loader").hide();
            $(".loader_div").show();
            animate();
          }
          $(".percentage").html(j_obj.data);
          $(".description").html(j_obj.description);
        }
        else if (j_obj.state == "Loaded") {
          $(".pre_loader").hide();
          $(".loader_div").hide();
          $(".ui").show();
          $(".input_text").val(j_obj.data);
          clearInterval(request_interval);
        }
        $('.percentage').center();
        $('.description').center();
      },


      error: function() {
      }
    });
  }, request_frequency);
  //

});
